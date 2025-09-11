import { useState, useEffect } from 'react';

type ViewMode = 'grid' | 'list';

export const useViewMode = (context: string, defaultMode: ViewMode = 'grid') => {
  const key = `view-mode-${context}`;
  const [mode, setMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(key);
      return (saved === 'grid' || saved === 'list') ? saved : defaultMode;
    } catch {
      return defaultMode;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, mode);
  }, [mode, key]);

  const toggleMode = () => setMode(prev => prev === 'grid' ? 'list' : 'grid');

  return { mode, setMode, toggleMode };
};
