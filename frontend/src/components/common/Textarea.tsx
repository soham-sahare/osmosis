import React, { type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
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
      <textarea
        className={`w-full px-3 py-2 bg-white dark:bg-[#0a0a0a] border ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
            : 'border-gray-200 dark:border-[#2a2a2a] focus:border-blue-500 focus:ring-blue-500/20'
        } rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-4 transition-all duration-200 resize-y min-h-[100px] ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-vercel-accent-red">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
};
