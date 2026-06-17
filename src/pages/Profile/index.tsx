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
  FileText,
  Users,
  ClipboardList,
  CheckCircle2,
  XCircle,
  BarChart3
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { RadarChart } from '@/components/business/RadarChart';
import { EmptyState } from '@/components/common/EmptyState';
import { useLearningStore } from '@/store/useLearningStore';
import { levelList } from '@/data/levels';
import { knowledgeList } from '@/data/knowledge';
import { KnowledgeCategoryNames } from '@/types';
import type { ClassStudent, LearningStats, LevelProgress } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';

const tabs = [
  { id: 'overview', label: '学习总览', icon: TrendingUp },
  { id: 'classroom', label: '班级视图', icon: Users },
  { id: 'favorites', label: '我的收藏', icon: Star },
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, getStats, favorites, learnedIds, levelProgress, resetAllData, getReviewPlanProgress } = useLearningStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'classroom' | 'favorites'>('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const stats = getStats();
  const reviewPlanProgress = getReviewPlanProgress();

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

            {/* Review Plan Progress */}
            {reviewPlanProgress.plans.length > 0 && (
              <div className="card p-6 mt-6">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-accent-500" />
                  复习计划进度
                </h2>
                <div className="space-y-4">
                  {reviewPlanProgress.plans.map(plan => (
                    <div key={plan.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            创建于 {formatDate(plan.createdAt)}
                          </p>
                          <p className="text-xs text-slate-500">
                            共 {plan.totalDays} 天任务，已完成 {plan.completedDays} 天
                          </p>
                        </div>
                        <span className={cn(
                          'text-lg font-bold',
                          plan.completedDays >= plan.totalDays ? 'text-success-600' :
                          plan.completedDays > 0 ? 'text-accent-600' : 'text-slate-400'
                        )}>
                          {plan.totalDays > 0 ? Math.round((plan.completedDays / plan.totalDays) * 100) : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
                        <div 
                          className={cn(
                            'h-full rounded-full transition-all',
                            plan.completedDays >= plan.totalDays ? 'bg-success-500' : 'bg-accent-500'
                          )}
                          style={{ width: `${plan.totalDays > 0 ? (plan.completedDays / plan.totalDays) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="space-y-2">
                        {Array.from(new Set(plan.tasks.map(t => t.day))).sort().map(day => {
                          const dayTasks = plan.tasks.filter(t => t.day === day);
                          const allCompleted = dayTasks.every(t => t.isCompleted);
                          return (
                            <div key={day} className={cn(
                              'p-2 rounded-lg flex items-center justify-between',
                              allCompleted ? 'bg-success-50 border border-success-100' : 'bg-white border border-slate-100'
                            )}>
                              <div className="flex items-center gap-2">
                                {allCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                                )}
                                <span className="text-xs font-medium text-slate-700">第 {day} 天</span>
                                <span className="text-xs text-slate-500">
                                  {dayTasks.map(t => t.categoryName).join('、')}
                                </span>
                              </div>
                              <span className={cn(
                                'text-xs',
                                allCompleted ? 'text-success-600' : 'text-slate-400'
                              )}>
                                {allCompleted ? '已完成' : '待完成'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Classroom Tab */}
        {activeTab === 'classroom' && (
          <div className="animate-fade-in-up">
            <ClassroomView currentUser={user} currentStats={stats} currentLevelProgress={levelProgress} />
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

const mockStudents: ClassStudent[] = [
  {
    id: 's1', name: '张明远', avatar: '👨‍💼', totalQuestions: 156, correctCount: 132, accuracy: 84.6,
    levelsPassed: 4, totalLevels: 5,
    weakCategories: [{ categoryName: '法定依据', accuracy: 62 }, { categoryName: '承诺时限', accuracy: 68 }],
  },
  {
    id: 's2', name: '李晓红', avatar: '👩‍💼', totalQuestions: 203, correctCount: 178, accuracy: 87.7,
    levelsPassed: 5, totalLevels: 5,
    weakCategories: [{ categoryName: '材料减免', accuracy: 71 }],
  },
  {
    id: 's3', name: '王建国', avatar: '👨‍🔧', totalQuestions: 89, correctCount: 58, accuracy: 65.2,
    levelsPassed: 2, totalLevels: 5,
    weakCategories: [{ categoryName: '受理条件', accuracy: 48 }, { categoryName: '申请材料', accuracy: 55 }, { categoryName: '法定依据', accuracy: 52 }],
  },
  {
    id: 's4', name: '赵文静', avatar: '👩‍💻', totalQuestions: 134, correctCount: 108, accuracy: 80.6,
    levelsPassed: 3, totalLevels: 5,
    weakCategories: [{ categoryName: '常见错误', accuracy: 58 }, { categoryName: '承诺时限', accuracy: 65 }],
  },
  {
    id: 's5', name: '陈思远', avatar: '🧑‍🏫', totalQuestions: 178, correctCount: 152, accuracy: 85.4,
    levelsPassed: 4, totalLevels: 5,
    weakCategories: [{ categoryName: '申请材料', accuracy: 69 }],
  },
  {
    id: 's6', name: '刘雅琴', avatar: '👩‍🎓', totalQuestions: 112, correctCount: 72, accuracy: 64.3,
    levelsPassed: 2, totalLevels: 5,
    weakCategories: [{ categoryName: '受理条件', accuracy: 45 }, { categoryName: '法定依据', accuracy: 50 }, { categoryName: '材料减免', accuracy: 55 }],
  },
  {
    id: 's7', name: '孙志强', avatar: '👨‍🎓', totalQuestions: 167, correctCount: 142, accuracy: 85.0,
    levelsPassed: 4, totalLevels: 5,
    weakCategories: [{ categoryName: '承诺时限', accuracy: 66 }],
  },
  {
    id: 's8', name: '周美华', avatar: '👩‍🔧', totalQuestions: 95, correctCount: 65, accuracy: 68.4,
    levelsPassed: 2, totalLevels: 5,
    weakCategories: [{ categoryName: '申请材料', accuracy: 52 }, { categoryName: '常见错误', accuracy: 48 }],
  },
];

interface ClassroomViewProps {
  currentUser: { name: string; avatar: string };
  currentStats: LearningStats;
  currentLevelProgress: LevelProgress[];
}

const ClassroomView = ({ currentUser, currentStats, currentLevelProgress }: ClassroomViewProps) => {
  const allStudents = useMemo(() => {
    const me: ClassStudent = {
      id: 'me',
      name: currentUser.name,
      avatar: currentUser.avatar,
      totalQuestions: currentStats.totalQuestions,
      correctCount: currentStats.correctCount,
      accuracy: Math.round(currentStats.accuracy * 10) / 10,
      levelsPassed: currentLevelProgress.filter(p => p.isPassed).length,
      totalLevels: levelList.length,
      weakCategories: currentStats.categoryAccuracy
        .filter(c => c.accuracy < 70)
        .map(c => ({ categoryName: c.categoryName, accuracy: c.accuracy }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 3),
    };
    return [me, ...mockStudents].sort((a, b) => b.accuracy - a.accuracy);
  }, [currentUser, currentStats, currentLevelProgress]);

  const classStats = useMemo(() => {
    const total = allStudents.length;
    const passedCount = allStudents.filter(s => s.levelsPassed >= 3).length;
    const avgAccuracy = total > 0 
      ? Math.round(allStudents.reduce((s, st) => s + st.accuracy, 0) / total * 10) / 10 
      : 0;
    const avgQuestions = total > 0
      ? Math.round(allStudents.reduce((s, st) => s + st.totalQuestions, 0) / total)
      : 0;
    return { total, passedCount, avgAccuracy, avgQuestions };
  }, [allStudents]);

  const weakCategoryRanking = useMemo(() => {
    const categoryMap = new Map<string, { categoryName: string; totalStudents: number; weakStudents: number }>();
    allStudents.forEach(s => {
      s.weakCategories.forEach(wc => {
        if (!categoryMap.has(wc.categoryName)) {
          categoryMap.set(wc.categoryName, { categoryName: wc.categoryName, totalStudents: 0, weakStudents: 0 });
        }
        const entry = categoryMap.get(wc.categoryName)!;
        entry.totalStudents++;
        entry.weakStudents++;
      });
    });
    allStudents.forEach(s => {
      const allCats = new Set(s.weakCategories.map(wc => wc.categoryName));
      allCats.forEach(cat => {
        const entry = categoryMap.get(cat);
        if (entry) entry.totalStudents = allStudents.length;
      });
    });
    return Array.from(categoryMap.values()).sort((a, b) => b.weakStudents - a.weakStudents);
  }, [allStudents]);

  const accuracyRanges = useMemo(() => {
    const ranges = [
      { label: '优秀(≥80%)', min: 80, max: 101, count: 0, color: 'bg-success-500' },
      { label: '良好(60-79%)', min: 60, max: 80, count: 0, color: 'bg-accent-500' },
      { label: '需加强(<60%)', min: 0, max: 60, count: 0, color: 'bg-danger-500' },
    ];
    allStudents.forEach(s => {
      if (s.accuracy >= 80) ranges[0].count++;
      else if (s.accuracy >= 60) ranges[1].count++;
      else ranges[2].count++;
    });
    return ranges;
  }, [allStudents]);

  const [projectionMode, setProjectionMode] = useState(false);

  const typicalErrors = useMemo(() => {
    const categoryAccMap = new Map<string, number[]>();
    allStudents.forEach(s => {
      s.weakCategories.forEach(wc => {
        if (!categoryAccMap.has(wc.categoryName)) categoryAccMap.set(wc.categoryName, []);
        categoryAccMap.get(wc.categoryName)!.push(wc.accuracy);
      });
    });
    const avgMap = new Map<string, number>();
    categoryAccMap.forEach((accs, name) => {
      avgMap.set(name, accs.reduce((a, b) => a + b, 0) / accs.length);
    });
    const typicalErrorMap: Record<string, string> = {
      '法定依据': '受理条件混淆容缺受理和一般受理情形',
      '承诺时限': '法定时限与承诺时限混淆，超期办结预警识别不清',
      '申请材料': '申请材料中身份证复印件与共享核验替代关系不清晰',
      '材料减免': '材料减免条件判断不准，容缺材料与减免材料区分不清',
      '办理流程': '受理→审查→决定环节的权限划分不明确',
      '审查标准': '形式审查与实质审查的标准混淆',
      '收费依据': '收费项目与减免条件记忆模糊',
    };
    return Array.from(avgMap.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([name, avg]) => ({
        categoryName: name,
        avgAccuracy: Math.round(avg * 10) / 10,
        description: typicalErrorMap[name] || '常见概念混淆与条件判断错误',
      }));
  }, [allStudents]);

  const reviewRoute = useMemo(() => {
    return weakCategoryRanking.slice(0, 3).map((wc, i) => ({
      day: i + 1,
      categoryName: wc.categoryName,
      weakCount: wc.weakStudents,
    }));
  }, [weakCategoryRanking]);

  return (
    <div className={projectionMode ? 'bg-slate-900 text-white min-h-screen -m-6 lg:-m-8 p-8 lg:p-12' : ''}>
      {projectionMode && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setProjectionMode(false)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            退出投屏
          </button>
        </div>
      )}
      {!projectionMode && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setProjectionMode(true)}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            🖥 投屏模式
          </button>
        </div>
      )}

      <div className={projectionMode ? 'grid grid-cols-2 md:grid-cols-4 gap-6 mb-8' : 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'}>
        <div className={projectionMode ? 'bg-slate-800 border border-slate-700 rounded-xl p-6' : 'card p-4'}>
          <div className="flex items-center gap-2 mb-2">
            <Users className={projectionMode ? 'w-6 h-6 text-blue-400' : 'w-5 h-5 text-primary-500'} />
            <span className={projectionMode ? 'text-lg text-slate-400' : 'text-sm text-slate-500'}>班级人数</span>
          </div>
          <p className={projectionMode ? 'text-5xl font-bold text-white' : 'text-2xl font-bold text-slate-900'}>{classStats.total}</p>
          <p className={projectionMode ? 'text-base text-slate-400' : 'text-xs text-slate-500'}>已通过 {classStats.passedCount} 人</p>
        </div>
        <div className={projectionMode ? 'bg-slate-800 border border-slate-700 rounded-xl p-6' : 'card p-4'}>
          <div className="flex items-center gap-2 mb-2">
            <Target className={projectionMode ? 'w-6 h-6 text-green-400' : 'w-5 h-5 text-success-500'} />
            <span className={projectionMode ? 'text-lg text-slate-400' : 'text-sm text-slate-500'}>平均正确率</span>
          </div>
          <p className={projectionMode ? 'text-5xl font-bold text-white' : 'text-2xl font-bold text-slate-900'}>{classStats.avgAccuracy}%</p>
          <p className={projectionMode ? 'text-base text-slate-400' : 'text-xs text-slate-500'}>人均答题 {classStats.avgQuestions} 题</p>
        </div>
        <div className={projectionMode ? 'bg-slate-800 border border-slate-700 rounded-xl p-6' : 'card p-4'}>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className={projectionMode ? 'w-6 h-6 text-amber-400' : 'w-5 h-5 text-accent-500'} />
            <span className={projectionMode ? 'text-lg text-slate-400' : 'text-sm text-slate-500'}>通过率</span>
          </div>
          <p className={projectionMode ? 'text-5xl font-bold text-white' : 'text-2xl font-bold text-slate-900'}>
            {classStats.total > 0 ? Math.round((classStats.passedCount / classStats.total) * 100) : 0}%
          </p>
          <p className={projectionMode ? 'text-base text-slate-400' : 'text-xs text-slate-500'}>{classStats.passedCount}/{classStats.total} 人</p>
        </div>
        <div className={projectionMode ? 'bg-slate-800 border border-slate-700 rounded-xl p-6' : 'card p-4'}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className={projectionMode ? 'w-6 h-6 text-red-400' : 'w-5 h-5 text-danger-500'} />
            <span className={projectionMode ? 'text-lg text-slate-400' : 'text-sm text-slate-500'}>成绩分布</span>
          </div>
          <div className="space-y-1">
            {accuracyRanges.map(r => (
              <div key={r.label} className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', r.color)} />
                <span className={projectionMode ? 'text-base text-slate-300' : 'text-xs text-slate-600'}>{r.count}人 {r.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={projectionMode ? 'bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8' : 'card p-6 mb-6'}>
        <h2 className={projectionMode ? 'font-semibold text-white mb-5 flex items-center gap-2 text-xl' : 'font-semibold text-slate-900 mb-4 flex items-center gap-2'}>
          <AlertTriangle className={projectionMode ? 'w-6 h-6 text-red-400' : 'w-5 h-5 text-danger-500'} />
          薄弱类别排行
        </h2>
        {weakCategoryRanking.length > 0 ? (
          <div className="space-y-3">
            {weakCategoryRanking.slice(0, 5).map((wc, i) => (
              <div key={wc.categoryName} className="flex items-center gap-3">
                <span className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                  projectionMode && i === 0 && 'bg-red-500 text-white',
                  projectionMode && i === 1 && 'bg-amber-500 text-white',
                  projectionMode && i >= 2 && 'bg-slate-600 text-slate-300',
                  !projectionMode && i === 0 && 'bg-danger-500 text-white',
                  !projectionMode && i === 1 && 'bg-accent-500 text-white',
                  !projectionMode && i >= 2 && 'bg-slate-200 text-slate-600'
                )}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={projectionMode ? 'text-lg font-medium text-white' : 'text-sm font-medium text-slate-800'}>{wc.categoryName}</span>
                    <span className={projectionMode ? 'text-sm text-red-400 font-medium' : 'text-xs text-danger-600 font-medium'}>
                      {wc.weakStudents}/{wc.totalStudents} 人薄弱
                    </span>
                  </div>
                  <div className={projectionMode ? 'h-3 bg-slate-700 rounded-full overflow-hidden' : 'h-2 bg-slate-200 rounded-full overflow-hidden'}>
                    <div
                      className={projectionMode ? 'h-full bg-red-500 rounded-full' : 'h-full bg-danger-400 rounded-full'}
                      style={{ width: `${wc.totalStudents > 0 ? (wc.weakStudents / wc.totalStudents) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={projectionMode ? 'text-base text-slate-400' : 'text-sm text-slate-500'}>暂无薄弱类别数据</p>
        )}
      </div>

      {projectionMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-xl">
              <XCircle className="w-6 h-6 text-red-400" />
              典型错题
            </h2>
            {typicalErrors.length > 0 ? (
              <div className="space-y-4">
                {typicalErrors.map(err => (
                  <div key={err.categoryName} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-medium text-white">{err.categoryName}</span>
                      <span className="text-sm text-red-400">均正确率 {err.avgAccuracy}%</span>
                    </div>
                    <p className="text-slate-400 text-sm">{err.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-base">暂无典型错题数据</p>
            )}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-xl">
              <Calendar className="w-6 h-6 text-blue-400" />
              建议复习路线
            </h2>
            {reviewRoute.length > 0 ? (
              <div className="relative pl-8">
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-600" />
                {reviewRoute.map(item => (
                  <div key={item.day} className="relative mb-6 last:mb-0">
                    <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-800" />
                    <div>
                      <p className="text-sm text-slate-400 mb-1">第{item.day}天</p>
                      <p className="text-lg font-medium text-white">{item.categoryName}</p>
                      <p className="text-sm text-red-400">{item.weakCount} 人薄弱</p>
                    </div>
                    {item.day < reviewRoute.length && (
                      <div className="absolute -left-4 top-6 text-slate-600 text-lg">↓</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-base">暂无复习路线数据</p>
            )}
          </div>
        </div>
      )}

      {!projectionMode && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent-500" />
            学员成绩一览
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">排名</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">学员</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">答题数</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">正确率</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">通过关卡</th>
                  <th className="text-left py-3 px-3 text-sm font-medium text-slate-500">薄弱类别</th>
                </tr>
              </thead>
              <tbody>
                {allStudents.map((student, idx) => (
                  <tr key={student.id} className={cn(
                    'border-b border-slate-100',
                    student.id === 'me' && 'bg-primary-50/50'
                  )}>
                    <td className="py-3 px-3">
                      <span className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                        idx === 0 && 'bg-amber-100 text-amber-700',
                        idx === 1 && 'bg-slate-200 text-slate-600',
                        idx === 2 && 'bg-amber-50 text-amber-600',
                        idx > 2 && 'text-slate-400'
                      )}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{student.avatar}</span>
                        <span className="text-sm font-medium text-slate-800">{student.name}</span>
                        {student.id === 'me' && (
                          <span className="tag-primary text-xs">我</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-sm text-slate-700">{student.totalQuestions}</td>
                    <td className="py-3 px-3">
                      <span className={cn(
                        'text-sm font-bold',
                        student.accuracy >= 80 ? 'text-success-600' :
                        student.accuracy >= 60 ? 'text-accent-600' : 'text-danger-600'
                      )}>
                        {student.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-sm text-slate-700">
                        {student.levelsPassed}/{student.totalLevels}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {student.weakCategories.length > 0 ? (
                          student.weakCategories.slice(0, 2).map(wc => (
                            <span key={wc.categoryName} className="tag-danger text-xs">
                              {wc.categoryName} {wc.accuracy}%
                            </span>
                          ))
                        ) : (
                          <span className="tag-success text-xs">均衡</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
