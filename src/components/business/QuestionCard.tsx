import { useState, useEffect } from 'react';
import { Star, Bookmark, HelpCircle } from 'lucide-react';
import type { Question } from '@/types';
import { getDifficultyLabel, getDifficultyColor } from '@/utils/format';
import { useLearningStore } from '@/store/useLearningStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import { AnswerFeedback } from './AnswerFeedback';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  showFeedback?: boolean;
  onSubmit?: (result: { isCorrect: boolean; timeSpent: number }) => void;
  isReadonly?: boolean;
  questionNumber?: number;
}

export const QuestionCard = ({ 
  question, 
  showFeedback = true, 
  onSubmit,
  isReadonly = false,
  questionNumber
}: QuestionCardProps) => {
  const { favorites, toggleFavorite } = useLearningStore();
  const { userAnswers, setAnswer, submitCurrent } = usePracticeStore();
  const [localAnswer, setLocalAnswer] = useState<string | string[]>(
    Array.isArray(question.correctAnswer) ? [] : ''
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string | string[];
    timeSpent: number;
  } | null>(null);

  const isFavorite = favorites.some(
    f => f.targetType === 'question' && f.targetId === question.id
  );
  const userAnswer = userAnswers[question.id];

  useEffect(() => {
    if (userAnswer !== undefined) {
      setLocalAnswer(userAnswer);
    } else {
      setLocalAnswer(Array.isArray(question.correctAnswer) ? [] : '');
    }
    setHasSubmitted(false);
    setFeedback(null);
  }, [question.id, userAnswer]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite({
      targetType: 'question',
      targetId: question.id,
      targetTitle: question.content.slice(0, 50) + '...',
      targetContent: question.content,
    });
  };

  const handleSingleChoice = (value: string) => {
    if (isReadonly || hasSubmitted) return;
    setLocalAnswer(value);
    setAnswer(question.id, value);
  };

  const handleMultiChoice = (value: string) => {
    if (isReadonly || hasSubmitted) return;
    const current = Array.isArray(localAnswer) ? localAnswer : [];
    const newAnswer = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setLocalAnswer(newAnswer);
    setAnswer(question.id, newAnswer);
  };

  const handleFillBlank = (index: number, value: string) => {
    if (isReadonly || hasSubmitted) return;
    const current = Array.isArray(localAnswer) ? [...localAnswer] : [];
    current[index] = value;
    setLocalAnswer(current);
    setAnswer(question.id, current);
  };

  const handleTextarea = (value: string) => {
    if (isReadonly || hasSubmitted) return;
    setLocalAnswer(value);
    setAnswer(question.id, value);
  };

  const handleSubmit = () => {
    if (isReadonly || hasSubmitted) return;
    
    const answer = Array.isArray(localAnswer) 
      ? localAnswer.filter(v => v.trim() !== '') 
      : localAnswer;
    
    if (Array.isArray(answer) && answer.length === 0) {
      alert('请填写答案');
      return;
    }
    if (typeof answer === 'string' && answer.trim() === '') {
      alert('请填写答案');
      return;
    }

    const result = submitCurrent();
    if (result) {
      setFeedback(result);
      setHasSubmitted(true);
      onSubmit?.(result);
    }
  };

  const renderQuestionContent = () => {
    const contentLines = question.content.split('\n');
    
    if (question.type === 'fillBlank') {
      const blanks = contentLines.map((line, lineIndex) => {
        const parts = line.split('______');
        return (
          <div key={lineIndex} className="flex flex-wrap items-center gap-2">
            {parts.map((part, partIndex) => (
              <span key={partIndex} className="flex items-center gap-2">
                <span className="whitespace-pre-wrap">{part}</span>
                {partIndex < parts.length - 1 && (
                  <input
                    type="text"
                    value={Array.isArray(localAnswer) ? localAnswer[Math.floor((lineIndex * 10 + partIndex) / 10)] || '' : ''}
                    onChange={(e) => handleFillBlank(partIndex, e.target.value)}
                    disabled={isReadonly || hasSubmitted}
                    className={cn(
                      'w-32 px-3 py-1.5 border-b-2 border-primary-300 bg-transparent text-center focus:outline-none focus:border-primary-600 font-medium',
                      hasSubmitted && feedback && !feedback.isCorrect && 'border-danger-500 bg-danger-50',
                      hasSubmitted && feedback && feedback.isCorrect && 'border-success-500 bg-success-50'
                    )}
                    placeholder="______"
                  />
                )}
              </span>
            ))}
          </div>
        );
      });
      return <div className="space-y-2">{blanks}</div>;
    }

    return (
      <p className="whitespace-pre-wrap">{question.content}</p>
    );
  };

  const renderOptions = () => {
    if (!question.options) return null;

    const isMulti = Array.isArray(question.correctAnswer) && question.type !== 'fillBlank';

    return (
      <div className="space-y-3 mt-4">
        {question.options.map((option) => {
          const isSelected = Array.isArray(localAnswer)
            ? localAnswer.includes(option.value)
            : localAnswer === option.value;
          
          const isCorrectOption = Array.isArray(question.correctAnswer)
            ? question.correctAnswer.includes(option.value)
            : question.correctAnswer === option.value;

          return (
            <button
              key={option.value}
              onClick={() => isMulti ? handleMultiChoice(option.value) : handleSingleChoice(option.value)}
              disabled={isReadonly || hasSubmitted}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all duration-200 flex items-center gap-3',
                isSelected && !hasSubmitted && 'border-primary-500 bg-primary-50',
                !isSelected && !hasSubmitted && 'border-slate-200 hover:border-primary-300 hover:bg-slate-50',
                hasSubmitted && isCorrectOption && 'border-success-500 bg-success-50',
                hasSubmitted && isSelected && !isCorrectOption && 'border-danger-500 bg-danger-50',
                hasSubmitted && !isSelected && !isCorrectOption && 'border-slate-200 opacity-50',
                (isReadonly) && 'cursor-not-allowed'
              )}
            >
              <div className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
                isMulti ? 'rounded' : 'rounded-full',
                isSelected && !hasSubmitted && 'border-primary-500 bg-primary-500',
                hasSubmitted && isCorrectOption && 'border-success-500 bg-success-500',
                hasSubmitted && isSelected && !isCorrectOption && 'border-danger-500 bg-danger-500',
              )}>
                {(isSelected || (hasSubmitted && isCorrectOption)) && (
                  <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                )}
              </div>
              <span className="flex-1">{option.label}</span>
              {hasSubmitted && isCorrectOption && (
                <span className="tag-success">正确答案</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderTextarea = () => {
    if (question.type !== 'materialWrite') return null;

    return (
      <div className="mt-4">
        <textarea
          value={typeof localAnswer === 'string' ? localAnswer : ''}
          onChange={(e) => handleTextarea(e.target.value)}
          disabled={isReadonly || hasSubmitted}
          placeholder="请在此输入你的答案..."
          className={cn(
            'textarea min-h-[150px]',
            hasSubmitted && feedback && !feedback.isCorrect && 'border-danger-300 focus:ring-danger-500',
            hasSubmitted && feedback && feedback.isCorrect && 'border-success-300 focus:ring-success-500'
          )}
        />
        <p className="text-xs text-slate-500 mt-2">
          <HelpCircle className="w-3 h-3 inline mr-1" />
          提示：材料减免情形需要明确适用对象、减免材料和核验方式
        </p>
      </div>
    );
  };

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {questionNumber !== undefined && (
            <span className="tag-primary">第 {questionNumber} 题</span>
          )}
          <span className="tag-accent">{question.typeName}</span>
          <span className="tag-primary">{question.itemTypeName}</span>
          <span className={`tag ${getDifficultyColor(question.difficulty)}`}>
            {getDifficultyLabel(question.difficulty)}
          </span>
        </div>
        
        <button
          onClick={handleFavoriteClick}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          title={isFavorite ? '取消收藏' : '收藏本题'}
        >
          <Star className={cn(
            'w-5 h-5 transition-colors',
            isFavorite ? 'text-accent-500 fill-accent-500' : 'text-slate-300 hover:text-accent-500'
          )} />
        </button>
      </div>

      <div className="text-slate-800 leading-relaxed">
        {renderQuestionContent()}
      </div>

      {question.options && renderOptions()}
      {question.type === 'materialWrite' && renderTextarea()}

      {!isReadonly && !hasSubmitted && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className="btn-primary"
          >
            提交答案
          </button>
        </div>
      )}

      {showFeedback && hasSubmitted && feedback && (
        <AnswerFeedback
          question={question}
          isCorrect={feedback.isCorrect}
          correctAnswer={feedback.correctAnswer}
          userAnswer={Array.isArray(localAnswer) ? localAnswer : localAnswer}
        />
      )}

      {isReadonly && userAnswer && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-1">你的答案：</p>
          <p className="text-sm text-slate-600">
            {Array.isArray(userAnswer) ? userAnswer.join('、') : userAnswer}
          </p>
        </div>
      )}
    </div>
  );
};
