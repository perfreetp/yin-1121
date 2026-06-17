import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileEdit, 
  Trophy, 
  XCircle, 
  BarChart3, 
  TrendingUp,
  Clock,
  Target,
  Star,
  ChevronRight,
  Zap
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { useLearningStore } from '@/store/useLearningStore';
import { knowledgeList } from '@/data/knowledge';
import { questionList } from '@/data/questions';
import { formatDuration, formatPercent } from '@/utils/format';
import { getWeakCategories } from '@/utils/calculation';

const moduleCards = [
  {
    path: '/rules',
    title: '规则课堂',
    description: '系统学习清单编制规范，掌握核心知识点',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
  },
  {
    path: '/practice',
    title: '案例演练',
    description: '按事项类型练习，逐题即时纠错反馈',
    icon: FileEdit,
    color: 'from-emerald-500 to-emerald-700',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
  },
  {
    path: '/levels',
    title: '闯关审校',
    description: '限时综合考核，挑战编制审校能力',
    icon: Trophy,
    color: 'from-amber-500 to-amber-700',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
  },
  {
    path: '/mistakes',
    title: '错题本',
    description: '自动收集错题，分析薄弱环节',
    icon: XCircle,
    color: 'from-rose-500 to-rose-700',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-700',
  },
  {
    path: '/profile',
    title: '成绩面板',
    description: '查看学习数据，生成能力画像',
    icon: BarChart3,
    color: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
  },
];

export const Home = () => {
  const navigate = useNavigate();
  const { getStats, learnedIds, mistakeRecords } = useLearningStore();
  const stats = getStats();
  
  const weakCategories = getWeakCategories(stats.categoryAccuracy);
  const recommendedKnowledge = knowledgeList
    .filter(k => weakCategories.includes(k.category))
    .slice(0, 3);
  
  const notLearned = knowledgeList.filter(k => !learnedIds.includes(k.id)).slice(0, 3);
  const unmasteredMistakes = mistakeRecords.filter(m => !m.isMastered).slice(0, 3);

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <h1 className="text-3xl font-bold mb-3 font-display">
              政务服务清单编制演练平台
            </h1>
            <p className="text-primary-100 text-lg mb-6 max-w-2xl">
              通过仿真方式学习实施清单编制规则和常见错误，将经验型工作转化为可复制的标准化上手流程。
            </p>
            
            {stats.totalQuestions > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-primary-200" />
                    <span className="text-sm text-primary-200">已答题</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalQuestions} 题</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary-200" />
                    <span className="text-sm text-primary-200">正确率</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.accuracy}%</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-primary-200" />
                    <span className="text-sm text-primary-200">学习时长</span>
                  </div>
                  <p className="text-2xl font-bold">{formatDuration(stats.totalTime)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-primary-200" />
                    <span className="text-sm text-primary-200">学习天数</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.studyDays} 天</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/rules')}
                className="btn bg-white text-primary-700 hover:bg-primary-50 font-semibold px-6 py-3"
              >
                <Zap className="w-5 h-5 mr-2" />
                开始学习
              </button>
            )}
          </div>
        </div>

        {/* Module Cards */}
        <h2 className="text-xl font-bold mb-4 font-display">学习模块</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8 animate-stagger">
          {moduleCards.map((module) => (
            <div
              key={module.path}
              onClick={() => navigate(module.path)}
              className="card card-hover cursor-pointer p-5 group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <module.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{module.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{module.description}</p>
              <div className={`flex items-center gap-1 text-sm font-medium ${module.textColor}`}>
                <span>进入学习</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Recommendation */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-accent-500" />
              今日推荐学习
            </h3>
            {notLearned.length > 0 ? (
              <div className="space-y-3">
                {notLearned.map((k) => (
                  <div
                    key={k.id}
                    onClick={() => navigate(`/rules/${k.id}`)}
                    className="p-3 rounded-lg bg-slate-50 hover:bg-primary-50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="tag-primary text-xs mb-1 inline-block">{k.categoryName}</span>
                        <p className="text-sm font-medium text-slate-800 group-hover:text-primary-700">{k.title}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">🎉 所有知识点已学习完成！</p>
            )}
          </div>

          {/* Weak Points */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-danger-500" />
              薄弱知识点
            </h3>
            {recommendedKnowledge.length > 0 ? (
              <div className="space-y-3">
                {recommendedKnowledge.map((k) => (
                  <div
                    key={k.id}
                    onClick={() => navigate(`/rules/${k.id}`)}
                    className="p-3 rounded-lg bg-danger-50 hover:bg-danger-100 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="tag-danger text-xs mb-1 inline-block">{k.categoryName}</span>
                        <p className="text-sm font-medium text-slate-800">{k.title}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-danger-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {stats.totalQuestions > 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">👍 继续保持，暂无明显薄弱点</p>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">完成练习后将展示薄弱点分析</p>
                )}
              </div>
            )}
          </div>

          {/* Recent Mistakes */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-accent-500" />
              待复习错题
            </h3>
            {unmasteredMistakes.length > 0 ? (
              <div className="space-y-3">
                {unmasteredMistakes.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => navigate('/mistakes')}
                    className="p-3 rounded-lg bg-accent-50 hover:bg-accent-100 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="tag-accent text-xs mb-1 inline-block">{m.mistakeTypeName}</span>
                        <p className="text-sm font-medium text-slate-800 line-clamp-1">
                          {m.question.content.slice(0, 30)}...
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-accent-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                {mistakeRecords.length > 0 ? '✅ 所有错题已掌握' : '📝 开始练习后将收集错题'}
              </p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-5 text-center">
            <p className="text-3xl font-bold text-primary-600 mb-1">{knowledgeList.length}</p>
            <p className="text-sm text-slate-500">知识点总数</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-3xl font-bold text-success-600 mb-1">{questionList.length}</p>
            <p className="text-sm text-slate-500">练习题总数</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-3xl font-bold text-accent-600 mb-1">{learnedIds.length}</p>
            <p className="text-sm text-slate-500">已学习知识点</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-3xl font-bold text-purple-600 mb-1">
              {stats.totalQuestions > 0 ? formatPercent(stats.correctCount, stats.totalQuestions) : '--'}
            </p>
            <p className="text-sm text-slate-500">正确率</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Home;
