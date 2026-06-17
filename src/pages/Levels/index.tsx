import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Target, 
  ChevronRight,
  Star,
  Award,
  Zap
} from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { levelList } from '@/data/levels';
import { useLearningStore } from '@/store/useLearningStore';
import { cn } from '@/lib/utils';
import { formatTime } from '@/utils/format';

export const LevelsList = () => {
  const navigate = useNavigate();
  const { levelProgress, updateLevelProgress } = useLearningStore();
  
  const [levels, setLevels] = useState(levelList);

  useEffect(() => {
    const updatedLevels = levelList.map((level, index) => {
      const progress = levelProgress.find(p => p.levelId === level.id);
      const isUnlocked = index === 0 || levelProgress.some(p => p.levelId === levelList[index - 1].id && p.isPassed);
      
      return {
        ...level,
        isUnlocked,
        isPassed: progress?.isPassed || false,
        bestScore: progress?.bestScore,
        bestTime: progress?.bestTime,
      };
    });
    setLevels(updatedLevels);
  }, [levelProgress]);

  const getLevelIcon = (levelId: number) => {
    switch (levelId) {
      case 1: return Star;
      case 2: return Trophy;
      case 3: return Award;
      default: return Target;
    }
  };

  const getLevelColor = (levelId: number) => {
    switch (levelId) {
      case 1: return 'from-green-500 to-emerald-700';
      case 2: return 'from-blue-500 to-primary-700';
      case 3: return 'from-accent-500 to-orange-700';
      default: return 'from-slate-500 to-slate-700';
    }
  };

  const handleStartLevel = (levelId: number) => {
    const level = levels.find(l => l.id === levelId);
    if (level?.isUnlocked) {
      navigate(`/levels/${levelId}`);
    }
  };

  return (
    <PageLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-success-700 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">闯关审校</h1>
              <p className="text-slate-500">限时完成审校任务，挑战更高等级</p>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">闯关进度</h2>
            <span className="text-sm text-slate-500">
              已通过 {levels.filter(l => l.isPassed).length}/{levels.length} 关
            </span>
          </div>
          <div className="flex gap-2">
            {levels.map(level => (
              <div
                key={level.id}
                className={cn(
                  'flex-1 h-3 rounded-full transition-all',
                  level.isPassed ? 'bg-success-500' : level.isUnlocked ? 'bg-primary-200' : 'bg-slate-200'
                )}
              />
            ))}
          </div>
        </div>

        {/* Level Cards */}
        <div className="space-y-6">
          {levels.map((level, index) => {
            const Icon = getLevelIcon(level.id);
            const isLocked = !level.isUnlocked;
            
            return (
              <div
                key={level.id}
                className={cn(
                  'card overflow-hidden transition-all',
                  isLocked ? 'opacity-60' : 'hover:shadow-lg hover:scale-[1.01]'
                )}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                  {/* Icon and Status */}
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center relative',
                      getLevelColor(level.id)
                    )}>
                      <Icon className="w-8 h-8 text-white" />
                      {level.isPassed && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-success-500 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 bg-slate-900/60 rounded-2xl flex items-center justify-center">
                          <Lock className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="tag-primary">第 {level.id} 关</span>
                        {level.isPassed && <span className="tag-success">已通过</span>}
                        {isLocked && <span className="tag">未解锁</span>}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">{level.name}</h3>
                      <p className="text-sm text-slate-500">{level.description}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="md:col-span-2 grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <Clock className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">限时</p>
                      <p className="font-bold text-slate-900">{formatTime(level.timeLimit)}</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <Target className="w-5 h-5 text-accent-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">题目数</p>
                      <p className="font-bold text-slate-900">{level.totalQuestions}题</p>
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <Trophy className="w-5 h-5 text-success-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">及格线</p>
                      <p className="font-bold text-slate-900">{level.passScore}分</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col items-center justify-center gap-2">
                    {level.bestScore !== undefined && (
                      <div className="text-center mb-2">
                        <p className="text-xs text-slate-500">最佳成绩</p>
                        <p className="font-bold text-primary-600">
                          {level.bestScore}分
                          {level.bestTime !== undefined && (
                            <span className="text-slate-500 text-sm ml-1">
                              ({formatTime(level.bestTime)})
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => handleStartLevel(level.id)}
                      disabled={isLocked}
                      className={cn(
                        'btn-primary w-full justify-center',
                        isLocked && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          未解锁
                        </>
                      ) : level.isPassed ? (
                        <>
                          再挑战一次
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      ) : (
                        <>
                          开始挑战
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                    {isLocked && index > 0 && (
                      <p className="text-xs text-slate-500">
                        请先通过「{levelList[index - 1].name}」
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6">
          <h3 className="font-semibold text-primary-800 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5" />
            闯关技巧
          </h3>
          <ul className="space-y-2 text-sm text-primary-900">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
              <span>答题前先仔细阅读题目，理解题意后再作答</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
              <span>注意时间限制，合理分配每道题的答题时间</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
              <span>多选题要选全所有正确选项，少选不得分</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
              <span>答错的题目会自动加入错题本，可反复练习</span>
            </li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
};
