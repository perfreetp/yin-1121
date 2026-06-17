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
  Trophy,
  BookOpen,
  ListChecks
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { QuestionCard } from '@/components/business/QuestionCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { questionList } from '@/data/questions';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useLearningStore } from '@/store/useLearningStore';
import { getMistakeType, checkAnswer, groupQuestionsByCategory, generateWeaknessSuggestions } from '@/utils/calculation';
import { cn } from '@/lib/utils';

export const PracticeSession = () => {
  const [searchParams] = useSearchParams();
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
  const { addAnswerRecord, addMistake } = useLearningStore();
  
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    correct: number;
    total: number;
    score: number;
    timeSpent: number;
    detailResults: Array<{ questionId: string; isCorrect: boolean; score: number; maxScore: number }>;
  } | null>(null);

  const questionIds = searchParams.get('ids')?.split(',') || [];
  const savedAnswers = searchParams.get('savedAnswers');
  const goToIndex = searchParams.get('goToIndex');

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
    };
  }, [questionIds.join(',')]);

  useEffect(() => {
    if (savedAnswers && questions.length === 0) {
      const params = new URLSearchParams(searchParams);
      params.delete('savedAnswers');
      navigate('/practice/session?' + params.toString(), { replace: true });
    }
  }, [savedAnswers, questions.length]);

  useEffect(() => {
    if (goToIndex && questions.length > 0) {
      const idx = parseInt(goToIndex, 10);
      if (!isNaN(idx) && idx >= 0 && idx < questions.length) {
        goToQuestion(idx);
      }
    }
  }, [goToIndex, questions.length]);

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const submittedCount = Object.keys(submittedQuestions).length;

  const categoryGroups = useMemo(() => {
    if (questions.length === 0) return [];
    return groupQuestionsByCategory(questions, userAnswers);
  }, [questions, userAnswers]);

  const suggestions = useMemo(() => {
    if (categoryGroups.length === 0) return [];
    return generateWeaknessSuggestions(categoryGroups);
  }, [categoryGroups]);

  const handleQuestionSubmit = (result: { isCorrect: boolean; timeSpent: number; score: number; maxScore: number; feedback?: string; matchedKeywords?: string[]; missingKeywords?: string[] }) => {
    if (!currentQuestion) return;
    
    const userAnswer = userAnswers[currentQuestion.id];
    
    const isNewRecord = addAnswerRecord({
      questionId: currentQuestion.id,
      userAnswer: userAnswer || '',
      isCorrect: result.isCorrect,
      timeSpent: result.timeSpent,
      sessionId: sessionId || undefined,
    });
    
    if (isNewRecord && !result.isCorrect) {
      const mistakeType = getMistakeType(currentQuestion);
      addMistake(
        currentQuestion,
        userAnswer || '',
        mistakeType as any,
        sessionId || undefined
      );
    }

    const allSubmitted = questions.length > 0 && 
      questions.every(q => submittedQuestions[q.id]);
    
    if (allSubmitted || currentQuestionIndex >= questions.length - 1) {
      if (allSubmitted) {
        finishSession();
      }
    }
  };

  const finishSession = () => {
    if (!startTime) return;
    
    const result = submitAll();
    setResults({
      correct: result.correct,
      total: result.total,
      score: result.score,
      timeSpent: result.timeSpent,
      detailResults: result.detailResults,
    });
    setShowResults(true);
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

  const handleSubmitAll = () => {
    const unanswered = questions.filter(q => !submittedQuestions[q.id]);
    if (unanswered.length > 0) {
      if (!confirm(`还有 ${unanswered.length} 题未提交判定，确定要结束吗？`)) {
        return;
      }
    }
    
    unanswered.forEach(q => {
      if (userAnswers[q.id] !== undefined) {
        addAnswerRecord({
          questionId: q.id,
          userAnswer: userAnswers[q.id] || '',
          isCorrect: checkAnswer(q, userAnswers[q.id]).isCorrect,
          timeSpent: 0,
          sessionId: sessionId || undefined,
        });
      }
    });
    
    finishSession();
  };

  const goToReviewPage = () => {
    navigate('/practice/result');
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

    const submittedAnswers = questions.filter(q => submittedQuestions[q.id]);
    const wrongCount = submittedAnswers.filter(q => 
      !checkAnswer(q, userAnswers[q.id] || '').isCorrect
    ).length;

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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">综合得分</p>
                <p className={cn('text-2xl font-bold', getScoreColor(results.score))}>
                  {results.score}分
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">判定正确</p>
                <p className="text-2xl font-bold text-success-600">
                  {results.correct}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">判定错误</p>
                <p className="text-2xl font-bold text-danger-600">
                  {wrongCount}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">实际用时</p>
                <p className="text-2xl font-bold text-accent-600">
                  {Math.floor(results.timeSpent / 60)}分{results.timeSpent % 60}秒
                </p>
              </div>
            </div>

            {categoryGroups.length > 0 && (
              <div className="mb-8 text-left">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary-500" />
                  各类别掌握情况
                </h3>
                <div className="space-y-3">
                  {categoryGroups.filter(g => g.totalCount > 0).slice(0, 5).map((g) => {
                    const accuracy = g.totalCount > 0 
                      ? Math.round((g.correctCount / g.totalCount) * 100) 
                      : 0;
                    return (
                      <div key={g.category} className="p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-800">
                            {g.categoryName}
                            <span className="text-xs text-slate-500 ml-2">
                              {g.knowledgeGroups.length}个知识点 · {g.correctCount}/{g.totalCount}题
                            </span>
                          </span>
                          <span className={cn(
                            'text-sm font-bold',
                            accuracy >= 80 && 'text-success-600',
                            accuracy >= 60 && accuracy < 80 && 'text-accent-600',
                            accuracy < 60 && 'text-danger-600'
                          )}>
                            {accuracy}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              accuracy >= 80 && 'bg-success-500',
                              accuracy >= 60 && accuracy < 80 && 'bg-accent-500',
                              accuracy < 60 && 'bg-danger-500'
                            )}
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="font-semibold text-slate-900 mb-4">答题概览</h3>
              <div className="grid grid-cols-6 md:grid-cols-9 gap-2">
                {questions.map((q, index) => {
                  const userAnswer = userAnswers[q.id];
                  const isSubmitted = submittedQuestions[q.id];
                  const isCorrect = isSubmitted && userAnswer !== undefined 
                    ? checkAnswer(q, userAnswer).isCorrect 
                    : false;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setShowResults(false);
                        goToQuestion(index);
                      }}
                      className={cn(
                        'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all',
                        !isSubmitted && 'bg-slate-100 text-slate-400',
                        isSubmitted && isCorrect 
                          ? 'bg-success-100 text-success-700 hover:bg-success-200' 
                          : isSubmitted && 'bg-danger-100 text-danger-700 hover:bg-danger-200'
                      )}
                    >
                      {!isSubmitted ? '-' : index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-success-100" /> 正确
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-danger-100" /> 错误
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-4 h-4 rounded bg-slate-100" /> 未判定
                </span>
              </div>
            </div>

            {wrongCount > 0 && (
              <button 
                onClick={goToReviewPage} 
                className="w-full btn-primary mb-4 flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                查看错因回顾 →
              </button>
            )}
          </div>
          
          {wrongCount > 0 && (
            <div className="card p-6 mt-6 animate-fade-in-up">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent-500" />
                学习建议
              </h3>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center mt-6">
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
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => {
              if (confirm('确定要退出吗？未提交的判定结果可以稍后继续。')) {
                navigate('/practice');
              }
            }} 
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-600">
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-success-500" />
                已判 {submittedCount}/{questions.length}
              </span>
              <span className="text-slate-600">
                <XCircle className="w-3.5 h-3.5 inline mr-1 text-danger-500" />
                未判 {questions.length - submittedCount}
              </span>
            </div>
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
              已作答 {answeredCount} 题
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
          <div className="animate-fade-in-up" key={currentQuestion.id}>
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              showFeedback={submittedQuestions[currentQuestion.id]}
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
          
          {currentQuestionIndex >= questions.length - 1 ? (
            <button
              onClick={handleSubmitAll}
              className="btn-success"
            >
              结束练习查看结果
            </button>
          ) : (
            <button
              onClick={handleNext}
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
