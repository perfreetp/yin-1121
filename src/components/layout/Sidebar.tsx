import { NavLink } from 'react-router-dom';
import { 
  BookOpen, 
  FileEdit, 
  Trophy, 
  XCircle, 
  BarChart3, 
  Star,
  Home 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '首页', icon: Home, end: true },
  { path: '/rules', label: '规则课堂', icon: BookOpen },
  { path: '/practice', label: '案例演练', icon: FileEdit },
  { path: '/levels', label: '闯关审校', icon: Trophy },
  { path: '/mistakes', label: '错题本', icon: XCircle },
  { path: '/profile', label: '成绩面板', icon: BarChart3 },
];

export const Sidebar = () => {
  return (
    <aside className="w-56 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] hidden lg:block">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className={cn(
              'w-5 h-5 transition-colors',
              'text-current'
            )} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-4 left-4 right-4 p-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl">
        <p className="text-xs text-slate-600 mb-2">💡 学习小贴士</p>
        <p className="text-sm text-slate-700">
          每天练习30分钟，轻松掌握清单编制规范！
        </p>
      </div>
    </aside>
  );
};
