import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  UserAnswer, 
  MistakeRecord, 
  Favorite, 
  LearningStats, 
  LevelProgress,
  UserProfile,
  Question,
  MistakeType,
  ReviewPlan,
  ReviewPlanTask,
  ClassStudent
} from '@/types';
import { MistakeTypeNames } from '@/types';
import { questionList } from '@/data/questions';
import { generateId } from '@/utils/format';
import { calculateLearningStats, determineMistakeType } from '@/utils/calculation';

interface LearningState {
  user: UserProfile;
  learnedIds: string[];
  answerRecords: UserAnswer[];
  mistakeRecords: MistakeRecord[];
  favorites: Favorite[];
  levelProgress: LevelProgress[];
  sessionTrackedRecords: string[];
  reviewPlans: ReviewPlan[];
  
  markAsLearned: (id: string) => void;
  addAnswerRecord: (record: Omit<UserAnswer, 'id' | 'answerTime'> & { sessionId?: string }) => boolean;
  addMistake: (question: Question, userAnswer: string | string[], mistakeType?: MistakeType, sessionId?: string) => boolean;
  markMistakeAsMastered: (id: string) => void;
  incrementMistakeReviewCount: (id: string) => void;
  toggleFavorite: (target: Omit<Favorite, 'id' | 'createdAt'>) => void;
  removeFavorite: (id: string) => void;
  updateLevelProgress: (data: Partial<LevelProgress> & { levelId: number }) => void;
  createReviewPlan: (tasks: Omit<ReviewPlanTask, 'isCompleted'>[]) => string;
  completeReviewTask: (planId: string, day: number, category: string) => void;
  getStats: () => LearningStats;
  getReviewPlanProgress: () => { totalDays: number; completedDays: number; plans: ReviewPlan[] };
  resetAllData: () => void;
}

const initialUser: UserProfile = {
  id: 'user-1',
  name: '学员',
  avatar: '👤',
  joinDate: new Date().toISOString(),
};

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      user: initialUser,
      learnedIds: [],
      answerRecords: [],
      mistakeRecords: [],
      favorites: [],
      levelProgress: [],
      sessionTrackedRecords: [],
      reviewPlans: [],
      
      markAsLearned: (id: string) => {
        set(state => {
          if (state.learnedIds.includes(id)) return state;
          return { learnedIds: [...state.learnedIds, id] };
        });
      },
      
      addAnswerRecord: (record) => {
        const state = get();
        const uniqueKey = record.sessionId 
          ? `${record.sessionId}::ans::${record.questionId}` 
          : null;
        
        if (uniqueKey && state.sessionTrackedRecords.includes(uniqueKey)) {
          return false;
        }
        
        const newRecord = {
          ...record,
          id: generateId(),
          answerTime: new Date().toISOString(),
        };
        delete (newRecord as any).sessionId;
        
        set(state => ({
          answerRecords: [...state.answerRecords, newRecord],
          sessionTrackedRecords: uniqueKey 
            ? [...state.sessionTrackedRecords, uniqueKey]
            : state.sessionTrackedRecords,
        }));
        return true;
      },
      
      addMistake: (question, userAnswer, mistakeType, sessionId) => {
        const state = get();
        const uniqueKey = sessionId 
          ? `${sessionId}::mistake::${question.id}`
          : null;
        
        if (uniqueKey && state.sessionTrackedRecords.includes(uniqueKey)) {
          return false;
        }
        
        const type = mistakeType || (determineMistakeType(question) as MistakeType);
        const newMistake: MistakeRecord = {
          id: generateId(),
          question,
          userAnswer,
          mistakeType: type,
          mistakeTypeName: MistakeTypeNames[type],
          isMastered: false,
          answerTime: new Date().toISOString(),
          reviewCount: 0,
        };
        
        set(state => ({
          mistakeRecords: [...state.mistakeRecords, newMistake],
          sessionTrackedRecords: uniqueKey
            ? [...state.sessionTrackedRecords, uniqueKey]
            : state.sessionTrackedRecords,
        }));
        return true;
      },
      
      markMistakeAsMastered: (id: string) => {
        set(state => ({
          mistakeRecords: state.mistakeRecords.map(m =>
            m.id === id ? { ...m, isMastered: true } : m
          ),
        }));
      },
      
      incrementMistakeReviewCount: (id: string) => {
        set(state => ({
          mistakeRecords: state.mistakeRecords.map(m =>
            m.id === id ? { ...m, reviewCount: m.reviewCount + 1 } : m
          ),
        }));
      },
      
      toggleFavorite: (target) => {
        set(state => {
          const exists = state.favorites.find(
            f => f.targetType === target.targetType && f.targetId === target.targetId
          );
          
          if (exists) {
            return {
              favorites: state.favorites.filter(f => f.id !== exists.id),
            };
          }
          
          return {
            favorites: [
              ...state.favorites,
              {
                ...target,
                id: generateId(),
                createdAt: new Date().toISOString(),
              },
            ],
          };
        });
      },
      
      removeFavorite: (id: string) => {
        set(state => ({
          favorites: state.favorites.filter(f => f.id !== id),
        }));
      },
      
      updateLevelProgress: (data) => {
        set(state => {
          const { levelId, ...rest } = data;
          const existing = state.levelProgress.find(p => p.levelId === levelId);
          
          if (existing) {
            const newBestScore = rest.bestScore !== undefined 
              ? Math.max(existing.bestScore || 0, rest.bestScore) 
              : existing.bestScore;
            const newBestTime = rest.bestTime !== undefined
              ? (existing.bestTime === undefined || rest.bestTime < existing.bestTime ? rest.bestTime : existing.bestTime)
              : existing.bestTime;
              
            return {
              levelProgress: state.levelProgress.map(p =>
                p.levelId === levelId ? { 
                  ...p, 
                  ...rest,
                  bestScore: newBestScore,
                  bestTime: newBestTime,
                  isPassed: existing.isPassed || rest.isPassed || false
                } : p
              ),
            };
          }
          
          return {
            levelProgress: [
              ...state.levelProgress,
              {
                levelId,
                isPassed: false,
                ...rest,
                attemptDate: new Date().toISOString(),
              },
            ],
          };
        });
      },
      
      createReviewPlan: (tasks) => {
        const planId = generateId();
        const planTasks: ReviewPlanTask[] = tasks.map(t => ({
          ...t,
          isCompleted: false,
        }));
        const plan: ReviewPlan = {
          id: planId,
          createdAt: new Date().toISOString(),
          tasks: planTasks,
          totalDays: new Set(planTasks.map(t => t.day)).size,
          completedDays: 0,
        };
        set(state => ({
          reviewPlans: [...state.reviewPlans, plan],
        }));
        return planId;
      },
      
      completeReviewTask: (planId, day, category) => {
        set(state => ({
          reviewPlans: state.reviewPlans.map(plan => {
            if (plan.id !== planId) return plan;
            const updatedTasks = plan.tasks.map(t => 
              t.day === day && t.category === category 
                ? { ...t, isCompleted: true }
                : t
            );
            const completedDays = new Set(
              updatedTasks.filter(t => t.isCompleted).map(t => t.day)
            ).size;
            return { ...plan, tasks: updatedTasks, completedDays };
          }),
        }));
      },
      
      getReviewPlanProgress: () => {
        const state = get();
        const plans = state.reviewPlans;
        const totalDays = plans.reduce((s, p) => s + p.totalDays, 0);
        const completedDays = plans.reduce((s, p) => s + p.completedDays, 0);
        return { totalDays, completedDays, plans };
      },
      
      getStats: () => {
        const state = get();
        return calculateLearningStats(
          state.answerRecords,
          questionList,
          state.levelProgress,
          state.mistakeRecords
        );
      },
      
      resetAllData: () => {
        set({
          learnedIds: [],
          answerRecords: [],
          mistakeRecords: [],
          favorites: [],
          levelProgress: [],
          reviewPlans: [],
        });
      },
    }),
    {
      name: 'gov-training-learning-storage',
    }
  )
);
