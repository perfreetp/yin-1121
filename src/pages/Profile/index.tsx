import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Trophy, 
  Clock, 
  Target, 
  BookOpen,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Download,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  FileText
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { RadarChart } from '@/components/business/RadarChart';
import { EmptyState } from '@/components/common/EmptyState';
import { useLearningStore } from '@/store/useLearningStore';
import { levelList } from '@/data/levels';
import { knowledgeList } from '@/data/knowledge';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';

const tabs = [
  { id: 'overview', label: '学习总览', icon: TrendingUp },
  { id: 'favorites', label: '我的收藏', icon: Star },
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, getStats, favorites, learnedIds, levelProgress, resetAllData } = useLearningStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'favorites'>('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const stats = getStats();

  const levelStats = useMemo(() => {
    return levelList.map(level => {
      const progress = levelProgress.find(p => p.levelId === level.id);
      return {
        ...level,
        isPassed: progress?.isPassed || false,
        bestScore: progress?.bestScore,
        bestTime: progress?.bestTime,
        attemptDate: progress?.attemptDate,
      };
    });
  }, [levelProgress]);

  const learningProgress = useMemo(() => {
    const totalKnowledge = knowledgeList.length;
    const learned = learnedIds.length;
    const percent = totalKnowledge > 0 ? Math.round((learned / totalKnowledge) * 100) : 0;
    return { totalKnowledge, learned, percent };
  }, [learnedIds]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  const handleExportResults = () => {
    const exportData = {
      user: user.name,
      exportDate: new Date().toISOString(),
      stats: {
        totalQuestions: stats.totalQuestions,
        correctCount: stats.correctCount,
        accuracy: Math.round(stats.accuracy),
        totalTime: formatTime(stats.totalTime),
        studyDays: stats.studyDays,
      },
      learningProgress: {
        learned: learningProgress.learned,
        total: learningProgress.totalKnowledge,
        percent: learningProgress.percent,
      },
      levelProgress: levelStats.map(l => ({
        level: l.name,
        isPassed: l.isPassed,
        bestScore: l.bestScore,
      })),
      categoryAccuracy: stats.categoryAccuracy,
      recentTrend: stats.recentTrend,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `培训考核结果_${user.name}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleResetAll = () => {
    resetAllData();
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-2xl">
                {user.avatar}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display">{user.name}</h1>
                <p className="text-slate-500">
                  加入时间：{formatDate(user.joinDate)} · 已学习 {stats.studyDays} 天
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExportResults} className="btn-secondary">
                <Download className="w-4 h-4 mr-2" />
                导出结果
              </button>
              <button 
                onClick={() => setShowResetConfirm(true)} 
                className="btn-secondary text-danger-600 border-danger-200 hover:bg-danger-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置进度
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 border-b-2 -mb-px font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in-up">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-primary-500" />
                  <span className="text-sm text-slate-500">知识点学习</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {learningProgress.learned}/{learningProgress.totalKnowledge}
                </p>
                <p className="text-xs text-slate-500">完成率 {learningProgress.percent}%</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-success-500" />
                  <span className="text-sm text-slate-500">累计答题</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stats.totalQuestions}</p>
                <p className="text-xs text-slate-500">正确率 {Math.round(stats.accuracy)}%</p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-accent-500" />
                  <span className="text-sm text-slate-500">通过关卡</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {levelStats.filter(l => l.isPassed).length}/{levelList.length}
                </p>
                <p className="text-xs text-slate-500">
                  最高等级：{levelStats.filter(l => l.isPassed).slice(-1)[0]?.name || '无'}
                </p>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  <span className="text-sm text-slate-500">学习时长</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatTime(stats.totalTime)}
                </p>
                <p className="text-xs text-slate-500">共 {stats.studyDays} 天</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Ability Radar */}
              <div className="card p-6">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-500" />
                  能力画像
                </h2>
                <div className="h-72">
                  <RadarChart stats={stats} height={288} />
                </div>
              </div>

              {/* Category Accuracy */}
              <div className="card p-6">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-success-500" />
                  分类正确率
                </h2>
                <div className="space-y-4">
                  {stats.categoryAccuracy.map((cat, index) => (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{cat.categoryName}</span>
                        <span className={cn(
                          'text-sm font-bold',
                          cat.accuracy >= 80 ? 'text-success-600' :
                          cat.accuracy >= 60 ? 'text-accent-600' : 'text-danger-600'
                        )}>
                          {cat.accuracy}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            'h-full rounded-full transition-all',
                            cat.accuracy >= 80 ? 'bg-success-500' :
                            cat.accuracy >= 60 ? 'bg-accent-500' : 'bg-danger-500'
                          )}
                          style={{ width: `${cat.accuracy}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        已答题 {cat.correct}/{cat.total} 道
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="card p-6 mb-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent-500" />
                闯关进度
              </h2>
              <div className="space-y-4">
                {levelStats.map((level, index) => (
                  <div 
                    key={level.id}
                    className={cn(
                      'p-4 rounded-xl border transition-all',
                      level.isPassed ? 'border-success-200 bg-success-50/50' : 'border-slate-200'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          level.isPassed 
                            ? 'bg-gradient-to-br from-success-500 to-success-700' 
                            : 'bg-gradient-to-br from-slate-400 to-slate-600'
                        )}>
                          {level.isPassed ? (
                            <Trophy className="w-6 h-6 text-white" />
                          ) : (
                            <Award className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">{level.name}</h3>
                            {level.isPassed && <span className="tag-success">已通过</span>}
                          </div>
                          <p className="text-sm text-slate-500">{level.description}</p>
                          {level.bestScore !== undefined && (
                            <p className="text-xs text-slate-500 mt-1">
                              最佳成绩：{level.bestScore}分
                              {level.bestTime !== undefined && ` · 用时 ${formatTime(level.bestTime)}`}
                              {level.attemptDate && ` · ${formatDate(level.attemptDate)}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/levels/${level.id}`)}
                        className={cn(
                          'btn-primary',
                          index > 0 && !levelStats[index - 1]?.isPassed && 'opacity-50 cursor-not-allowed'
                        )}
                        disabled={index > 0 && !levelStats[index - 1]?.isPassed}
                      >
                        {level.isPassed ? '再挑战' : '去挑战'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            {stats.recentTrend.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  近期学习记录
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">日期</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">答题数</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">正确率</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentTrend.slice().reverse().map((record, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="py-3 px-4 text-sm text-slate-700">{record.date}</td>
                          <td className="py-3 px-4 text-sm text-slate-700">{record.count} 题</td>
                          <td className="py-3 px-4">
                            <span className={cn(
                              'text-sm font-medium',
                              record.accuracy >= 80 ? 'text-success-600' :
                              record.accuracy >= 60 ? 'text-accent-600' : 'text-danger-600'
                            )}>
                              {record.accuracy}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {record.accuracy >= 80 ? (
                              <span className="tag-success">优秀</span>
                            ) : record.accuracy >= 60 ? (
                              <span className="tag-accent">良好</span>
                            ) : (
                              <span className="tag-danger">需加强</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="animate-fade-in-up">
            {favorites.length > 0 ? (
              <div className="space-y-4">
                {favorites.map(fav => (
                  <div key={fav.id} className="card p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'tag',
                          fav.targetType === 'knowledge' && 'tag-primary',
                          fav.targetType === 'question' && 'tag-accent',
                          fav.targetType === 'example' && 'tag-success'
                        )}>
                          {fav.targetType === 'knowledge' ? '知识点' : 
                           fav.targetType === 'question' ? '题目' : '示例'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDate(fav.createdAt)}</span>
                      </div>
                      <Star className="w-5 h-5 text-accent-500 fill-accent-500" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">
                      {fav.targetTitle}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                      {fav.targetContent}
                    </p>
                    {fav.targetType === 'knowledge' && (
                      <button
                        onClick={() => navigate(`/rules/${fav.targetId}`)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        查看详情
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                    {fav.targetType === 'question' && (
                      <button
                        onClick={() => navigate(`/practice/session?ids=${fav.targetId}`)}
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                      >
                        练习此题
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Star}
                title="暂无收藏"
                description="你还没有收藏任何内容，遇到优秀的知识点或题目可以点击收藏按钮保存"
                action={{
                  label: "去发现内容",
                  onClick: () => navigate('/rules')
                }}
              />
            )}
          </div>
        )}

        {/* Reset Confirm Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-danger-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">确认重置</h3>
                  <p className="text-sm text-slate-500">此操作不可撤销</p>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                确定要重置所有学习进度吗？这将清除所有答题记录、错题记录、收藏内容和闯关进度。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  取消
                </button>
                <button
                  onClick={handleResetAll}
                  className="btn-danger flex-1"
                >
                  确认重置
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
