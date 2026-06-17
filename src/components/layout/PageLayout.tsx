import { ReactNode } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useLocation } from 'react-router-dom';

interface PageLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export const PageLayout = ({ children, showSidebar = true }: PageLayoutProps) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main 
          className={cn(
            'flex-1 min-h-[calc(100vh-64px)]',
            showSidebar ? 'lg:ml-0' : ''
          )}
        >
          <div 
            key={location.pathname}
            className="animate-fade-in-up"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
