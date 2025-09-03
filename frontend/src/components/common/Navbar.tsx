import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';


interface NavbarProps {
  children?: React.ReactNode;
  brand?: React.ReactNode;
  centerContent?: React.ReactNode;
  fullWidth?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ children, brand, centerContent, fullWidth = false }) => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="border-b border-vercel-light-border/50 dark:border-vercel-dark-border/50 bg-white/70 dark:bg-vercel-dark-surface/70 sticky top-0 z-10 backdrop-blur-xl backdrop-saturate-150 shadow-sm transition-colors duration-300">
      <div className={`${fullWidth ? 'w-full px-6' : 'max-w-7xl mx-auto px-6'} py-3 flex items-center justify-between gap-4`}>
        <div className="flex-shrink-0 flex items-center">
            {brand ? brand : (
                <Link to="/" className="flex items-center">
                <h1 className="text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity leading-relaxed">
                    <span className="text-vercel-light-text dark:text-vercel-dark-text">Data</span>
                    <span className="text-vercel-accent-blue"> Bridge</span>
                </h1>
                </Link>
            )}
        </div>

        {centerContent && (
            <div className="flex-1 flex justify-center min-w-0">
                {centerContent}
            </div>
        )}
        
        <div className="flex-shrink-0 flex items-center gap-3">
            {/* Custom Actions */}
            {children}

            {/* Standard Theme Toggle */}
            <div className="h-6 w-px bg-[var(--border-color)] mx-1" />
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-vercel-light-surface dark:bg-vercel-dark-surface text-vercel-light-text dark:text-vercel-dark-text shadow-sm ring-1 ring-vercel-light-border dark:ring-vercel-dark-border hover:opacity-80"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
        </div>
      </div>
    </header>
  );
};
