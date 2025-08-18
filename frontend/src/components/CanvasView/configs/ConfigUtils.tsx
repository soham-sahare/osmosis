import React from 'react';
import { Input } from '../../common/Input';
import type { ColumnSchema } from '../../../types/job';

interface ColumnSelectProps {
    value: string;
    onChange: (val: string) => void;
    label?: string;
    required?: boolean;
    schema: ColumnSchema[];
    placeholder?: string;
}

export const ColumnSelect: React.FC<ColumnSelectProps> = ({ value, onChange, label, required, schema, placeholder }) => (
    <div className="w-full">
      {label && <label className="block text-xs font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">{label}</label>}
      {schema && schema.length > 0 ? (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue text-sm"
        >
          <option value="" disabled={required}>Select column...</option>
          {schema.map((col) => (
            <option key={col.name} value={col.name}>{col.name} ({col.type})</option>
          ))}
        </select>
      ) : (
        <Input 
          label={label || ''} 
          value={value || ''} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder || "Column Name"} 
        />
      )}
    </div>
);

interface MultiColumnSelectProps {
    values: string[];
    onChange: (val: string[]) => void;
    label: string;
    schema: ColumnSchema[];
}

export const MultiColumnSelect: React.FC<MultiColumnSelectProps> = ({ values, onChange, label, schema }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">{label}</label>
      <div className="flex flex-wrap gap-2 p-2 border border-vercel-light-border dark:border-vercel-dark-border rounded-lg min-h-[42px] bg-white dark:bg-vercel-dark-bg">
        {values.map((val) => (
          <span key={val} className="inline-flex items-center px-2 py-1 rounded bg-vercel-accent-blue/10 text-vercel-accent-blue text-xs max-w-full">
            <span className="truncate max-w-[150px]">{val}</span>
            <button onClick={() => onChange(values.filter(v => v !== val))} className="ml-1 hover:text-red-500">×</button>
          </span>
        ))}
        <select
          value=""
          onChange={(e) => {
            if (e.target.value && !values.includes(e.target.value)) {
              onChange([...values, e.target.value]);
            }
          }}
          className="bg-transparent text-sm min-w-[100px] outline-none text-vercel-light-text dark:text-vercel-dark-text"
        >
           <option value="" disabled>+ Add column</option>
           {schema.map((col) => !values.includes(col.name) && (
             <option key={col.name} value={col.name}>{col.name}</option>
           ))}
        </select>
      </div>
    </div>
);
