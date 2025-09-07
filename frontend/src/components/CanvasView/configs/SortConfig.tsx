import React from 'react';
import { Button } from '../../common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { ColumnSelect } from './ConfigUtils';
import type { ColumnSchema } from '../../../types/job';

interface SortConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
    schema: ColumnSchema[];
}

export const SortConfig: React.FC<SortConfigProps> = ({ config, onConfigChange, schema }) => {
    const sortBy = config.sortBy || [];
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
             <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">Sorting Columns</label>
             <Button size="sm" variant="secondary" onClick={() => onConfigChange('sortBy', [...sortBy, { column: '', order: 'asc' }])}>
                 <Plus size={14} className="mr-1" /> Add
             </Button>
        </div>
        {sortBy.map((item: any, idx: number) => (
            <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                    <ColumnSelect
                        value={item.column}
                        onChange={(val) => {
                             const newSort = [...sortBy]; newSort[idx].column = val; onConfigChange('sortBy', newSort);
                        }}
                        schema={schema}
                    />
                </div>
                <div className="w-24">
                    <select
                        value={item.order}
                        onChange={(e) => {
                             const newSort = [...sortBy]; newSort[idx].order = e.target.value; onConfigChange('sortBy', newSort);
                        }}
                         className="w-full px-2 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text text-sm"
                    >
                        <option value="asc">Asc</option>
                        <option value="desc">Desc</option>
                    </select>
                </div>
                <Button size="sm" variant="secondary" className="h-[38px] w-[38px] p-0 flex items-center justify-center text-red-500" onClick={() => onConfigChange('sortBy', sortBy.filter((_:any, i:number) => i !== idx))}>
                    <Trash2 size={16} />
                </Button>
            </div>
        ))}
      </div>
    );
};
