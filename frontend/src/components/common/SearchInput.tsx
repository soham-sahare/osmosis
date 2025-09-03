import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary"
        size={16}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-md focus:outline-none focus:ring-1 focus:ring-vercel-accent-blue w-full text-vercel-light-text dark:text-vercel-dark-text placeholder:text-gray-400"
      />
    </div>
  );
};
