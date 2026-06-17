import type { Level } from '@/types';
import { questionList } from './questions';

export const levelList: Level[] = [
  {
    id: 1,
    name: '初级审校员',
    description: '掌握基础编制规范，识别常见错误',
    timeLimit: 600,
    passScore: 70,
    totalQuestions: 8,
    questionPool: questionList.filter(q => q.difficulty === 1).map(q => q.id),
    isUnlocked: true,
    isPassed: false,
  },
  {
    id: 2,
    name: '中级审校员',
    description: '熟练运用编制规则，处理复杂情形',
    timeLimit: 900,
    passScore: 80,
    totalQuestions: 10,
    questionPool: questionList.filter(q => q.difficulty <= 2).map(q => q.id),
    isUnlocked: false,
    isPassed: false,
  },
  {
    id: 3,
    name: '高级审校员',
    description: '精通编制规范，综合运用能力考核',
    timeLimit: 1200,
    passScore: 85,
    totalQuestions: 12,
    questionPool: questionList.map(q => q.id),
    isUnlocked: false,
    isPassed: false,
  },
];

export const getLevelById = (id: number): Level | undefined => {
  return levelList.find(l => l.id === id);
};

export const getRandomQuestionsForLevel = (level: Level): string[] => {
  const pool = [...level.questionPool];
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(level.totalQuestions, shuffled.length));
};
