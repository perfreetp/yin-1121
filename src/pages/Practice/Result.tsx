import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  FileText,
  Filter,
  Home,
  RotateCcw,
  Target,
  Lightbulb,
  Eye
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useLearningStore } from '@/store/useLearningStore';
import { checkAnswer, groupQuestionsByCategory, generateWeaknessSuggestions } from '@/utils/calculation';
import { knowledgeList } from '@/data/knowledge';
import { cn } from '@/lib/utils';

export const PracticeResult = () => {
  const navigate = useNavigate();
  const { 
    questions, 
    userAnswers, 
    submittedQuestions, 
    finalResult, 
    startTime,
    goToQuestion,
    reset
  } = usePracticeStore();
  const { getStats } = useLearningStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const categoryGroups = useMemo(() => {
    if (questions.length === 0) return [];
    return groupQuestionsByCategory(questions, userAnswers);
  }, [questions, userAnswers]);

  const wrongQuestions = useMemo(() => {
    return questions.filter(q => {
      if (!submittedQuestions[q.id]) return false;
      const ans = userAnswers[q.id];
      if (ans === undefined) return true;
      return !checkAnswer(q, ans).isCorrect;
    });
  }, [questions, userAnswers, submittedQuestions]);

  const suggestions = useMemo(() => {
    return generateWeaknessSuggestions(categoryGroups);
  }, [categoryGroups]);

  const overallStats = useMemo(() => {
    const submitted = questions.filter(q => submittedQuestions[q.id]);
    const correct = submitted.filter(q => {
      const ans = userAnswers[q.id];
      return ans !== undefined && checkAnswer(q, ans).isCorrect;
    }).length;
    const accuracy = submitted.length > 0 
      ? Math.round((correct / submitted.length) * 100) 
      : 0;
    const timeSpent = startTime 
      ? Math.floor((Date.now() - startTime) / 1000)
      : finalResult?.timeSpent || 0;
    
    return {
      total: questions.length,
      submitted: submitted.length,
      correct,
      wrong: wrongQuestions.length,
      accuracy,
      timeSpent,
      score: finalResult?.score || accuracy
    };
  }, [questions, userAnswers, submittedQuestions, wrongQuestions, startTime, finalResult]);

  const toggleQuestionExpand = (qid: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [qid]: !prev[qid]
    }));
  };

  const goToKnowledge = (knowledgeId: string) => {
    navigate(`/rules/${knowledgeId}`);
  };

  const goBackToQuestion = (index: number) => {
    navigate('/practice/session');
    setTimeout(() => {
      goToQuestion(index);
    }, 50);
  };

  const displayGroups = selectedCategory 
    ? categoryGroups.filter(g => g.category === selectedCategory)
    : categoryGroups;

  if (questions.length === 0) {
    return (
      <PageLayout>
        <div className="p-6 lg:p-8">
          <EmptyState
            icon={BookOpen}
            title="暂无练习数据"
            description="请先完成一组练习，即可查看错因回顾分析。"
            action={{
              label: "去练习",
              onClick: () => navigate('/practice')
            }}
          />
        </div>
      </PageLayout>
    );
  }

  const uniqueCategories = Array.from(new Set(categoryGroups.map(g => g.category)));

  return (
    <PageLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </button>
          <h1 className="text-2xl font-bold font-display text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-danger-500" />
            错因回顾
          </h1>
          <div className="w-20" />
        </div>

        {/* Overall Summary */}
        <div className="card p-6 mb-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            练习概览
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100">
              <p className="text-xs text-primary-600 mb-1">综合得分</p>
              <p className={cn(
                'text-2xl font-bold',
                overallStats.score >= 80 ? 'text-success-600' :
                overallStats.score >= 60 ? 'text-accent-600' : 'text-danger-600'
              )}>
                {overallStats.score}分
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-500 mb-1">答题总数</p>
              <p className="text-2xl font-bold text-slate-800">{overallStats.total}</p>
            </div>
            <div className="p-4 rounded-xl bg-success-50">
              <p className="text-xs text-success-600 mb-1">判定正确</p>
              <p className="text-2xl font-bold text-success-700">{overallStats.correct}</p>
            </div>
            <div className="p-4 rounded-xl bg-danger-50">
              <p className="text-xs text-danger-600 mb-1">判定错误</p>
              <p className="text-2xl font-bold text-danger-700">{overallStats.wrong}</p>
            </div>
            <div className="p-4 rounded-xl bg-accent-50">
              <p className="text-xs text-accent-600 mb-1">实际用时</p>
              <p className="text-2xl font-bold text-accent-700">
                {Math.floor(overallStats.timeSpent / 60)}分{overallStats.timeSpent % 60}秒
              </p>
            </div>
          </div>
        </div>

        {/* Weakness Suggestions */}
        {suggestions.length > 0 && (
          <div className="card p-6 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-accent-500" />
              薄弱点学习建议
            </h2>
            <ul className="space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-gradient-to-r from-accent-50 to-white rounded-lg border border-accent-100">
                  <span className="w-6 h-6 rounded-full bg-accent-500 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Category Filter */}
        {uniqueCategories.length > 1 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500 mr-2">按类别筛选：</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-all',
                selectedCategory === null 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              全部 ({categoryGroups.reduce((s, g) => s + g.totalCount, 0)})
            </button>
            {uniqueCategories.map(cat => {
              const grp = categoryGroups.filter(g => g.category === cat);
              const total = grp.reduce((s, g) => s + g.totalCount, 0);
              const wrong = grp.reduce((s, g) => s + g.wrongQuestions.length, 0);
              const catName = grp[0]?.categoryName || cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5',
                    selectedCategory === cat 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {catName}
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded',
                    selectedCategory === cat ? 'bg-white/20' : 'bg-slate-200'
                  )}>
                    {wrong > 0 ? `错${wrong}` : total}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Wrong Questions by Category */}
        <div className="space-y-6">
          {displayGroups.map((group, gi) => {
            const knowledge = knowledgeList.find(k => k.id === group.knowledgeId);
            const groupAccuracy = group.totalCount > 0 
              ? Math.round((group.correctCount / group.totalCount) * 100)
              : 0;
            
            return (
              <div 
                key={group.knowledgeId} 
                className="card overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${0.05 + gi * 0.05}s` }}
              >
                <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="tag-primary">{group.categoryName}</span>
                        <span className="tag text-xs text-slate-600 bg-slate-100">
                          知识点：{group.knowledgeTitle}
                        </span>
                        {group.wrongQuestions.length > 0 && (
                          <span className="tag-danger text-xs">
                            {group.wrongQuestions.length} 题需复习
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-md">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>本类正确率</span>
                            <span className={cn(
                              'font-bold',
                              groupAccuracy >= 80 ? 'text-success-600' :
                              groupAccuracy >= 60 ? 'text-accent-600' : 'text-danger-600'
                            )}>
                              {group.correctCount}/{group.totalCount} ({groupAccuracy}%)
                            </span>
                          </div>
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                'h-full rounded-full transition-all duration-700',
                                groupAccuracy >= 80 ? 'bg-success-500' :
                                groupAccuracy >= 60 ? 'bg-accent-500' : 'bg-danger-500'
                              )}
                              style={{ width: `${groupAccuracy}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {knowledge && (
                      <button
                        onClick={() => goToKnowledge(group.knowledgeId)}
                        className="btn-secondary shrink-0 flex items-center gap-1"
                      >
                        <BookOpen className="w-4 h-4" />
                        复习规则
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {group.wrongQuestions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {group.wrongQuestions.map((q, qi) => {
                      const qIndex = questions.findIndex(qq => qq.id === q.id);
                      const isExpanded = expandedQuestions[q.id];
                      const userAnswer = userAnswers[q.id] || '';
                      const result = checkAnswer(q, userAnswer || '');
                      
                      return (
                        <div key={q.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                          <div 
                            className="flex items-start gap-3 cursor-pointer"
                            onClick={() => toggleQuestionExpand(q.id)}
                          >
                            <div className="w-8 h-8 rounded-full bg-danger-100 text-danger-600 flex items-center justify-center shrink-0 mt-0.5">
                              <XCircle className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-medium text-slate-500">
                                  第 {qIndex + 1} 题
                                </span>
                                <span className="tag-accent text-xs">{q.typeName}</span>
                                <span className="tag text-xs bg-slate-100 text-slate-600">
                                  {q.itemTypeName}
                                </span>
                              </div>
                              <p className="text-sm text-slate-800 line-clamp-2 leading-relaxed">
                                {q.content.replace(/\n/g, ' / ')}
                              </p>
                            </div>
                            <ChevronRight className={cn(
                              'w-5 h-5 text-slate-400 shrink-0 mt-1 transition-transform',
                              isExpanded && 'rotate-90'
                            )} />
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-4 ml-11 space-y-3 animate-fade-in-up">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-danger-50 border border-danger-100">
                                  <p className="text-xs font-medium text-danger-700 mb-1 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    你的答案
                                  </p>
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                                    {Array.isArray(userAnswer) ? userAnswer.join('、') : (userAnswer || '（未作答）')}
                                  </p>
                                </div>
                                <div className="p-3 rounded-lg bg-success-50 border border-success-100">
                                  <p className="text-xs font-medium text-success-700 mb-1 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    参考答案
                                  </p>
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                                    {Array.isArray(q.correctAnswer) ? q.correctAnswer.join('、') : q.correctAnswer}
                                  </p>
                                </div>
                              </div>
                              
                              {result.feedback && (
                                <div className="p-3 rounded-lg bg-accent-50 border border-accent-100">
                                  <p className="text-xs font-medium text-accent-700 mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    错因提示
                                  </p>
                                  <p className="text-sm text-slate-700">{result.feedback}</p>
                                </div>
                              )}

                              <div className="flex gap-2 pt-2 flex-wrap">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    goBackToQuestion(qIndex);
                                  }}
                                  className="btn-secondary text-xs flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  回看原题
                                </button>
                                {knowledge && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      goToKnowledge(group.knowledgeId);
                                    }}
                                    className="btn-primary text-xs flex items-center gap-1"
                                  >
                                    <BookOpen className="w-3 h-3" />
                                    去规则课堂学习
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 text-success-400 mx-auto mb-2" />
                    <p className="text-sm">本类知识点掌握良好，没有错题！</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="card p-5 mt-8 flex flex-wrap gap-3 justify-center">
          <button 
            onClick={() => {
              reset();
              navigate('/practice');
            }} 
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            再选一组练习
          </button>
          <button 
            onClick={() => navigate('/mistakes')} 
            className="btn-secondary flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            查看完整错题本
          </button>
          <button 
            onClick={() => navigate('/mistakes/analysis')} 
            className="btn-secondary flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            薄弱点深度分析
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    </PageLayout>
  );
};
