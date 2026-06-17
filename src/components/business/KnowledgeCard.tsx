import { BookOpen, CheckCircle, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Knowledge } from '@/types';
import { useLearningStore } from '@/store/useLearningStore';
import { cn } from '@/lib/utils';

interface KnowledgeCardProps {
  knowledge: Knowledge;
  showProgress?: boolean;
}

export const KnowledgeCard = ({ knowledge, showProgress = false }: KnowledgeCardProps) => {
  const navigate = useNavigate();
  const { learnedIds, favorites, toggleFavorite } = useLearningStore();
  
  const isLearned = learnedIds.includes(knowledge.id);
  const isFavorite = favorites.some(
    f => f.targetType === 'knowledge' && f.targetId === knowledge.id
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      targetType: 'knowledge',
      targetId: knowledge.id,
      targetTitle: knowledge.title,
      targetContent: knowledge.content,
    });
  };

  return (
    <div 
      className={cn(
        'card card-hover cursor-pointer p-5 relative group',
        isLearned && 'border-success-300 bg-success-50/30'
      )}
      onClick={() => navigate(`/rules/${knowledge.id}`)}
    >
      {isLearned && (
        <div className="absolute top-3 right-3">
          <CheckCircle className="w-5 h-5 text-success-500" />
        </div>
      )}
      
      <button
        onClick={handleFavoriteClick}
        className={cn(
          'absolute top-3 right-10 opacity-0 group-hover:opacity-100 transition-opacity',
          isFavorite && 'opacity-100'
        )}
      >
        <Star className={cn(
          'w-5 h-5 transition-colors',
          isFavorite ? 'text-accent-500 fill-accent-500' : 'text-slate-300 hover:text-accent-500'
        )} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="tag-primary text-xs">{knowledge.categoryName}</span>
          </div>
          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{knowledge.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-2">{knowledge.content}</p>
          
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-primary-600 font-medium">
              <span>查看详情</span>
              <ChevronRight className="w-4 h-4" />
            </div>
            {showProgress && isLearned && (
              <span className="text-xs text-success-600 font-medium">已学习</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
