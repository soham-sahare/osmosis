import React from 'react';
import { Button } from '../../common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '../../common/Input';

interface RowGeneratorConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const RowGeneratorConfig: React.FC<RowGeneratorConfigProps> = ({ config, onConfigChange }) => {
    const fields = config.fields || [];
    return (
        <div className="space-y-4">
             <Input label="Number of Rows" type="number" value={config.rows || 10} onChange={(e:any) => onConfigChange('rows', e.target.value)} />
             
             <div className="space-y-3 pt-2 border-t border-vercel-light-border dark:border-vercel-dark-border">
             <div className="flex justify-between items-center">
                 <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">Mock Fields</label>
                 <Button size="sm" variant="secondary" onClick={() => onConfigChange('fields', [...fields, { name: 'col'+(fields.length+1), type: 'string' }])}>
                     <Plus size={14} className="mr-1" /> Add
                 </Button>
             </div>
             {fields.map((item: any, idx: number) => (
                 <div key={idx} className="flex gap-2 items-end">
                     <Input 
                         value={item.name} 
                         onChange={(e:any) => {
                              const newF = [...fields]; newF[idx].name = e.target.value; onConfigChange('fields', newF);
                         }}
                         placeholder="Field Name"
                         className="flex-1"
                     />
                     <div className="w-32">
                         <select
                             value={item.type}
                             onChange={(e) => {
                                  const newF = [...fields]; newF[idx].type = e.target.value; onConfigChange('fields', newF);
                             }}
                              className="w-full px-2 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text text-sm"
                         >
                             <option value="string">String</option>
                             <option value="integer">Integer</option>
                             <option value="boolean">Boolean</option>
                             <option value="date">Date</option>
                         </select>
                     </div>
                     <Button size="sm" variant="secondary" className="h-[38px] w-[38px] p-0 flex items-center justify-center text-red-500" onClick={() => onConfigChange('fields', fields.filter((_:any, i:number) => i !== idx))}>
                         <Trash2 size={16} />
                     </Button>
                 </div>
             ))}
           </div>
        </div>
    );
};
