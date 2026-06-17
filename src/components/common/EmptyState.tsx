import { ReactNode, ComponentType } from 'react';
import { FileX } from 'lucide-react';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: ComponentType<any> | ReactNode;
  title: string;
  description?: string;
  action?: ReactNode | EmptyStateAction;
}

export const EmptyState = ({ 
  icon: Icon = FileX,
  title, 
  description, 
  action 
}: EmptyStateProps) => {
  const renderIcon = () => {
    if (typeof Icon === 'function') {
      return <Icon className="w-12 h-12 text-slate-300" />;
    }
    return Icon;
  };

  const renderAction = () => {
    if (!action) return null;
    if (typeof action === 'object' && 'label' in action && 'onClick' in action) {
      return (
        <button onClick={action.onClick} className="btn-primary">
          {action.label}
        </button>
      );
    }
    return <div>{action}</div>;
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 mb-6 max-w-md">{description}</p>
      )}
      {action && renderAction()}
    </div>
  );
};
