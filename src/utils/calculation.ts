import type { Question, UserAnswer, LearningStats, KnowledgeCategory, MistakeRecord } from '@/types';
import { KnowledgeCategoryNames } from '@/types';
import { knowledgeList } from '@/data/knowledge';

export const checkAnswer = (
  question: Question,
  userAnswer: string | string[]
): { isCorrect: boolean; correctAnswer: string | string[] } => {
  const correctAnswer = question.correctAnswer;
  
  if (Array.isArray(correctAnswer)) {
    if (!Array.isArray(userAnswer)) {
      return { isCorrect: false, correctAnswer };
    }
    const sortedCorrect = [...correctAnswer].sort();
    const sortedUser = [...userAnswer].sort();
    const isCorrect = 
      sortedCorrect.length === sortedUser.length &&
      sortedCorrect.every((val, idx) => val.trim() === sortedUser[idx]?.trim());
    return { isCorrect, correctAnswer };
  }
  
  if (Array.isArray(userAnswer)) {
    return { isCorrect: false, correctAnswer };
  }
  
  const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
  return { isCorrect, correctAnswer };
};

export const calculateScore = (
  questions: Question[],
  userAnswers: Record<string, string | string[]>
): { correct: number; total: number; score: number } => {
  let correct = 0;
  questions.forEach(q => {
    const userAnswer = userAnswers[q.id];
    if (userAnswer !== undefined) {
      const { isCorrect } = checkAnswer(q, userAnswer);
      if (isCorrect) correct++;
    }
  });
  const total = questions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, score };
};

export const determineMistakeType = (question: Question): string => {
  const knowledge = knowledgeList.find(k => k.id === question.knowledgeId);
  if (!knowledge) return 'other';
  
  const typeMap: Record<KnowledgeCategory, string> = {
    acceptCondition: 'incompleteCondition',
    applicationMaterial: 'nonStandardMaterial',
    legalBasis: 'incorrectBasis',
    promiseTime: 'unreasonableTime',
    materialReduction: 'nonStandardMaterial',
    commonMistakes: 'other',
  };
  
  return typeMap[knowledge.category] || 'other';
};

export const getMistakeType = (question: Question): string => {
  return determineMistakeType(question);
};

export const calculateLearningStats = (
  answerRecords: UserAnswer[],
  questionList: Question[],
  levelProgress: { levelId: number; isPassed: boolean }[],
  mistakeRecords: MistakeRecord[]
): LearningStats => {
  const totalQuestions = answerRecords.length;
  const correctCount = answerRecords.filter(r => r.isCorrect).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const totalTime = answerRecords.reduce((sum, r) => sum + r.timeSpent, 0);
  
  const answerDates = new Set(answerRecords.map(r => new Date(r.answerTime).toDateString()));
  const studyDays = answerDates.size;
  
  const categoryStats: Record<string, { correct: number; total: number }> = {};
  answerRecords.forEach(record => {
    const question = questionList.find(q => q.id === record.questionId);
    if (!question) return;
    
    const knowledge = knowledgeList.find(k => k.id === question.knowledgeId);
    if (!knowledge) return;
    
    const category = knowledge.category;
    if (!categoryStats[category]) {
      categoryStats[category] = { correct: 0, total: 0 };
    }
    categoryStats[category].total++;
    if (record.isCorrect) {
      categoryStats[category].correct++;
    }
  });
  
  const categoryAccuracy = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    categoryName: KnowledgeCategoryNames[category as KnowledgeCategory] || category,
    accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    total: stats.total,
    correct: stats.correct,
  }));
  
  const recentTrend: { date: string; accuracy: number; count: number }[] = [];
  const last7Days = new Array(7).fill(0).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
  
  last7Days.forEach(dateStr => {
    const dayRecords = answerRecords.filter(r => new Date(r.answerTime).toDateString() === dateStr);
    if (dayRecords.length > 0) {
      const dayCorrect = dayRecords.filter(r => r.isCorrect).length;
      const dayAccuracy = Math.round((dayCorrect / dayRecords.length) * 100);
      recentTrend.push({
        date: new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        accuracy: dayAccuracy,
        count: dayRecords.length,
      });
    } else {
      recentTrend.push({
        date: new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        accuracy: 0,
        count: 0,
      });
    }
  });
  
  return {
    totalQuestions,
    correctCount,
    accuracy,
    totalTime,
    studyDays,
    levelProgress,
    categoryAccuracy,
    recentTrend,
  };
};

export const getWeakCategories = (
  categoryAccuracy: LearningStats['categoryAccuracy'],
  threshold: number = 70
): string[] => {
  return categoryAccuracy
    .filter(c => c.accuracy < threshold && c.total >= 3)
    .map(c => c.category);
};
