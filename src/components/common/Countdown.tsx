import { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { formatTime } from '@/utils/format';

interface CountdownProps {
  seconds: number;
  onComplete: () => void;
  isRunning?: boolean;
  showWarning?: boolean;
}

export const Countdown = ({ 
  seconds, 
  onComplete, 
  isRunning = true,
  showWarning = true 
}: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft, onComplete]);

  const isWarning = showWarning && timeLeft <= 30 && timeLeft > 0;

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-lg ${
      isWarning 
        ? 'bg-danger-100 text-danger-700 animate-pulse' 
        : 'bg-slate-100 text-slate-700'
    }`}>
      <Clock className={`w-5 h-5 ${isWarning ? 'animate-pulse' : ''}`} />
      <span>{formatTime(timeLeft)}</span>
    </div>
  );
};
