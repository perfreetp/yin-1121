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
  MistakeType
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
  
  markAsLearned: (id: string) => void;
  addAnswerRecord: (record: Omit<UserAnswer, 'id' | 'answerTime'> & { sessionId?: string }) => boolean;
  addMistake: (question: Question, userAnswer: string | string[], mistakeType?: MistakeType, sessionId?: string) => boolean;
  markMistakeAsMastered: (id: string) => void;
  incrementMistakeReviewCount: (id: string) => void;
  toggleFavorite: (target: Omit<Favorite, 'id' | 'createdAt'>) => void;
  removeFavorite: (id: string) => void;
  updateLevelProgress: (data: Partial<LevelProgress> & { levelId: number }) => void;
  getStats: () => LearningStats;
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
        });
      },
    }),
    {
      name: 'gov-training-learning-storage',
    }
  )
);
