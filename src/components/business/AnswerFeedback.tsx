import { CheckCircle2, XCircle, BookOpen, Lightbulb, Scale } from 'lucide-react';
import type { Question } from '@/types';

interface AnswerFeedbackProps {
  question: Question;
  isCorrect: boolean;
  correctAnswer: string | string[];
  userAnswer: string | string[];
  showRuleBasis?: boolean;
}

export const AnswerFeedback = ({ 
  question, 
  isCorrect, 
  correctAnswer, 
  userAnswer,
  showRuleBasis = true 
}: AnswerFeedbackProps) => {
  const formatAnswer = (answer: string | string[]): string => {
    if (Array.isArray(answer)) {
      return answer.map((a, i) => `${i + 1}. ${a}`).join('\n');
    }
    return answer;
  };

  return (
    <div className={`mt-4 p-4 rounded-lg border-2 ${
      isCorrect 
        ? 'bg-success-50 border-success-200 animate-pulse-green' 
        : 'bg-danger-50 border-danger-200 animate-shake'
    }`}>
      <div className="flex items-start gap-3">
        {isCorrect ? (
          <CheckCircle2 className="w-6 h-6 text-success-500 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-6 h-6 text-danger-500 shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 ${isCorrect ? 'text-success-700' : 'text-danger-700'}`}>
            {isCorrect ? '回答正确！' : '回答错误'}
          </h4>
          
          {!isCorrect && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">你的答案：</p>
                <p className="text-sm text-danger-600 whitespace-pre-wrap bg-white/50 p-2 rounded">
                  {formatAnswer(userAnswer)}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">正确答案：</p>
                <p className="text-sm text-success-600 whitespace-pre-wrap bg-white/50 p-2 rounded">
                  {formatAnswer(correctAnswer)}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-accent-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">解析</p>
                <p className="text-sm text-slate-600">{question.explanation}</p>
              </div>
            </div>

            {showRuleBasis && (
              <div className="flex items-start gap-2">
                <Scale className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-700">规则依据</p>
                  <p className="text-sm text-primary-600">{question.ruleBasis}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
