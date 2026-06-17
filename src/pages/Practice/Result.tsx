import { useEffect, useMemo, useState } from 'react';
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
  Eye,
  Calendar,
  ClipboardList,
  X
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { EmptyState } from '@/components/common/EmptyState';
import { usePracticeStore } from '@/store/usePracticeStore';
import { useLearningStore } from '@/store/useLearningStore';
import { checkAnswer, groupQuestionsByCategory, generateWeaknessSuggestions } from '@/utils/calculation';
import type { KnowledgeCategory, ReviewPlanTask } from '@/types';
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
  const { getStats, createReviewPlan, completeReviewTask, reviewPlans } = useLearningStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('practice_result_selectedCategory');
    } catch { return null; }
  });
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>(() => {
    try {
      const stored = sessionStorage.getItem('practice_result_expandedQuestions');
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<Omit<ReviewPlanTask, 'isCompleted'>[]>([]);
  const [expandedPlanDays, setExpandedPlanDays] = useState<Record<string, boolean>>({});

  const planProgress = useMemo(() => {
    const totalDays = reviewPlans.reduce((s, p) => s + p.totalDays, 0);
    const completedDays = reviewPlans.reduce((s, p) => s + p.completedDays, 0);
    return { totalDays, completedDays, plans: reviewPlans };
  }, [reviewPlans]);

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

  useEffect(() => {
    try {
      if (selectedCategory === null) {
        sessionStorage.removeItem('practice_result_selectedCategory');
      } else {
        sessionStorage.setItem('practice_result_selectedCategory', selectedCategory);
      }
    } catch {}
  }, [selectedCategory]);

  useEffect(() => {
    try {
      sessionStorage.setItem('practice_result_expandedQuestions', JSON.stringify(expandedQuestions));
    } catch {}
  }, [expandedQuestions]);

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

  const handleGeneratePlan = () => {
    const weakGroups = categoryGroups
      .filter(g => g.wrongQuestions.length > 0)
      .map(g => ({
        category: g.category,
        categoryName: g.categoryName,
        accuracy: g.totalCount > 0 ? g.correctCount / g.totalCount : 0,
        knowledgeGroups: g.knowledgeGroups.filter(kg => kg.wrongQuestions.length > 0),
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    if (weakGroups.length === 0) return;

    const tasks: Omit<ReviewPlanTask, 'isCompleted'>[] = [];
    let day = 1;
    let dailyCount = 0;

    for (const group of weakGroups) {
      for (const kg of group.knowledgeGroups) {
        tasks.push({
          day,
          category: group.category as KnowledgeCategory,
          categoryName: group.categoryName,
          knowledgeId: kg.knowledgeId,
          knowledgeTitle: kg.knowledgeTitle,
          wrongQuestionIds: kg.wrongQuestions.map(q => q.id),
        });
        dailyCount++;
        if (dailyCount >= 2) {
          day++;
          dailyCount = 0;
        }
      }
      if (dailyCount > 0) {
        day++;
        dailyCount = 0;
      }
    }

    const totalDays = Math.min(Math.max(tasks[tasks.length - 1]?.day || 1, 3), 5);
    setGeneratedPlan(tasks);
    setShowPlanModal(true);
  };

  const handleSavePlan = () => {
    if (generatedPlan.length === 0) return;
    createReviewPlan(generatedPlan);
    setGeneratedPlan([]);
    setShowPlanModal(false);
  };

  const goToKnowledge = (knowledgeId: string) => {
    navigate(`/rules/${knowledgeId}`);
  };

  const goBackToQuestion = (index: number) => {
    navigate(`/practice/session?goToIndex=${index}`);
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

        {/* Generate Review Plan Button */}
        {wrongQuestions.length > 0 && (
          <div className="mb-6">
            <button
              onClick={handleGeneratePlan}
              className="btn-primary flex items-center gap-2 w-full justify-center py-3 text-base"
            >
              <Calendar className="w-5 h-5" />
              📋 生成复习计划
            </button>
          </div>
        )}

        {planProgress.plans.length > 0 && (
          <div className="card p-6 mb-6 animate-fade-in-up">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-success-500" />
              我的复习计划
              <span className="text-sm font-normal text-slate-500">
                {planProgress.completedDays}/{planProgress.totalDays} 天已完成
              </span>
            </h2>
            <div className="space-y-3">
              {planProgress.plans.map(plan => {
                const days = [...new Set(plan.tasks.map(t => t.day))].sort((a, b) => a - b);
                return (
                  <div key={plan.id} className="space-y-3">
                    {days.map(day => {
                      const dayTasks = plan.tasks.filter(t => t.day === day);
                      const allCompleted = dayTasks.every(t => t.isCompleted);
                      const dayKey = `${plan.id}-${day}`;
                      const isExpanded = expandedPlanDays[dayKey];
                      const totalWrongQuestions = dayTasks.reduce((s, t) => s + t.wrongQuestionIds.length, 0);

                      return (
                        <div
                          key={day}
                          className={cn(
                            "border rounded-xl overflow-hidden transition-colors",
                            allCompleted ? "border-success-200 bg-success-50/30" : "border-slate-200"
                          )}
                        >
                          <div
                            className={cn(
                              "px-4 py-3 flex items-center justify-between cursor-pointer",
                              allCompleted
                                ? "bg-gradient-to-r from-success-500 to-success-600 text-white"
                                : "bg-gradient-to-r from-primary-500 to-primary-600 text-white"
                            )}
                            onClick={() => setExpandedPlanDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }))}
                          >
                            <div className="flex items-center gap-2">
                              {allCompleted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Calendar className="w-4 h-4" />
                              )}
                              <span className="font-semibold text-sm">第 {day} 天</span>
                              {allCompleted && (
                                <span className="text-xs opacity-80">已完成</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs opacity-80">
                                {dayTasks.map(t => t.categoryName).join('、')}
                              </span>
                              <span className="text-xs opacity-80">
                                {totalWrongQuestions} 道错题
                              </span>
                              <ChevronRight
                                className={cn(
                                  "w-4 h-4 transition-transform",
                                  isExpanded && "rotate-90"
                                )}
                              />
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="divide-y divide-slate-100">
                              {dayTasks.map((task, ti) => (
                                <div
                                  key={ti}
                                  className={cn(
                                    "p-3",
                                    task.isCompleted && "bg-success-50/50"
                                  )}
                                >
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                      {task.categoryName}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800">
                                      {task.knowledgeTitle}
                                    </span>
                                    {task.isCompleted && (
                                      <span className="text-xs text-success-600 font-medium flex items-center gap-0.5">
                                        <CheckCircle2 className="w-3 h-3" /> 已完成
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mb-2">
                                    需复习错题 {task.wrongQuestionIds.length} 道
                                  </p>
                                  <div className="flex gap-2 flex-wrap">
                                    <button
                                      onClick={() => navigate(`/rules/${task.knowledgeId}`)}
                                      className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors flex items-center gap-1"
                                    >
                                      <BookOpen className="w-3 h-3" />
                                      去规则课堂
                                    </button>
                                    <button
                                      onClick={() => navigate(`/practice/session?ids=${task.wrongQuestionIds.join(',')}`)}
                                      className="text-xs px-3 py-1.5 rounded-lg bg-danger-50 text-danger-700 hover:bg-danger-100 transition-colors flex items-center gap-1"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      错题再练
                                    </button>
                                    {!task.isCompleted && (
                                      <button
                                        onClick={() => completeReviewTask(plan.id, day, task.category)}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-success-50 text-success-700 hover:bg-success-100 transition-colors flex items-center gap-1"
                                      >
                                        ✅ 完成本天
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review Plan Modal */}
        {showPlanModal && generatedPlan.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col animate-fade-in-up">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary-500" />
                  复习计划
                </h3>
                <button
                  onClick={() => { setShowPlanModal(false); setGeneratedPlan([]); }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {(() => {
                  const days = [...new Set(generatedPlan.map(t => t.day))].sort();
                  return days.map(day => (
                    <div key={day} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2.5 font-semibold text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        第 {day} 天
                      </div>
                      <div className="divide-y divide-slate-100">
                        {generatedPlan.filter(t => t.day === day).map((task, ti) => (
                          <div key={ti} className="p-3">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                                {task.categoryName}
                              </span>
                              <span className="text-sm font-medium text-slate-800">{task.knowledgeTitle}</span>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">
                              需复习错题 {task.wrongQuestionIds.length} 道
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => goToKnowledge(task.knowledgeId)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors flex items-center gap-1"
                              >
                                <BookOpen className="w-3 h-3" />
                                去规则课堂
                              </button>
                              <button
                                onClick={() => navigate(`/practice/session?ids=${task.wrongQuestionIds.join(',')}`)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-danger-50 text-danger-700 hover:bg-danger-100 transition-colors flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                错题再练
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <div className="p-5 border-t border-slate-100">
                <button
                  onClick={handleSavePlan}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  确认并保存计划
                </button>
              </div>
            </div>
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
              const grp = categoryGroups.find(g => g.category === cat);
              const total = grp?.totalCount || 0;
              const wrong = grp?.wrongQuestions.length || 0;
              const catName = grp?.categoryName || cat;
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

        {/* Wrong Questions by Major Category */}
        <div className="space-y-6">
          {displayGroups.map((group, gi) => {
            const groupAccuracy = group.totalCount > 0 
              ? Math.round((group.correctCount / group.totalCount) * 100)
              : 0;
            
            return (
              <div 
                key={group.category} 
                className="card overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${0.05 + gi * 0.05}s` }}
              >
                {/* Major Category Header */}
                <div className="p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="tag-primary text-sm px-3 py-1">{group.categoryName}</span>
                        <span className="tag text-xs text-slate-600 bg-slate-100">
                          含 {group.knowledgeGroups.length} 个知识点 · {group.totalCount} 题
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
                            <span>大类总正确率</span>
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
                  </div>
                  {/* Quick Review Buttons for Each Knowledge Point */}
                  <div className="mt-4 pt-4 border-t border-slate-200/60">
                    <p className="text-xs text-slate-500 mb-2">直接进入对应规则课堂复习：</p>
                    <div className="flex flex-wrap gap-2">
                      {group.knowledgeGroups.map(kg => {
                        const kgAccuracy = kg.totalCount > 0 
                          ? Math.round((kg.correctCount / kg.totalCount) * 100) : 0;
                        return (
                          <button
                            key={kg.knowledgeId}
                            onClick={() => goToKnowledge(kg.knowledgeId)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 border',
                              kgAccuracy >= 80 
                                ? 'bg-success-50 text-success-700 border-success-200 hover:bg-success-100'
                                : kgAccuracy >= 60
                                  ? 'bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100'
                                  : 'bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100'
                            )}
                          >
                            <BookOpen className="w-3 h-3" />
                            {kg.knowledgeTitle}
                            <span className="opacity-75">
                              ({kg.correctCount}/{kg.totalCount}·{kgAccuracy}%)
                            </span>
                            <ChevronRight className="w-3 h-3 opacity-60" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Knowledge Subgroups with Mistakes */}
                {group.wrongQuestions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {group.knowledgeGroups.map(kg => {
                      if (kg.wrongQuestions.length === 0) return null;
                      
                      return (
                        <div key={kg.knowledgeId} className="bg-slate-50/40">
                          <div className="px-5 py-3 bg-white/60 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                                {kg.knowledgeTitle}
                              </span>
                              <span className="text-xs text-slate-500">
                                本知识点错 {kg.wrongQuestions.length} 题
                              </span>
                            </div>
                            <button
                              onClick={() => goToKnowledge(kg.knowledgeId)}
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-0.5 font-medium"
                            >
                              <BookOpen className="w-3 h-3" />
                              复习此知识点
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="divide-y divide-slate-100/50">
                            {kg.wrongQuestions.map((q) => {
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
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            goToKnowledge(kg.knowledgeId);
                                          }}
                                          className="btn-primary text-xs flex items-center gap-1"
                                        >
                                          <BookOpen className="w-3 h-3" />
                                          去规则课堂学习「{kg.knowledgeTitle}」
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    <CheckCircle2 className="w-10 h-10 text-success-400 mx-auto mb-2" />
                    <p className="text-sm">本大类掌握良好，没有错题！</p>
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
