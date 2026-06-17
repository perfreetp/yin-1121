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
  
  markAsLearned: (id: string) => void;
  addAnswerRecord: (record: Omit<UserAnswer, 'id' | 'answerTime'>) => void;
  addMistake: (question: Question, userAnswer: string | string[], mistakeType?: MistakeType) => void;
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
      
      markAsLearned: (id: string) => {
        set(state => {
          if (state.learnedIds.includes(id)) return state;
          return { learnedIds: [...state.learnedIds, id] };
        });
      },
      
      addAnswerRecord: (record) => {
        set(state => ({
          answerRecords: [
            ...state.answerRecords,
            {
              ...record,
              id: generateId(),
              answerTime: new Date().toISOString(),
            },
          ],
        }));
      },
      
      addMistake: (question, userAnswer, mistakeType) => {
        set(state => {
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
          return { mistakeRecords: [...state.mistakeRecords, newMistake] };
        });
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
