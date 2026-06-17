import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Trophy,
  Home,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck,
  Send
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { QuestionCard } from '@/components/business/QuestionCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Countdown } from '@/components/common/Countdown';
import { questionList } from '@/data/questions';
import { getLevelById, getRandomQuestionsForLevel } from '@/data/levels';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useLearningStore } from '@/store/useLearningStore';
import { getMistakeType, checkAnswer } from '@/utils/calculation';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/format';

export const LevelSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    sessionId,
    questions, 
    currentQuestionIndex, 
    userAnswers,
    submittedQuestions,
    startTime,
    startPractice, 
    nextQuestion, 
    prevQuestion,
    goToQuestion,
    submitAll,
    reset
  } = usePracticeStore();
  const { addAnswerRecord, addMistake, updateLevelProgress } = useLearningStore();
  
  const [level, setLevel] = useState<ReturnType<typeof getLevelById>>(undefined);
  const [hasStarted, setHasStarted] = useState(false);
  const [actualTimeSpent, setActualTimeSpent] = useState(0);
  const timeSpentRef = useRef(0);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/levels');
      return;
    }

    const levelData = getLevelById(parseInt(id));
    if (!levelData) {
      navigate('/levels');
      return;
    }

    setLevel(levelData);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [id]);

  const handleStart = () => {
    if (!level) return;

    const questionIds = getRandomQuestionsForLevel(level);
    const selectedQuestions = questionIds
      .map(qid => questionList.find(q => q.id === qid))
      .filter((q): q is typeof questionList[0] => q !== undefined);

    startPractice(selectedQuestions);
    setHasStarted(true);
    setActualTimeSpent(0);
    timeSpentRef.current = 0;
    
    timerIntervalRef.current = window.setInterval(() => {
      timeSpentRef.current += 1;
      setActualTimeSpent(timeSpentRef.current);
    }, 1000);
  };

  const finishExam = useCallback((forceSubmitAll: boolean = true) => {
    if (!level) return;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    const unanswered = questions.filter(q => !submittedQuestions[q.id]);
    unanswered.forEach(q => {
      if (userAnswers[q.id] !== undefined) {
        const result = checkAnswer(q, userAnswers[q.id]);
        addAnswerRecord({
          questionId: q.id,
          userAnswer: userAnswers[q.id] || '',
          isCorrect: result.isCorrect,
          timeSpent: 0,
          sessionId: sessionId || undefined,
        });
        if (!result.isCorrect) {
          const mistakeType = getMistakeType(q);
          addMistake(q, userAnswers[q.id] || '', mistakeType as any, sessionId || undefined);
        }
      }
    });
    
    const result = submitAll();
    const isPassed = result.score >= level.passScore;
    
    updateLevelProgress({
      levelId: level.id,
      isPassed,
      bestScore: result.score,
      bestTime: actualTimeSpent,
      attemptDate: new Date().toISOString(),
    });
    
    navigate(`/levels/${level.id}/report`);
  }, [level, questions, submittedQuestions, userAnswers, sessionId, submitAll, actualTimeSpent, addAnswerRecord, addMistake, updateLevelProgress, navigate]);

  const handleTimeUp = useCallback(() => {
    finishExam(true);
  }, [finishExam]);

  const handleQuestionSubmit = (result: { isCorrect: boolean; timeSpent: number; score: number; maxScore: number; feedback?: string; matchedKeywords?: string[]; missingKeywords?: string[] }) => {
    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) return;
    const question = questions[currentQuestionIndex];
    if (!question) return;

    const userAnswer = userAnswers[question.id];
    
    const isNewRecord = addAnswerRecord({
      questionId: question.id,
      userAnswer: userAnswer || '',
      isCorrect: result.isCorrect,
      timeSpent: result.timeSpent,
      sessionId: sessionId || undefined,
    });
    
    if (isNewRecord && !result.isCorrect) {
      const mistakeType = getMistakeType(question);
      addMistake(
        question,
        userAnswer || '',
        mistakeType as any,
        sessionId || undefined
      );
    }
  };

  const handleSubmitAll = () => {
    const unanswered = questions.filter(q => userAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      if (!confirm(`还有 ${unanswered.length} 题未作答，确定要提交吗？未作答将判为错误。`)) {
        return;
      }
    }
    
    const unsubmitted = questions.filter(q => !submittedQuestions[q.id] && userAnswers[q.id] !== undefined);
    if (unsubmitted.length > 0) {
      if (!confirm(`还有 ${unsubmitted.length} 题已填写但未点击【提交判定】，系统将自动判定，确定继续吗？`)) {
        return;
      }
    }
    
    finishExam(true);
  };

  const handleRetry = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    reset();
    setHasStarted(false);
  };

  if (!level) {
    return (
      <PageLayout>
        <div className="p-6 lg:p-8 text-center py-16">
          <p className="text-slate-500">加载中...</p>
        </div>
      </PageLayout>
    );
  }

  if (!hasStarted) {
    return (
      <PageLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <div className="card p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold font-display mb-2">{level.name}</h1>
            <p className="text-slate-500 mb-8">{level.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl">
                <Clock className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">限时</p>
                <p className="text-xl font-bold text-slate-900">{formatTime(level.timeLimit)}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <Trophy className="w-6 h-6 text-accent-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">及格线</p>
                <p className="text-xl font-bold text-slate-900">{level.passScore}分</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-danger-500 mx-auto mb-2" />
                <p className="text-sm text-slate-500">题目数</p>
                <p className="text-xl font-bold text-slate-900">{level.totalQuestions}题</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-left">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                考核须知
              </h4>
              <ul className="text-sm text-amber-700 space-y-1.5">
                <li>• 答题开始后倒计时立即启动，请注意答题节奏</li>
                <li>• 每道题需点击【提交判定】后才计入正式成绩</li>
                <li>• 可在题目间自由切换，但最后30秒会有红色提醒</li>
                <li>• 时间到系统会自动提交当前已判定的答题结果</li>
                <li>• 达到及格线视为通过，可解锁更高等级关卡</li>
                <li>• 考核结果将作为培训成绩记录在成绩面板中</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/levels')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回选关
              </button>
              <button onClick={handleStart} className="btn-primary text-lg px-8 py-3">
                <FileCheck className="w-5 h-5 mr-2" />
                开始考核
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const submittedCount = Object.keys(submittedQuestions).length;

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => {
              if (confirm('确定要退出吗？当前考核将视为放弃，进度不会保留。')) {
                if (timerIntervalRef.current) {
                  clearInterval(timerIntervalRef.current);
                }
                reset();
                navigate('/levels');
              }
            }} 
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            退出考核
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-success-500" />
                已判 {submittedCount}/{questions.length}
              </span>
              <span className="text-slate-600">
                <XCircle className="w-3.5 h-3.5 inline mr-1 text-primary-500" />
                已填 {answeredCount - submittedCount}
              </span>
              <span className="text-slate-600">
                用时 {formatTime(actualTimeSpent)}
              </span>
            </div>
            <span className="font-medium text-slate-700">{level.name}</span>
            <Countdown 
              seconds={level.timeLimit} 
              onComplete={handleTimeUp}
              showWarning={true}
            />
          </div>
        </div>

        {/* Progress */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">
              第 {currentQuestionIndex + 1} / {questions.length} 题
            </span>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-success-100" /> 判定正确
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-danger-100" /> 判定错误
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-primary-100" /> 已填待判
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-slate-200" /> 未作答
              </span>
            </div>
          </div>
          <ProgressBar 
            value={currentQuestionIndex + 1} 
            max={questions.length} 
            showLabel={false} 
          />
          
          <div className="mt-4 flex flex-wrap gap-2">
            {questions.map((q, index) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isSubmitted = submittedQuestions[q.id];
              const isCorrect = isSubmitted && userAnswers[q.id] !== undefined
                ? checkAnswer(q, userAnswers[q.id]).isCorrect
                : null;
              const isCurrent = index === currentQuestionIndex;
              
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                    isCurrent && 'ring-2 ring-primary-500 ring-offset-2',
                    isSubmitted && isCorrect === true && 'bg-success-100 text-success-700 hover:bg-success-200',
                    isSubmitted && isCorrect === false && 'bg-danger-100 text-danger-700 hover:bg-danger-200',
                    !isSubmitted && isAnswered && 'bg-primary-100 text-primary-700 hover:bg-primary-200',
                    !isAnswered && !isCurrent && 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {currentQuestion && (
          <div className="animate-fade-in-up" key={currentQuestion.id}>
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              showFeedback={submittedQuestions[currentQuestion.id]}
              onSubmit={handleQuestionSubmit}
            />
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className={cn(
              'btn-secondary',
              currentQuestionIndex === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            上一题
          </button>
          
          {currentQuestionIndex >= questions.length - 1 ? (
            <button
              onClick={handleSubmitAll}
              className="btn-success flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              提交考卷
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="btn-primary"
            >
              下一题
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
        
        {currentQuestionIndex < questions.length - 1 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleSubmitAll}
              className="btn-secondary text-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              提前交卷
            </button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
