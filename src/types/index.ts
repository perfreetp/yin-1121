export type KnowledgeCategory = 'acceptCondition' | 'applicationMaterial' | 'legalBasis' | 'promiseTime' | 'materialReduction' | 'commonMistakes';

export const KnowledgeCategoryNames: Record<KnowledgeCategory, string> = {
  acceptCondition: '受理条件',
  applicationMaterial: '申请材料',
  legalBasis: '法定依据',
  promiseTime: '承诺时限',
  materialReduction: '材料减免',
  commonMistakes: '常见错误',
};

export interface Knowledge {
  id: string;
  title: string;
  category: KnowledgeCategory;
  categoryName: string;
  content: string;
  goodExample: string;
  badExample: string;
  keyPoints: string[];
  relatedLaws: { name: string; article: string }[];
  sortOrder: number;
}

export type QuestionType = 'fillBlank' | 'trueFalse' | 'legalMatch' | 'materialWrite' | 'timeJudge' | 'comprehensive';
export type ItemType = 'administrativeLicense' | 'administrativePayment' | 'administrativeConfirmation' | 'administrativeReward' | 'publicService';

export const QuestionTypeNames: Record<QuestionType, string> = {
  fillBlank: '填空题',
  trueFalse: '判断题',
  legalMatch: '法规匹配',
  materialWrite: '材料编写',
  timeJudge: '时限判断',
  comprehensive: '综合题',
};

export const ItemTypeNames: Record<ItemType, string> = {
  administrativeLicense: '行政许可',
  administrativePayment: '行政给付',
  administrativeConfirmation: '行政确认',
  administrativeReward: '行政奖励',
  publicService: '公共服务',
};

export interface Question {
  id: string;
  type: QuestionType;
  typeName: string;
  itemType: ItemType;
  itemTypeName: string;
  knowledgeId: string;
  content: string;
  options?: { label: string; value: string }[];
  correctAnswer: string | string[];
  userAnswer?: string | string[];
  explanation: string;
  ruleBasis: string;
  difficulty: 1 | 2 | 3;
  isFavorite?: boolean;
  subType?: 'materialReduction' | 'materialList' | 'informCommitment' | string;
}

export interface UserAnswer {
  id: string;
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  answerTime: string;
  timeSpent: number;
  mistakeType?: string;
}

export type MistakeType = 'missingElement' | 'incorrectBasis' | 'unreasonableTime' | 'nonStandardMaterial' | 'incompleteCondition' | 'other';

export const MistakeTypeNames: Record<MistakeType, string> = {
  missingElement: '要素缺失',
  incorrectBasis: '依据错误',
  unreasonableTime: '时限不合理',
  nonStandardMaterial: '材料不规范',
  incompleteCondition: '条件不完整',
  other: '其他错误',
};

export interface MistakeRecord {
  id: string;
  question: Question;
  userAnswer: string | string[];
  mistakeType: MistakeType;
  mistakeTypeName: string;
  isMastered: boolean;
  answerTime: string;
  reviewCount: number;
}

export interface Level {
  id: number;
  name: string;
  description: string;
  timeLimit: number;
  passScore: number;
  totalQuestions: number;
  questionPool: string[];
  isUnlocked: boolean;
  isPassed: boolean;
  bestScore?: number;
  bestTime?: number;
}

export interface LearningStats {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  totalTime: number;
  studyDays: number;
  levelProgress: { levelId: number; isPassed: boolean }[];
  categoryAccuracy: { category: string; categoryName: string; accuracy: number; total: number; correct: number }[];
  recentTrend: { date: string; accuracy: number; count: number }[];
}

export interface Favorite {
  id: string;
  targetType: 'knowledge' | 'question' | 'example';
  targetId: string;
  targetTitle: string;
  targetContent: string;
  createdAt: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  joinDate: string;
}

export interface LevelProgress {
  levelId: number;
  isPassed: boolean;
  bestScore?: number;
  bestTime?: number;
  attemptDate?: string;
}

export interface PracticeState {
  currentQuestionIndex: number;
  questions: Question[];
  userAnswers: Record<string, string | string[]>;
  isSubmitted: boolean;
  startTime: number | null;
  questionStartTime: number;
}

export interface ReviewPlanTask {
  day: number;
  category: KnowledgeCategory;
  categoryName: string;
  knowledgeId: string;
  knowledgeTitle: string;
  wrongQuestionIds: string[];
  isCompleted: boolean;
}

export interface ReviewPlan {
  id: string;
  createdAt: string;
  tasks: ReviewPlanTask[];
  totalDays: number;
  completedDays: number;
}

export interface ClassStudent {
  id: string;
  name: string;
  avatar: string;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  levelsPassed: number;
  totalLevels: number;
  weakCategories: { categoryName: string; accuracy: number }[];
}

export interface CategoryFilter {
  category: KnowledgeCategory | 'all';
  itemType: ItemType | 'all';
  search: string;
}
