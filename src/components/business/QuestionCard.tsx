import { useState, useEffect, useMemo } from 'react';
import { Star, Bookmark, HelpCircle, CheckCircle2, XCircle, AlertCircle, Lightbulb } from 'lucide-react';
import type { Question } from '@/types';
import { getDifficultyLabel, getDifficultyColor } from '@/utils/format';
import { useLearningStore } from '@/store/useLearningStore';
import { usePracticeStore } from '@/store/usePracticeStore';
import { AnswerFeedback } from './AnswerFeedback';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  showFeedback?: boolean;
  onSubmit?: (result: { isCorrect: boolean; timeSpent: number; score: number; maxScore: number; feedback?: string; matchedKeywords?: string[]; missingKeywords?: string[] }) => void;
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
  const { 
    userAnswers, 
    setAnswer, 
    submitCurrent,
    isQuestionSubmitted,
    getSubmissionResult
  } = usePracticeStore();
  
  const isFavorite = favorites.some(
    f => f.targetType === 'question' && f.targetId === question.id
  );
  const userAnswer = userAnswers[question.id];
  const submittedFromStore = isQuestionSubmitted(question.id);
  const storeResult = getSubmissionResult(question.id);
  
  const [localAnswer, setLocalAnswer] = useState<string | string[]>(
    Array.isArray(question.correctAnswer) ? [] : ''
  );
  const [hasSubmitted, setHasSubmitted] = useState(submittedFromStore);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    correctAnswer: string | string[];
    timeSpent: number;
    score: number;
    maxScore: number;
    feedback?: string;
    matchedKeywords?: string[];
    missingKeywords?: string[];
  } | null>(null);

  useEffect(() => {
    if (userAnswer !== undefined) {
      if (Array.isArray(userAnswer)) {
        setLocalAnswer([...userAnswer]);
      } else {
        setLocalAnswer(userAnswer);
      }
    } else {
      setLocalAnswer(Array.isArray(question.correctAnswer) ? [] : '');
    }
  }, [question.id]);

  useEffect(() => {
    if (submittedFromStore && storeResult && !hasSubmitted) {
      setHasSubmitted(true);
      setFeedback({
        isCorrect: storeResult.isCorrect,
        correctAnswer: question.correctAnswer,
        timeSpent: 0,
        score: storeResult.score,
        maxScore: storeResult.maxScore,
        feedback: storeResult.feedback,
        matchedKeywords: storeResult.matchedKeywords,
        missingKeywords: storeResult.missingKeywords,
      });
    }
  }, [submittedFromStore, storeResult, hasSubmitted, question.correctAnswer]);

  const blankIndexes = useMemo(() => {
    if (question.type !== 'fillBlank') return [] as number[];
    const lines = question.content.split('\n');
    const indexes: number[] = [];
    let globalBlankIdx = 0;
    lines.forEach(line => {
      const parts = line.split('______');
      for (let i = 0; i < parts.length - 1; i++) {
        indexes.push(globalBlankIdx++);
      }
    });
    return indexes;
  }, [question.content, question.type]);

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

  const handleFillBlank = (globalBlankIdx: number, value: string) => {
    if (isReadonly || hasSubmitted) return;
    const total = Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 1;
    const current = Array.isArray(localAnswer) 
      ? [...localAnswer] 
      : new Array(total).fill('');
    while (current.length < total) {
      current.push('');
    }
    current[globalBlankIdx] = value;
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
      ? localAnswer.filter(v => v && v.trim() !== '') 
      : localAnswer;
    
    if (Array.isArray(answer) && question.type === 'fillBlank') {
      const total = Array.isArray(question.correctAnswer) ? question.correctAnswer.length : 0;
      const filled = Array.isArray(localAnswer) 
        ? localAnswer.filter(v => v && v.trim() !== '').length 
        : 0;
      if (filled < total) {
        alert(`请填写完整所有空格（已填${filled}/${total}）`);
        return;
      }
    } else if (Array.isArray(answer) && answer.length === 0) {
      alert('请填写答案');
      return;
    } else if (typeof answer === 'string' && answer.trim() === '') {
      alert('请填写答案');
      return;
    }

    const result = submitCurrent();
    if (result) {
      setFeedback({
        ...result,
        correctAnswer: result.correctAnswer,
      });
      setHasSubmitted(true);
      onSubmit?.(result);
    }
  };

  const renderQuestionContent = () => {
    const contentLines = question.content.split('\n');
    
    if (question.type === 'fillBlank') {
      let globalBlankIdx = 0;
      const totalBlanks = blankIndexes.length;
      const blanks = contentLines.map((line, lineIndex) => {
        const parts = line.split('______');
        const lineBlanks: JSX.Element[] = [];
        for (let partIndex = 0; partIndex < parts.length; partIndex++) {
          lineBlanks.push(
            <span key={`${lineIndex}-${partIndex}-t`} className="whitespace-pre-wrap">{parts[partIndex]}</span>
          );
          if (partIndex < parts.length - 1) {
            const currentBlankIdx = globalBlankIdx++;
            const ansArr = Array.isArray(localAnswer) ? localAnswer : [];
            const val = ansArr[currentBlankIdx] || '';
            lineBlanks.push(
              <input
                key={`${lineIndex}-${partIndex}-i`}
                type="text"
                value={val}
                onChange={(e) => handleFillBlank(currentBlankIdx, e.target.value)}
                disabled={isReadonly || hasSubmitted}
                className={cn(
                  'w-32 px-3 py-1.5 border-b-2 border-primary-300 bg-transparent text-center focus:outline-none focus:border-primary-600 font-medium transition-colors',
                  hasSubmitted && feedback && !feedback.isCorrect && 'border-danger-500 bg-danger-50',
                  hasSubmitted && feedback && feedback.isCorrect && 'border-success-500 bg-success-50'
                )}
                placeholder={`第${currentBlankIdx + 1}/${totalBlanks}空`}
              />
            );
          }
        }
        return (
          <div key={lineIndex} className="flex flex-wrap items-center gap-x-1 gap-y-2">
            {lineBlanks}
          </div>
        );
      });
      return <div className="space-y-3">{blanks}</div>;
    }

    return (
      <p className="whitespace-pre-wrap leading-7">{question.content}</p>
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
              {hasSubmitted && isSelected && !isCorrectOption && (
                <span className="tag-danger">错选</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderKeywordFeedback = () => {
    if (!feedback || question.type !== 'materialWrite') return null;
    if (!feedback.matchedKeywords && !feedback.missingKeywords) return null;
    
    const ratio = feedback.maxScore > 0 ? feedback.score / feedback.maxScore : 0;
    
    return (
      <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-slate-50 to-white border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-accent-500" />
          <h4 className="font-semibold text-sm text-slate-800">关键词匹配分析</h4>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full font-medium ml-auto',
            ratio >= 0.8 && 'bg-success-100 text-success-700',
            ratio >= 0.5 && ratio < 0.8 && 'bg-accent-100 text-accent-700',
            ratio < 0.5 && 'bg-danger-100 text-danger-700'
          )}>
            覆盖率 {feedback.score}/{feedback.maxScore}
          </span>
        </div>
        
        {feedback.matchedKeywords && feedback.matchedKeywords.length > 0 && (
          <div className="mb-2">
            <p className="text-xs text-success-700 mb-1 font-medium">
              <CheckCircle2 className="w-3 h-3 inline mr-1" />
              已命中要素：
            </p>
            <div className="flex flex-wrap gap-1.5">
              {feedback.matchedKeywords.slice(0, 8).map((kw, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-success-100 text-success-700 border border-success-200">
                  {kw}
                </span>
              ))}
              {feedback.matchedKeywords.length > 8 && (
                <span className="text-xs px-2 py-1 rounded bg-success-50 text-success-600">
                  +{feedback.matchedKeywords.length - 8}
                </span>
              )}
            </div>
          </div>
        )}
        
        {feedback.missingKeywords && feedback.missingKeywords.length > 0 && (
          <div>
            <p className="text-xs text-danger-700 mb-1 font-medium">
              <XCircle className="w-3 h-3 inline mr-1" />
              待补充要素：
            </p>
            <div className="flex flex-wrap gap-1.5">
              {feedback.missingKeywords.slice(0, 8).map((kw, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-danger-50 text-danger-700 border border-dashed border-danger-300">
                  {kw}
                </span>
              ))}
              {feedback.missingKeywords.length > 8 && (
                <span className="text-xs px-2 py-1 rounded bg-danger-50 text-danger-600">
                  +{feedback.missingKeywords.length - 8}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTextarea = () => {
    if (question.type !== 'materialWrite') return null;
    
    const subTypeLabel = question.subType === 'materialReduction' 
      ? '材料减免情形编写'
      : question.subType === 'materialList'
        ? '申请材料清单编写'
        : question.subType === 'informCommitment'
          ? '告知承诺条款编写'
          : '材料编写';

    return (
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <span className="tag-accent">{subTypeLabel}</span>
          {question.typeName && question.typeName !== subTypeLabel && (
            <span className="tag-primary text-xs">{question.typeName}</span>
          )}
        </div>
        <textarea
          value={typeof localAnswer === 'string' ? localAnswer : ''}
          onChange={(e) => handleTextarea(e.target.value)}
          disabled={isReadonly || hasSubmitted}
          placeholder="请根据题干要求，在此编写规范的要素内容...&#10;&#10;建议结构：&#10;• 适用对象/情形&#10;• 核心要素清单&#10;• 特殊说明/例外情形"
          className={cn(
            'textarea min-h-[180px] leading-relaxed',
            hasSubmitted && feedback && !feedback.isCorrect && 'border-danger-300 focus:ring-danger-500',
            hasSubmitted && feedback && feedback.isCorrect && 'border-success-300 focus:ring-success-500'
          )}
        />
        <p className="text-xs text-slate-500 mt-2 flex items-start gap-1">
          <HelpCircle className="w-3 h-3 inline mt-0.5 shrink-0" />
          <span>
            {question.subType === 'materialReduction' 
              ? '提示：材料减免情形需要明确【适用对象】、【减免的具体材料】、【替代核验方式】三大要素。'
              : question.subType === 'informCommitment'
                ? '提示：告知承诺需要明确【承诺内容】、【不实承诺责任】、【核查方式】三大要素。'
                : '提示：请包含事项名称、材料名称、份数、形式要求、适用情形等关键要素。'
            }
          </span>
        </p>
      </div>
    );
  };

  const renderFeedbackText = () => {
    if (!feedback || !feedback.feedback) return null;
    const ratio = feedback.maxScore > 0 ? feedback.score / feedback.maxScore : (feedback.isCorrect ? 1 : 0);
    
    return (
      <div className={cn(
        'mt-4 p-3 rounded-lg border flex items-start gap-2',
        ratio >= 0.8 && 'bg-success-50 border-success-200',
        ratio >= 0.5 && ratio < 0.8 && 'bg-accent-50 border-accent-200',
        ratio < 0.5 && 'bg-danger-50 border-danger-200'
      )}>
        {ratio >= 0.8 ? (
          <CheckCircle2 className="w-5 h-5 text-success-600 shrink-0 mt-0.5" />
        ) : ratio >= 0.5 ? (
          <AlertCircle className="w-5 h-5 text-accent-600 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-danger-600 shrink-0 mt-0.5" />
        )}
        <p className={cn(
          'text-sm font-medium',
          ratio >= 0.8 && 'text-success-800',
          ratio >= 0.5 && ratio < 0.8 && 'text-accent-800',
          ratio < 0.5 && 'text-danger-800'
        )}>
          {feedback.feedback}
        </p>
      </div>
    );
  };

  return (
    <div className="card p-6 animate-fade-in-up">
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
          {hasSubmitted && (
            <span className={cn(
              'tag',
              feedback?.isCorrect ? 'tag-success' : 'tag-danger'
            )}>
              {feedback?.isCorrect ? '已判定正确' : '已判定错误'}
            </span>
          )}
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

      {showFeedback && hasSubmitted && feedback?.score !== undefined && feedback.maxScore > 1 && (
        <div className="mt-4 flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
          <span className="text-xs text-slate-500">得分：</span>
          <span className={cn(
            'font-bold',
            feedback.score >= feedback.maxScore * 0.8 ? 'text-success-600' : 
            feedback.score >= feedback.maxScore * 0.5 ? 'text-accent-600' : 'text-danger-600'
          )}>
            {feedback.score}/{feedback.maxScore}
          </span>
          <div className="flex-1 mx-2 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={cn(
                'h-full rounded-full transition-all duration-500',
                feedback.score >= feedback.maxScore * 0.8 ? 'bg-success-500' : 
                feedback.score >= feedback.maxScore * 0.5 ? 'bg-accent-500' : 'bg-danger-500'
              )}
              style={{ width: `${feedback.maxScore > 0 ? (feedback.score / feedback.maxScore) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {showFeedback && hasSubmitted && (
        <>
          {renderFeedbackText()}
          {renderKeywordFeedback()}
          <AnswerFeedback
            question={question}
            isCorrect={!!feedback?.isCorrect}
            correctAnswer={feedback?.correctAnswer || question.correctAnswer}
            userAnswer={Array.isArray(localAnswer) ? localAnswer : localAnswer}
          />
        </>
      )}

      {!isReadonly && !hasSubmitted && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            提交判定
          </button>
        </div>
      )}

      {isReadonly && userAnswer && (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
          <p className="text-sm font-medium text-slate-700 mb-1">你的答案：</p>
          <p className="text-sm text-slate-600 whitespace-pre-wrap">
            {Array.isArray(userAnswer) ? userAnswer.join('、') : userAnswer}
          </p>
        </div>
      )}
    </div>
  );
};
