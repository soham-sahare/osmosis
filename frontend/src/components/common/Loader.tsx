import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const Loader: React.FC<LoaderProps> = ({ size = 'md', text }) => {
  const sizeClasses = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2 className="animate-spin text-vercel-accent-blue" size={sizeClasses[size]} />
      {text && (
        <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
          {text}
        </p>
      )}
    </div>
  );
};
