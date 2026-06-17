import { BookOpen, Award, RotateCcw, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLearningStore } from '@/store/useLearningStore';

export const Header = () => {
  const navigate = useNavigate();
  const { user, resetAllData, getStats } = useLearningStore();
  const stats = getStats();

  const handleReset = () => {
    if (confirm('确定要重置所有学习数据吗？此操作不可恢复。')) {
      resetAllData();
      window.location.reload();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 font-display">
              政务服务清单编制演练平台
            </h1>
            <p className="text-xs text-slate-500">标准化 · 规范化 · 专业化</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {stats.totalQuestions > 0 && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-full">
              <Award className="w-4 h-4 text-success-600" />
              <span className="text-sm font-medium text-success-700">
                正确率 {stats.accuracy}%
              </span>
            </div>
          )}
          
          <button
            onClick={handleReset}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="重置学习数据"
          >
            <RotateCcw className="w-4 h-4" />
            <span>重置</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 rounded-full">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-primary-700">{user.name}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
