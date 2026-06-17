import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Lightbulb,
  Award
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { PageLayout } from '@/components/layout/PageLayout';
import { RadarChart } from '@/components/business/RadarChart';
import { useLearningStore } from '@/store/useLearningStore';
import { KnowledgeCategoryNames, type KnowledgeCategory } from '@/types';
import { knowledgeList } from '@/data/knowledge';
import { cn } from '@/lib/utils';

export const MistakesAnalysis = () => {
  const navigate = useNavigate();
  const { getStats, mistakeRecords, learnedIds } = useLearningStore();
  
  const stats = getStats();

  const weakPoints = useMemo(() => {
    const categoryMistakes: Record<string, { total: number; mastered: number; knowledgeIds: string[] }> = {};
    
    mistakeRecords.forEach(m => {
      const knowledge = knowledgeList.find(k => k.id === m.question.knowledgeId);
      if (knowledge) {
        if (!categoryMistakes[knowledge.category]) {
          categoryMistakes[knowledge.category] = { total: 0, mastered: 0, knowledgeIds: [] };
        }
        categoryMistakes[knowledge.category].total++;
        if (m.isMastered) {
          categoryMistakes[knowledge.category].mastered++;
        }
        if (!categoryMistakes[knowledge.category].knowledgeIds.includes(knowledge.id)) {
          categoryMistakes[knowledge.category].knowledgeIds.push(knowledge.id);
        }
      }
    });

    return Object.entries(categoryMistakes)
      .map(([category, data]) => {
        const accuracy = stats.categoryAccuracy.find(c => c.category === category);
        return {
          category: category as KnowledgeCategory,
          categoryName: KnowledgeCategoryNames[category as KnowledgeCategory],
          mistakeCount: data.total,
          masteredCount: data.mastered,
          unmasteredCount: data.total - data.mastered,
          accuracy: accuracy?.accuracy || 0,
          knowledgeIds: data.knowledgeIds,
        };
      })
      .sort((a, b) => a.accuracy - b.accuracy);
  }, [mistakeRecords, stats.categoryAccuracy]);

  const weakestPoints = weakPoints.slice(0, 3);

  const recentTrendData = useMemo(() => {
    return stats.recentTrend.map(d => ({
      ...d,
      date: d.date.slice(5),
    }));
  }, [stats.recentTrend]);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-success-600';
    if (accuracy >= 60) return 'text-accent-600';
    return 'text-danger-600';
  };

  const getAccuracyBg = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-success-100';
    if (accuracy >= 60) return 'bg-accent-100';
    return 'bg-danger-100';
  };

  const getSuggestions = (weakest: typeof weakPoints) => {
    const suggestions: { title: string; description: string; action: string }[] = [];
    
    weakest.forEach(point => {
      if (point.accuracy < 60) {
        suggestions.push({
          title: `加强「${point.categoryName}」学习`,
          description: `该知识点正确率仅为${point.accuracy}%，建议回顾相关知识内容，理解核心要点后再做练习。`,
          action: `去学习${point.categoryName}`,
        });
      }
    });

    if (stats.totalQuestions < 20) {
      suggestions.push({
        title: '增加练习量',
        description: `目前仅完成${stats.totalQuestions}道题目，建议多做练习以巩固知识点。`,
        action: '去做练习',
      });
    }

    if (suggestions.length === 0) {
      suggestions.push({
        title: '保持良好状态',
        description: '你的整体表现不错！继续保持，挑战更高难度的题目。',
        action: '去闯关',
      });
    }

    return suggestions;
  };

  const suggestions = getSuggestions(weakestPoints);

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button 
            onClick={() => navigate('/mistakes')} 
            className="btn-secondary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回错题本
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">薄弱点分析</h1>
              <p className="text-slate-500">精准定位知识盲区，制定高效提升计划</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Radar Chart */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-500" />
              能力画像
            </h2>
            <div className="h-80">
              <RadarChart stats={stats} height={320} />
            </div>
          </div>

          {/* Trend Chart */}
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success-500" />
              学习趋势
            </h2>
            <div className="h-80">
              {recentTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, '正确率']}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#1d4ed8" 
                      strokeWidth={3}
                      dot={{ fill: '#1d4ed8', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  暂无趋势数据，请先完成练习
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Weak Points */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-danger-500" />
            薄弱点排行
          </h2>
          
          {weakPoints.length > 0 ? (
            <div className="space-y-4">
              {weakPoints.map((point, index) => (
                <div 
                  key={point.category}
                  className={cn(
                    'p-4 rounded-xl border transition-all',
                    index < 3 ? 'border-danger-200 bg-danger-50/50' : 'border-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        index === 0 && 'bg-danger-500 text-white',
                        index === 1 && 'bg-accent-500 text-white',
                        index === 2 && 'bg-primary-500 text-white',
                        index > 2 && 'bg-slate-200 text-slate-600'
                      )}>
                        {index + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-slate-900">{point.categoryName}</h3>
                        <p className="text-sm text-slate-500">
                          错题 {point.mistakeCount} 题 · 已掌握 {point.masteredCount} 题
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-2xl font-bold', getAccuracyColor(point.accuracy))}>
                        {point.accuracy}%
                      </p>
                      <p className="text-xs text-slate-500">正确率</p>
                    </div>
                  </div>
                  
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                    <div 
                      className={cn('h-full rounded-full transition-all', getAccuracyBg(point.accuracy))}
                      style={{ width: `${point.accuracy}%` }}
                    />
                  </div>

                  {point.unmasteredCount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-danger-600">
                        还有 {point.unmasteredCount} 题待巩固
                      </span>
                      <button
                        onClick={() => navigate('/practice')}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        去练习
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">暂无错题记录</h3>
              <p className="text-slate-500">完成练习后这里会显示你的薄弱点分析</p>
            </div>
          )}
        </div>

        {/* Learning Suggestions */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-accent-500" />
            学习建议
          </h2>
          
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl"
              >
                <h3 className="font-semibold text-primary-800 mb-1">{suggestion.title}</h3>
                <p className="text-sm text-primary-700 mb-3">{suggestion.description}</p>
                <button
                  onClick={() => {
                    if (suggestion.action.includes('学习')) {
                      navigate('/rules');
                    } else if (suggestion.action.includes('练习')) {
                      navigate('/practice');
                    } else if (suggestion.action.includes('闯关')) {
                      navigate('/levels');
                    } else {
                      navigate('/');
                    }
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  {suggestion.action}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-slate-500">累计答题</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalQuestions}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-success-500" />
              <span className="text-sm text-slate-500">总正确率</span>
            </div>
            <p className="text-2xl font-bold text-success-600">{Math.round(stats.accuracy)}%</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-accent-500" />
              <span className="text-sm text-slate-500">学习天数</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.studyDays}天</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
              <span className="text-sm text-slate-500">薄弱模块</span>
            </div>
            <p className="text-2xl font-bold text-danger-600">{weakestPoints.length}个</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};
