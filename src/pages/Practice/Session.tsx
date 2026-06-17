import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Home,
  RotateCcw,
  Trophy
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { QuestionCard } from '@/components/business/QuestionCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { questionList } from '@/data/questions';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useLearningStore } from '@/store/useLearningStore';
import { getMistakeType, checkAnswer } from '@/utils/calculation';
import { cn } from '@/lib/utils';

export const PracticeSession = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    questions, 
    currentQuestionIndex, 
    userAnswers,
    startTime,
    startPractice, 
    nextQuestion, 
    prevQuestion,
    goToQuestion,
    reset
  } = usePracticeStore();
  const { addAnswerRecord, addMistake } = useLearningStore();
  
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    score: number;
    timeSpent: number;
  } | null>(null);

  const questionIds = searchParams.get('ids')?.split(',') || [];

  useEffect(() => {
    const selectedQuestions = questionIds
      .map(id => questionList.find(q => q.id === id))
      .filter((q): q is typeof questionList[0] => q !== undefined);

    if (selectedQuestions.length > 0) {
      startPractice(selectedQuestions);
    } else {
      navigate('/practice');
    }

    return () => {
      reset();
    };
  }, [questionIds.join(',')]);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;

  const handleQuestionSubmit = (result: { isCorrect: boolean; timeSpent: number }) => {
    if (!currentQuestion) return;

    const userAnswer = userAnswers[currentQuestion.id];
    
    addAnswerRecord({
      questionId: currentQuestion.id,
      userAnswer: userAnswer || '',
      isCorrect: result.isCorrect,
      timeSpent: result.timeSpent,
    });

    if (!result.isCorrect) {
      const mistakeType = getMistakeType(currentQuestion);
      addMistake(
        currentQuestion,
        userAnswer || '',
        mistakeType as any
      );
    }

    if (currentQuestionIndex >= questions.length - 1) {
      const totalTime = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
      const correct = Object.values(userAnswers).filter((_, idx) => {
        const q = questions[idx];
        return q && userAnswers[q.id] !== undefined && result.isCorrect;
      }).length;

      const totalCorrect = questions.reduce((count, q) => {
        const ans = userAnswers[q.id];
        if (ans === undefined) return count;
        const result = checkAnswer(q, ans);
        return count + (result.isCorrect ? 1 : 0);
      }, 0);

      setResults({
        correct: totalCorrect,
        total: questions.length,
        score: Math.round((totalCorrect / questions.length) * 100),
        timeSpent: totalTime,
      });
      setShowResults(true);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      nextQuestion();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      prevQuestion();
    }
  };

  const handleRetry = () => {
    const selectedQuestions = questionIds
      .map(id => questionList.find(q => q.id === id))
      .filter((q): q is typeof questionList[0] => q !== undefined);
    startPractice(selectedQuestions);
    setShowResults(false);
    setResults(null);
  };

  if (questions.length === 0) {
    return (
      <PageLayout>
        <div className="p-6 lg:p-8 text-center py-16">
          <p className="text-slate-500">加载中...</p>
        </div>
      </PageLayout>
    );
  }

  if (showResults && results) {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-success-600';
      if (score >= 70) return 'text-accent-600';
      return 'text-danger-600';
    };

    const getScoreBg = (score: number) => {
      if (score >= 90) return 'from-success-500 to-success-700';
      if (score >= 70) return 'from-accent-500 to-accent-700';
      return 'from-danger-500 to-danger-700';
    };

    const getEncouragement = (score: number) => {
      if (score >= 90) return '太棒了！你已经熟练掌握了这些知识点！';
      if (score >= 70) return '不错！继续加油，还有提升空间！';
      return '需要多加练习，建议回顾相关知识点！';
    };

    return (
      <PageLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="card p-8 text-center animate-fade-in-up">
            <div className={cn(
              'w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-6',
              getScoreBg(results.score)
            )}>
              <Trophy className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold font-display mb-2">练习完成！</h1>
            <p className="text-slate-500 mb-8">{getEncouragement(results.score)}</p>

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
                  {Math.floor(results.timeSpent / 60)}分{results.timeSpent % 60}秒
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-slate-900 mb-4">答题概览</h3>
              <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
                {questions.map((q, index) => {
                  const userAnswer = userAnswers[q.id];
                  const check = (correct: string | string[], ans: string | string[]): boolean => {
                    if (Array.isArray(correct) && Array.isArray(ans)) {
                      return correct.every((a, i) => a.toLowerCase().trim() === (ans[i] || '').toLowerCase().trim());
                    }
                    if (!Array.isArray(correct) && !Array.isArray(ans)) {
                      return correct.toLowerCase().trim() === ans.toLowerCase().trim();
                    }
                    if (Array.isArray(correct) && !Array.isArray(ans)) {
                      return correct.includes(ans.trim());
                    }
                    return false;
                  };
                  const isCorrect = userAnswer !== undefined && check(q.correctAnswer, userAnswer);
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => goToQuestion(index)}
                      className={cn(
                        'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                        isCorrect 
                          ? 'bg-success-100 text-success-700 hover:bg-success-200' 
                          : 'bg-danger-100 text-danger-700 hover:bg-danger-200'
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={handleRetry} className="btn-secondary">
                <RotateCcw className="w-4 h-4 mr-2" />
                再练一次
              </button>
              <button onClick={() => navigate('/practice')} className="btn-secondary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回选题
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

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate('/practice')} 
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                {startTime ? Math.floor((Date.now() - startTime) / 1000 / 60) : 0}分
                {startTime ? Math.floor((Date.now() - startTime) / 1000 % 60) : 0}秒
              </span>
            </div>
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
              
              return (
                <button
                  key={q.id}
                  onClick={() => goToQuestion(index)}
                  className={cn(
                    'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                    isCurrent && 'ring-2 ring-primary-500',
                    isAnswered
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
              onSubmit={handleQuestionSubmit}
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrev}
            disabled={currentQuestionIndex === 0}
            className={cn(
              'btn-secondary',
              currentQuestionIndex === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            上一题
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex >= questions.length - 1 || !userAnswers[currentQuestion?.id || '']}
            className={cn(
              'btn-primary',
              (currentQuestionIndex >= questions.length - 1 || !userAnswers[currentQuestion?.id || '']) && 'opacity-50 cursor-not-allowed'
            )}
          >
            下一题
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </PageLayout>
  );
};
