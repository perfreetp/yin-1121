interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'accent' | 'danger';
}

export const ProgressBar = ({ 
  value, 
  max, 
  className = '', 
  showLabel = true,
  color = 'primary' 
}: ProgressBarProps) => {
  const percent = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  
  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-success-500',
    accent: 'bg-accent-500',
    danger: 'bg-danger-500',
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-600">进度</span>
          <span className="font-medium text-slate-900">{value}/{max}</span>
        </div>
      )}
      <div className="progress-bar">
        <div 
          className={`progress-fill ${colorClasses[color]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};
