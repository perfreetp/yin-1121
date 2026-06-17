import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Shuffle, 
  Clock, 
  Target, 
  ChevronRight,
  PlayCircle,
  Filter,
  Search,
  BarChart3
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { questionList, getQuestionsByKnowledge, getQuestionsByItemType, getRandomQuestions } from '@/data/questions';
import { knowledgeList } from '@/data/knowledge';
import { ItemTypeNames, KnowledgeCategoryNames, type ItemType, type KnowledgeCategory } from '@/types';
import { useLearningStore } from '@/store/useLearningStore';
import { cn } from '@/lib/utils';

const itemTypes: { value: ItemType | 'all'; label: string }[] = [
  { value: 'all', label: '全部事项' },
  { value: 'administrativeLicense', label: '行政许可' },
  { value: 'administrativePayment', label: '行政给付' },
  { value: 'administrativeConfirmation', label: '行政确认' },
  { value: 'administrativeReward', label: '行政奖励' },
  { value: 'publicService', label: '公共服务' },
];

const practiceModes = [
  {
    id: 'knowledge',
    title: '按知识点练习',
    description: '针对特定知识点进行专项练习',
    icon: BookOpen,
    color: 'from-primary-500 to-primary-700',
  },
  {
    id: 'itemType',
    title: '按事项类型练习',
    description: '按行政许可、公共服务等分类练习',
    icon: FileText,
    color: 'from-accent-500 to-accent-700',
  },
  {
    id: 'random',
    title: '随机抽取练习',
    description: '系统随机抽取题目进行综合练习',
    icon: Shuffle,
    color: 'from-success-500 to-success-700',
  },
];

export const PracticeList = () => {
  const { knowledgeId } = useParams<{ knowledgeId?: string }>();
  const navigate = useNavigate();
  const { getStats } = useLearningStore();
  const stats = getStats();

  const [selectedMode, setSelectedMode] = useState<string>(knowledgeId ? 'knowledge' : 'itemType');
  const [selectedItemType, setSelectedItemType] = useState<ItemType | 'all'>('all');
  const [selectedKnowledge, setSelectedKnowledge] = useState<string>(knowledgeId || '');
  const [questionCount, setQuestionCount] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredKnowledge = useMemo(() => {
    return knowledgeList.filter(k => 
      searchQuery === '' || 
      k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const availableQuestions = useMemo(() => {
    if (selectedMode === 'knowledge' && selectedKnowledge) {
      return getQuestionsByKnowledge(selectedKnowledge);
    }
    if (selectedMode === 'itemType' && selectedItemType !== 'all') {
      return getQuestionsByItemType(selectedItemType);
    }
    return questionList;
  }, [selectedMode, selectedKnowledge, selectedItemType]);

  const handleStartPractice = () => {
    let questionsToPractice = availableQuestions;
    
    if (selectedMode === 'random') {
      questionsToPractice = getRandomQuestions(questionCount);
    } else if (selectedMode === 'knowledge' && selectedKnowledge) {
      questionsToPractice = getQuestionsByKnowledge(selectedKnowledge);
    } else if (selectedMode === 'itemType' && selectedItemType !== 'all') {
      questionsToPractice = getQuestionsByItemType(selectedItemType);
    }

    if (questionsToPractice.length === 0) {
      return;
    }

    const questionIds = questionsToPractice.map(q => q.id).join(',');
    navigate(`/practice/session?ids=${questionIds}`);
  };

  const canStart = (selectedMode === 'random') || 
    (selectedMode === 'knowledge' && selectedKnowledge) || 
    (selectedMode === 'itemType' && selectedItemType !== 'all');

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">案例演练</h1>
              <p className="text-slate-500">选择练习模式，巩固清单编制技能</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-slate-500">累计答题</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.totalQuestions}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-success-500" />
              <span className="text-sm text-slate-500">正确率</span>
            </div>
            <p className="text-2xl font-bold text-success-600">{Math.round(stats.accuracy)}%</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-accent-500" />
              <span className="text-sm text-slate-500">累计用时</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{Math.round(stats.totalTime / 60)}分钟</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-slate-500">学习天数</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stats.studyDays}天</p>
          </div>
        </div>

        {/* Practice Modes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {practiceModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode.id);
                if (mode.id === 'random') {
                  setSelectedKnowledge('');
                  setSelectedItemType('all');
                }
              }}
              className={cn(
                'card p-6 text-left transition-all hover:scale-[1.02]',
                selectedMode === mode.id && 'ring-2 ring-primary-500 border-primary-500'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4',
                mode.color
              )}>
                <mode.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{mode.title}</h3>
              <p className="text-sm text-slate-500">{mode.description}</p>
            </button>
          ))}
        </div>

        {/* Configuration Panel */}
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-500" />
            练习配置
          </h2>

          {/* By Knowledge */}
          {selectedMode === 'knowledge' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索知识点..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {filteredKnowledge.map(k => {
                  const questionCount = getQuestionsByKnowledge(k.id).length;
                  return (
                    <button
                      key={k.id}
                      onClick={() => setSelectedKnowledge(k.id)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all hover:border-primary-300',
                        selectedKnowledge === k.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200'
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <span className="tag-primary text-xs">{k.categoryName}</span>
                        <span className="text-xs text-slate-500">{questionCount}题</span>
                      </div>
                      <p className="font-medium text-slate-900 text-sm line-clamp-1">{k.title}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Item Type */}
          {selectedMode === 'itemType' && (
            <div>
              <p className="text-sm text-slate-600 mb-3">选择事项类型：</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {itemTypes.map(type => {
                  const count = type.value === 'all' 
                    ? questionList.length 
                    : getQuestionsByItemType(type.value).length;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedItemType(type.value)}
                      className={cn(
                        'p-4 rounded-lg border text-center transition-all hover:border-primary-300',
                        selectedItemType === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200'
                      )}
                    >
                      <p className="font-medium text-slate-900 mb-1">{type.label}</p>
                      <p className="text-2xl font-bold text-primary-600">{count}</p>
                      <p className="text-xs text-slate-500">道题</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Random */}
          {selectedMode === 'random' && (
            <div>
              <p className="text-sm text-slate-600 mb-3">选择题目数量：</p>
              <div className="flex items-center gap-4">
                {[5, 10, 15, 18].map(count => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={cn(
                      'px-6 py-3 rounded-lg border font-medium transition-all',
                      questionCount === count
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 text-slate-600 hover:border-primary-300'
                    )}
                  >
                    {count} 题
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Question Preview */}
        {availableQuestions.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-4">题目预览（共 {availableQuestions.length} 题）</h2>
            <div className="grid grid-cols-6 md:grid-cols-9 lg:grid-cols-12 gap-2">
              {availableQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className={cn(
                    'w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium',
                    q.type === 'fillBlank' && 'bg-blue-100 text-blue-700',
                    q.type === 'trueFalse' && 'bg-green-100 text-green-700',
                    q.type === 'legalMatch' && 'bg-purple-100 text-purple-700',
                    q.type === 'materialWrite' && 'bg-orange-100 text-orange-700',
                    q.type === 'timeJudge' && 'bg-red-100 text-red-700',
                    q.type === 'comprehensive' && 'bg-slate-100 text-slate-700'
                  )}
                  title={`${q.typeName} - ${q.itemTypeName}`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100" /> 填空题</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100" /> 判断题</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-100" /> 法规匹配</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-100" /> 材料编写</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> 时限判断</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-100" /> 综合题</span>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="flex justify-center">
          <button
            onClick={handleStartPractice}
            disabled={!canStart || availableQuestions.length === 0}
            className={cn(
              'btn-primary text-lg px-12 py-4',
              (!canStart || availableQuestions.length === 0) && 'opacity-50 cursor-not-allowed'
            )}
          >
            <PlayCircle className="w-5 h-5 mr-2" />
            开始练习
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </PageLayout>
  );
};
