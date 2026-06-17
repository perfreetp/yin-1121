import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookX, 
  Filter, 
  Search, 
  CheckCircle2, 
  Trash2,
  RotateCcw,
  PlayCircle,
  AlertTriangle,
  ChevronRight,
  Target
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { AnswerFeedback } from '@/components/business/AnswerFeedback';
import { useLearningStore } from '@/store/useLearningStore';
import { MistakeTypeNames, type MistakeType } from '@/types';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/format';

const mistakeTypes: { value: MistakeType | 'all'; label: string }[] = [
  { value: 'all', label: '全部错误' },
  { value: 'missingElement', label: '要素缺失' },
  { value: 'incorrectBasis', label: '依据错误' },
  { value: 'unreasonableTime', label: '时限不合理' },
  { value: 'nonStandardMaterial', label: '材料不规范' },
  { value: 'incompleteCondition', label: '条件不完整' },
  { value: 'other', label: '其他错误' },
];

export const MistakesList = () => {
  const navigate = useNavigate();
  const { mistakeRecords, markMistakeAsMastered, incrementMistakeReviewCount } = useLearningStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MistakeType | 'all'>('all');
  const [showMastered, setShowMastered] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMistakes = useMemo(() => {
    return mistakeRecords
      .filter(m => {
        const matchType = selectedType === 'all' || m.mistakeType === selectedType;
        const matchMastered = showMastered ? true : !m.isMastered;
        const matchSearch = searchQuery === '' || 
          m.question.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchType && matchMastered && matchSearch;
      })
      .sort((a, b) => new Date(b.answerTime).getTime() - new Date(a.answerTime).getTime());
  }, [mistakeRecords, selectedType, showMastered, searchQuery]);

  const unmasteredCount = mistakeRecords.filter(m => !m.isMastered).length;
  const masteredCount = mistakeRecords.filter(m => m.isMastered).length;

  const mistakeTypeStats = useMemo(() => {
    const stats: Record<string, { total: number; mastered: number }> = {};
    mistakeTypes.forEach(t => {
      if (t.value === 'all') return;
      const typeMistakes = mistakeRecords.filter(m => m.mistakeType === t.value);
      stats[t.value] = {
        total: typeMistakes.length,
        mastered: typeMistakes.filter(m => m.isMastered).length,
      };
    });
    return stats;
  }, [mistakeRecords]);

  const handlePracticeMistake = (mistakeId: string) => {
    incrementMistakeReviewCount(mistakeId);
    const mistake = mistakeRecords.find(m => m.id === mistakeId);
    if (mistake) {
      navigate(`/practice/session?ids=${mistake.question.id}`);
    }
  };

  const handlePracticeAll = () => {
    const unmasteredMistakes = mistakeRecords.filter(m => !m.isMastered);
    if (unmasteredMistakes.length === 0) return;
    
    const questionIds = unmasteredMistakes.map(m => m.question.id).join(',');
    navigate(`/practice/session?ids=${questionIds}`);
  };

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-danger-500 to-danger-700 flex items-center justify-center">
                <BookX className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display">错题本</h1>
                <p className="text-slate-500">总结错误规律，巩固薄弱知识点</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/mistakes/analysis')}
              className="btn-secondary"
            >
              <Target className="w-4 h-4 mr-2" />
              薄弱点分析
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-sm text-slate-500 mb-1">累计错题</p>
            <p className="text-3xl font-bold text-slate-900">{mistakeRecords.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500 mb-1">待巩固</p>
            <p className="text-3xl font-bold text-danger-600">{unmasteredCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500 mb-1">已掌握</p>
            <p className="text-3xl font-bold text-success-600">{masteredCount}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500 mb-1">掌握率</p>
            <p className="text-3xl font-bold text-primary-600">
              {mistakeRecords.length > 0 
                ? Math.round((masteredCount / mistakeRecords.length) * 100) 
                : 0}%
            </p>
          </div>
        </div>

        {/* Mistake Type Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {mistakeTypes.filter(t => t.value !== 'all').map(type => {
            const stats = mistakeTypeStats[type.value] || { total: 0, mastered: 0 };
            const percent = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
            
            return (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={cn(
                  'card p-3 text-left transition-all',
                  selectedType === type.value && 'ring-2 ring-primary-500 border-primary-500'
                )}
              >
                <p className="text-sm font-medium text-slate-700 mb-1">{type.label}</p>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-xl font-bold text-slate-900">{stats.total}</span>
                  <span className="text-xs text-slate-500">题</span>
                </div>
                <div className="progress-bar h-1">
                  <div 
                    className="progress-fill bg-success-500" 
                    style={{ width: `${percent}%` }} 
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="搜索错题..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showMastered}
                onChange={(e) => setShowMastered(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-600">显示已掌握</span>
            </label>
            {unmasteredCount > 0 && (
              <button onClick={handlePracticeAll} className="btn-accent">
                <PlayCircle className="w-4 h-4 mr-2" />
                练习全部错题
              </button>
            )}
          </div>
        </div>

        {/* Mistake List */}
        {filteredMistakes.length > 0 ? (
          <div className="space-y-4">
            {filteredMistakes.map((mistake, index) => (
              <div 
                key={mistake.id}
                className={cn(
                  'card overflow-hidden transition-all',
                  mistake.isMastered && 'opacity-70'
                )}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="tag-danger">{mistake.mistakeTypeName}</span>
                      <span className="tag-accent">{mistake.question.typeName}</span>
                      <span className="tag-primary">{mistake.question.itemTypeName}</span>
                      {mistake.reviewCount > 0 && (
                        <span className="tag">已复习 {mistake.reviewCount} 次</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDate(mistake.answerTime)}
                    </span>
                  </div>

                  <div 
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === mistake.id ? null : mistake.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-slate-800 line-clamp-2 flex-1">
                        {mistake.question.content}
                      </p>
                      <ChevronRight className={cn(
                        'w-5 h-5 text-slate-400 shrink-0 transition-transform',
                        expandedId === mistake.id && 'rotate-90'
                      )} />
                    </div>
                  </div>

                  {expandedId === mistake.id && (
                    <div className="mt-4 animate-fade-in-up">
                      <AnswerFeedback
                        question={mistake.question}
                        isCorrect={false}
                        correctAnswer={mistake.question.correctAnswer}
                        userAnswer={mistake.userAnswer}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {!mistake.isMastered && (
                        <button
                          onClick={() => markMistakeAsMastered(mistake.id)}
                          className="btn-success text-sm py-2"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          标记已掌握
                        </button>
                      )}
                      {mistake.isMastered && (
                        <button
                          onClick={() => markMistakeAsMastered(mistake.id)}
                          className="btn-secondary text-sm py-2 opacity-50"
                          disabled
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          已掌握
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => handlePracticeMistake(mistake.id)}
                      className="btn-primary text-sm py-2"
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      再练一次
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            {mistakeRecords.length === 0 ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-success-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">暂无错题</h3>
                <p className="text-slate-500 mb-4">太棒了！你还没有做错任何题目</p>
                <button onClick={() => navigate('/practice')} className="btn-primary">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  去做练习
                </button>
              </>
            ) : (
              <>
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">未找到相关错题</h3>
                <p className="text-slate-500">请尝试更换筛选条件</p>
              </>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};
