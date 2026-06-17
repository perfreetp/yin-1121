import { useState, useEffect, useCallback } from 'react';
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
  XCircle
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
    questions, 
    currentQuestionIndex, 
    userAnswers,
    startPractice, 
    nextQuestion, 
    prevQuestion,
    goToQuestion,
    reset
  } = usePracticeStore();
  const { addAnswerRecord, addMistake, updateLevelProgress } = useLearningStore();
  
  const [level, setLevel] = useState<ReturnType<typeof getLevelById>>(undefined);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    score: number;
    timeSpent: number;
    isPassed: boolean;
  } | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});

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
      reset();
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
    setShowResults(false);
    setResults(null);
    setSubmittedAnswers({});
  };

  const calculateResults = useCallback(() => {
    if (!level) return;

    const totalCorrect = questions.reduce((count, q) => {
      const ans = userAnswers[q.id];
      if (ans === undefined) return count;
      const result = checkAnswer(q, ans);
      return count + (result.isCorrect ? 1 : 0);
    }, 0);

    const timeSpent = level.timeLimit - 0;
    const score = Math.round((totalCorrect / questions.length) * 100);
    const isPassed = score >= level.passScore;

    setResults({
      correct: totalCorrect,
      total: questions.length,
      score,
      timeSpent: level.timeLimit - 0,
      isPassed,
    });
    setShowResults(true);

    updateLevelProgress({
      levelId: level.id,
      isPassed,
      bestScore: score,
      bestTime: level.timeLimit - 0,
      attemptDate: new Date().toISOString(),
    });
  }, [level, questions, userAnswers, updateLevelProgress]);

  const handleTimeUp = useCallback(() => {
    calculateResults();
  }, [calculateResults]);

  const handleQuestionSubmit = (questionId: string, result: { isCorrect: boolean; timeSpent: number }) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    const userAnswer = userAnswers[questionId];
    
    addAnswerRecord({
      questionId,
      userAnswer: userAnswer || '',
      isCorrect: result.isCorrect,
      timeSpent: result.timeSpent,
    });

    if (!result.isCorrect) {
      const mistakeType = getMistakeType(question);
      addMistake(
        question,
        userAnswer || '',
        mistakeType as any
      );
    }

    setSubmittedAnswers(prev => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const handleSubmitAll = () => {
    const unanswered = questions.filter(q => userAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      if (!confirm(`还有 ${unanswered.length} 题未作答，确定要提交吗？`)) {
        return;
      }
    }
    
    questions.forEach(q => {
      if (userAnswers[q.id] !== undefined && !submittedAnswers[q.id]) {
        const result = checkAnswer(q, userAnswers[q.id]);
        handleQuestionSubmit(q.id, { ...result, timeSpent: 0 });
      }
    });

    calculateResults();
  };

  const handleRetry = () => {
    setHasStarted(false);
    setShowResults(false);
    setResults(null);
    setSubmittedAnswers({});
    reset();
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

  // Start Screen
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
                注意事项
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• 答题开始后倒计时立即启动，中途退出视为放弃</li>
                <li>• 最后30秒倒计时会变红提醒，请注意时间</li>
                <li>• 时间到系统会自动提交当前答题结果</li>
                <li>• 及格线以上视为通过，可解锁下一关卡</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/levels')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回选关
              </button>
              <button onClick={handleStart} className="btn-primary text-lg px-8 py-3">
                开始挑战
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Results Screen
  if (showResults && results) {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-success-600';
      if (score >= level.passScore) return 'text-accent-600';
      return 'text-danger-600';
    };

    const getScoreBg = (score: number) => {
      if (score >= 90) return 'from-success-500 to-success-700';
      if (score >= level.passScore) return 'from-accent-500 to-accent-700';
      return 'from-danger-500 to-danger-700';
    };

    return (
      <PageLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="card p-8 text-center animate-fade-in-up">
            <div className={cn(
              'w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-6',
              getScoreBg(results.score)
            )}>
              {results.isPassed ? (
                <Trophy className="w-12 h-12 text-white" />
              ) : (
                <AlertTriangle className="w-12 h-12 text-white" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold font-display mb-2">
              {results.isPassed ? '挑战成功！' : '挑战失败'}
            </h1>
            <p className="text-slate-500 mb-2">
              {results.isPassed 
                ? '恭喜你通过了本关，继续挑战更高等级吧！' 
                : `未达到及格线 ${level.passScore} 分，继续努力！`}
            </p>
            {results.isPassed && level.id < 3 && (
              <p className="text-success-600 font-medium mb-6">
                ✨ 已解锁「{getLevelById(level.id + 1)?.name}」
              </p>
            )}

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">得分</p>
                <p className={cn('text-3xl font-bold', getScoreColor(results.score))}>
                  {results.score}分
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">正确率</p>
                <p className="text-3xl font-bold text-primary-600">
                  {results.correct}/{results.total}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">用时</p>
                <p className="text-3xl font-bold text-accent-600">
                  {formatTime(results.timeSpent)}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-slate-900 mb-4">答题概览</h3>
              <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
                {questions.map((q, index) => {
                  const userAnswer = userAnswers[q.id];
                  const isCorrect = userAnswer !== undefined && checkAnswer(q, userAnswer).isCorrect;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(index)}
                      className={cn(
                        'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                        userAnswer === undefined
                          ? 'bg-slate-100 text-slate-400'
                          : isCorrect 
                            ? 'bg-success-100 text-success-700 hover:bg-success-200' 
                            : 'bg-danger-100 text-danger-700 hover:bg-danger-200'
                      )}
                    >
                      {userAnswer === undefined ? '-' : index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 mt-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-success-100" /> 正确
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-danger-100" /> 错误
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-slate-100" /> 未答
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleRetry} className="btn-secondary">
                <RotateCcw className="w-4 h-4 mr-2" />
                再试一次
              </button>
              <button onClick={() => navigate('/levels')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回选关
              </button>
              <button onClick={() => navigate('/')} className="btn-primary">
                <Home className="w-4 h-4 mr-2" />
                返回首页
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  // Quiz Screen
  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => {
              if (confirm('确定要退出吗？当前进度将不会保存。')) {
                navigate('/levels');
              }
            }} 
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            退出
          </button>
          
          <div className="flex items-center gap-4">
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
            <span className="text-sm text-slate-600">
              已答 {answeredCount} 题
            </span>
          </div>
          <ProgressBar 
            value={currentQuestionIndex + 1} 
            max={questions.length} 
            showLabel={false} 
          />
          
          {/* Question Navigator */}
          <div className="mt-4 flex flex-wrap gap-2">
            {questions.map((q, index) => {
              const isAnswered = userAnswers[q.id] !== undefined;
              const isCurrent = index === currentQuestionIndex;
              const isSubmitted = submittedAnswers[q.id];
              const isCorrect = isSubmitted && userAnswers[q.id] !== undefined 
                ? checkAnswer(q, userAnswers[q.id]).isCorrect 
                : null;
              
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                    isCurrent && 'ring-2 ring-primary-500',
                    isSubmitted && isCorrect === true && 'bg-success-100 text-success-700',
                    isSubmitted && isCorrect === false && 'bg-danger-100 text-danger-700',
                    !isSubmitted && isAnswered && 'bg-primary-100 text-primary-700',
                    !isAnswered && !isCurrent && 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  )}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="animate-fade-in-up">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              showFeedback={submittedAnswers[currentQuestion.id]}
              onSubmit={(result) => handleQuestionSubmit(currentQuestion.id, result)}
            />
          </div>
        )}

        {/* Navigation */}
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
              className="btn-success"
            >
              提交答卷
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              disabled={!userAnswers[currentQuestion?.id || '']}
              className={cn(
                'btn-primary',
                !userAnswers[currentQuestion?.id || ''] && 'opacity-50 cursor-not-allowed'
              )}
            >
              下一题
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  );
};
