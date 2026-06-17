import { useState, useMemo } from 'react';
import { Search, Filter, BookOpen, CheckCircle2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { KnowledgeCard } from '@/components/business/KnowledgeCard';
import { ProgressBar } from '@/components/common/ProgressBar';
import { knowledgeList } from '@/data/knowledge';
import { KnowledgeCategoryNames, type KnowledgeCategory } from '@/types';
import { useLearningStore } from '@/store/useLearningStore';
import { cn } from '@/lib/utils';

const categories: { value: KnowledgeCategory | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'acceptCondition', label: '受理条件' },
  { value: 'applicationMaterial', label: '申请材料' },
  { value: 'legalBasis', label: '法定依据' },
  { value: 'promiseTime', label: '承诺时限' },
  { value: 'materialReduction', label: '材料减免' },
  { value: 'commonMistakes', label: '常见错误' },
];

export const RulesList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const { learnedIds } = useLearningStore();

  const filteredKnowledge = useMemo(() => {
    return knowledgeList
      .filter(k => {
        const matchCategory = selectedCategory === 'all' || k.category === selectedCategory;
        const matchSearch = searchQuery === '' || 
          k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          k.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [searchQuery, selectedCategory]);

  const totalLearned = knowledgeList.filter(k => learnedIds.includes(k.id)).length;
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; learned: number }> = {};
    categories.forEach(cat => {
      if (cat.value === 'all') return;
      const categoryKnowledge = knowledgeList.filter(k => k.category === cat.value);
      const learned = categoryKnowledge.filter(k => learnedIds.includes(k.id)).length;
      stats[cat.value] = {
        total: categoryKnowledge.length,
        learned,
      };
    });
    return stats;
  }, [learnedIds]);

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">规则课堂</h1>
              <p className="text-slate-500">系统学习清单编制规范，掌握核心知识点</p>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 mb-1">学习进度</h2>
              <p className="text-sm text-slate-500">
                已学习 <span className="font-semibold text-primary-600">{totalLearned}</span> / {knowledgeList.length} 个知识点
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success-500" />
              <span className="text-2xl font-bold text-success-600">
                {Math.round((totalLearned / knowledgeList.length) * 100)}%
              </span>
            </div>
          </div>
          <ProgressBar value={totalLearned} max={knowledgeList.length} showLabel={false} />
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {categories.filter(c => c.value !== 'all').map(cat => {
            const stats = categoryStats[cat.value] || { total: 0, learned: 0 };
            const percent = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  'card p-4 text-left transition-all',
                  selectedCategory === cat.value && 'ring-2 ring-primary-500 border-primary-500'
                )}
              >
                <p className="text-sm font-medium text-slate-700 mb-1">{cat.label}</p>
                <p className="text-2xl font-bold text-primary-600 mb-2">{percent}%</p>
                <div className="progress-bar h-1.5">
                  <div className="progress-fill" style={{ width: `${percent}%` }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索知识点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <Filter className="w-5 h-5 text-slate-400 shrink-0" />
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  selectedCategory === cat.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Knowledge List */}
        {filteredKnowledge.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
            {filteredKnowledge.map((knowledge) => (
              <KnowledgeCard 
                key={knowledge.id} 
                knowledge={knowledge} 
                showProgress={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">未找到相关知识点</h3>
            <p className="text-slate-500">请尝试更换搜索关键词或筛选条件</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
};
