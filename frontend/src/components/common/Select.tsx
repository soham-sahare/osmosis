import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  children,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`w-full appearance-none px-3 py-2 bg-white dark:bg-vercel-dark-surface border ${
            error
              ? 'border-vercel-accent-red focus:ring-vercel-accent-red'
              : 'border-vercel-light-border dark:border-vercel-dark-border focus:ring-vercel-accent-blue'
          } rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
          <ChevronDown size={16} />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-vercel-accent-red">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
};
