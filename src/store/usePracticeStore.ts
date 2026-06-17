import { create } from 'zustand';
import type { Question } from '@/types';
import { checkAnswer, calculateScore } from '@/utils/calculation';

interface PracticeState {
  currentQuestionIndex: number;
  questions: Question[];
  userAnswers: Record<string, string | string[]>;
  isSubmitted: boolean;
  startTime: number | null;
  questionStartTime: number;
  questionTimes: Record<string, number>;
  
  startPractice: (questions: Question[]) => void;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  goToQuestion: (index: number) => void;
  submitCurrent: () => { isCorrect: boolean; correctAnswer: string | string[]; timeSpent: number } | null;
  submitAll: () => { correct: number; total: number; score: number };
  reset: () => void;
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  currentQuestionIndex: 0,
  questions: [],
  userAnswers: {},
  isSubmitted: false,
  startTime: null,
  questionStartTime: Date.now(),
  questionTimes: {},
  
  startPractice: (questions) => {
    set({
      questions,
      currentQuestionIndex: 0,
      userAnswers: {},
      isSubmitted: false,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      questionTimes: {},
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
    });
    
    return {
      ...result,
      timeSpent: totalTime,
    };
  },
  
  submitAll: () => {
    const state = get();
    const result = calculateScore(state.questions, state.userAnswers);
    set({ isSubmitted: true });
    return result;
  },
  
  reset: () => {
    set({
      currentQuestionIndex: 0,
      questions: [],
      userAnswers: {},
      isSubmitted: false,
      startTime: null,
      questionStartTime: Date.now(),
      questionTimes: {},
    });
  },
}));
