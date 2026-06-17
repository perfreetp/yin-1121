import { create } from 'zustand';
import type { Question } from '@/types';
import { checkAnswer, calculateScore } from '@/utils/calculation';

interface PracticeSessionResult {
  correct: number;
  total: number;
  score: number;
  timeSpent: number;
  detailResults: Array<{ questionId: string; isCorrect: boolean; score: number; maxScore: number }>;
}

interface PracticeState {
  sessionId: string;
  currentQuestionIndex: number;
  questions: Question[];
  userAnswers: Record<string, string | string[]>;
  submittedQuestions: Record<string, boolean>;
  submissionResults: Record<string, { isCorrect: boolean; score: number; maxScore: number; feedback?: string; matchedKeywords?: string[]; missingKeywords?: string[] }>;
  isSubmitted: boolean;
  startTime: number | null;
  endTime: number | null;
  questionStartTime: number;
  questionTimes: Record<string, number>;
  finalResult: PracticeSessionResult | null;
  
  startPractice: (questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  isQuestionSubmitted: (questionId: string) => boolean;
  getSubmissionResult: (questionId: string) => PracticeState['submissionResults'][string] | undefined;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitCurrent: () => { isCorrect: boolean; correctAnswer: string | string[]; timeSpent: number; score: number; maxScore: number; feedback?: string; matchedKeywords?: string[]; missingKeywords?: string[] } | null;
  submitAll: () => PracticeSessionResult;
  setFinalResult: (result: PracticeSessionResult) => void;
  getSessionResult: () => PracticeSessionResult | null;
  reset: () => void;
}

const generateSessionId = (): string => {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const usePracticeStore = create<PracticeState>((set, get) => ({
  sessionId: '',
  currentQuestionIndex: 0,
  questions: [],
  userAnswers: {},
  submittedQuestions: {},
  submissionResults: {},
  isSubmitted: false,
  startTime: null,
  endTime: null,
  questionStartTime: Date.now(),
  questionTimes: {},
  finalResult: null,
  
  startPractice: (questions) => {
    set({
      sessionId: generateSessionId(),
      questions,
      currentQuestionIndex: 0,
      userAnswers: {},
      submittedQuestions: {},
      submissionResults: {},
      isSubmitted: false,
      startTime: Date.now(),
      endTime: null,
      questionStartTime: Date.now(),
      questionTimes: {},
      finalResult: null,
    });
  },
  
  setAnswer: (questionId, answer) => {
    set(state => ({
      userAnswers: {
        ...state.userAnswers,
        [questionId]: answer,
      },
    }));
  },
  
  isQuestionSubmitted: (questionId) => {
    return !!get().submittedQuestions[questionId];
  },
  
  getSubmissionResult: (questionId) => {
    return get().submissionResults[questionId];
  },
  
  nextQuestion: () => {
    set(state => {
      if (state.currentQuestionIndex >= state.questions.length - 1) return state;
      const now = Date.now();
      const currentQ = state.questions[state.currentQuestionIndex];
      const timeSpent = Math.floor((now - state.questionStartTime) / 1000);
      
      return {
        currentQuestionIndex: state.currentQuestionIndex + 1,
        questionStartTime: now,
        questionTimes: {
          ...state.questionTimes,
          [currentQ.id]: (state.questionTimes[currentQ.id] || 0) + timeSpent,
        },
      };
    });
  },
  
  prevQuestion: () => {
    set(state => {
      if (state.currentQuestionIndex <= 0) return state;
      const now = Date.now();
      const currentQ = state.questions[state.currentQuestionIndex];
      const timeSpent = Math.floor((now - state.questionStartTime) / 1000);
      
      return {
        currentQuestionIndex: state.currentQuestionIndex - 1,
        questionStartTime: now,
        questionTimes: {
          ...state.questionTimes,
          [currentQ.id]: (state.questionTimes[currentQ.id] || 0) + timeSpent,
        },
      };
    });
  },
  
  goToQuestion: (index) => {
    set(state => {
      if (index < 0 || index >= state.questions.length) return state;
      const now = Date.now();
      const currentQ = state.questions[state.currentQuestionIndex];
      const timeSpent = Math.floor((now - state.questionStartTime) / 1000);
      
      return {
        currentQuestionIndex: index,
        questionStartTime: now,
        questionTimes: {
          ...state.questionTimes,
          [currentQ.id]: (state.questionTimes[currentQ.id] || 0) + timeSpent,
        },
      };
    });
  },
  
  submitCurrent: () => {
    const state = get();
    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion) return null;
    
    if (state.submittedQuestions[currentQuestion.id]) {
      const existing = state.submissionResults[currentQuestion.id];
      const userAnswer = state.userAnswers[currentQuestion.id];
      const result = checkAnswer(currentQuestion, userAnswer || '');
      return {
        isCorrect: existing.isCorrect,
        correctAnswer: result.correctAnswer,
        timeSpent: state.questionTimes[currentQuestion.id] || 0,
        score: existing.score,
        maxScore: existing.maxScore,
        feedback: existing.feedback,
        matchedKeywords: existing.matchedKeywords,
        missingKeywords: existing.missingKeywords,
      };
    }
    
    const userAnswer = state.userAnswers[currentQuestion.id];
    if (userAnswer === undefined) return null;
    
    const now = Date.now();
    const timeSpent = Math.floor((now - state.questionStartTime) / 1000);
    const totalTime = (state.questionTimes[currentQuestion.id] || 0) + timeSpent;
    
    const result = checkAnswer(currentQuestion, userAnswer);
    
    set({
      questionTimes: {
        ...state.questionTimes,
        [currentQuestion.id]: totalTime,
      },
      submittedQuestions: {
        ...state.submittedQuestions,
        [currentQuestion.id]: true,
      },
      submissionResults: {
        ...state.submissionResults,
        [currentQuestion.id]: {
          isCorrect: result.isCorrect,
          score: result.score,
          maxScore: result.maxScore,
          feedback: result.feedback,
          matchedKeywords: result.matchedKeywords,
          missingKeywords: result.missingKeywords,
        },
      },
    });
    
    return {
      ...result,
      timeSpent: totalTime,
    };
  },
  
  submitAll: () => {
    const state = get();
    const result = calculateScore(state.questions, state.userAnswers);
    const totalTime = state.startTime 
      ? Math.floor((Date.now() - state.startTime) / 1000) 
      : 0;
    
    const sessionResult: PracticeSessionResult = {
      ...result,
      timeSpent: totalTime,
    };
    
    set({ 
      isSubmitted: true, 
      endTime: Date.now(),
      finalResult: sessionResult,
    });
    return sessionResult;
  },
  
  setFinalResult: (result) => {
    set({ finalResult: result });
  },
  
  getSessionResult: () => {
    return get().finalResult;
  },
  
  reset: () => {
    set({
      sessionId: '',
      currentQuestionIndex: 0,
      questions: [],
      userAnswers: {},
      submittedQuestions: {},
      submissionResults: {},
      isSubmitted: false,
      startTime: null,
      endTime: null,
      questionStartTime: Date.now(),
      questionTimes: {},
      finalResult: null,
    });
  },
}));
