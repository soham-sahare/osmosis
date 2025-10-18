import React from 'react';
import { Button } from '../../common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { ColumnSelect } from './ConfigUtils';
import type { ColumnSchema } from '../../../types/job';

interface ConvertTypeConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
    schema: ColumnSchema[];
}

export const ConvertTypeConfig: React.FC<ConvertTypeConfigProps> = ({ config, onConfigChange, schema }) => {
    const conversions = config.conversions || [];
    return (
       <div className="space-y-3">
          <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">Type Conversions</label>
              <Button size="sm" variant="secondary" onClick={() => onConfigChange('conversions', [...conversions, { column: '', type: 'string' }])}>
                  <Plus size={14} className="mr-1" /> Add
              </Button>
         </div>
         {conversions.map((item: any, idx: number) => (
             <div key={idx} className="flex gap-2 items-end">
                 <div className="flex-1">
                     <ColumnSelect 
                        value={item.column} 
                        onChange={(val) => {
                            const newC = [...conversions]; newC[idx].column = val; onConfigChange('conversions', newC);
                        }}
                        schema={schema}
                     />
                 </div>
                 <div className="w-32">
                     <select
                         value={item.type}
                         onChange={(e) => {
                              const newC = [...conversions]; newC[idx].type = e.target.value; onConfigChange('conversions', newC);
                         }}
                          className="w-full px-2 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text text-sm"
                     >
                         <option value="string">String</option>
                         <option value="integer">Integer</option>
                         <option value="float">Float</option>
                         <option value="boolean">Boolean</option>
                         <option value="date">Date (ISO)</option>
                     </select>
                 </div>
                 <Button size="sm" variant="secondary" className="h-[38px] w-[38px] p-0 flex items-center justify-center text-red-500" onClick={() => onConfigChange('conversions', conversions.filter((_:any, i:number) => i !== idx))}>
                     <Trash2 size={16} />
                 </Button>
             </div>
         ))}
       </div>
    );
};
