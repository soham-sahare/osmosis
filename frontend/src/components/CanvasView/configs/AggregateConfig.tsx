import React from 'react';
import { Button } from '../../common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { ColumnSelect, MultiColumnSelect } from './ConfigUtils';
import { Input } from '../../common/Input';
import type { ColumnSchema } from '../../../types/job';

interface AggregateConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
    schema: ColumnSchema[];
}

export const AggregateConfig: React.FC<AggregateConfigProps> = ({ config, onConfigChange, schema }) => {
    const aggs = config.aggregations || [];
    return (
        <div className="space-y-4">
            <MultiColumnSelect 
                values={config.groupByColumns || []} 
                onChange={(val) => onConfigChange('groupByColumns', val)} 
                label="Group By Columns" 
                schema={schema}
            />
            
            <div className="space-y-3 pt-2 border-t border-vercel-light-border dark:border-vercel-dark-border">
              <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">Operations</label>
                  <Button size="sm" variant="secondary" onClick={() => onConfigChange('aggregations', [...aggs, { column: '', operation: 'count', targetColumn: '' }])}>
                      <Plus size={14} className="mr-1" /> Add
                  </Button>
              </div>
              {aggs.map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-vercel-light-surface dark:bg-vercel-dark-surface rounded-lg border border-vercel-light-border dark:border-vercel-dark-border">
                      <div className="flex gap-2 items-start">
                           <div className="flex-1">
                               <ColumnSelect 
                                   value={item.column} 
                                   onChange={(val) => {
                                       const newAggs = [...aggs]; newAggs[idx].column = val; onConfigChange('aggregations', newAggs);
                                   }} 
                                   label="Source Column"
                                   schema={schema}
                               />
                           </div>
                           <div className="w-32">
                              <label className="block text-xs font-medium mb-1.5">Operation</label>
                              <select
                                  value={item.operation}
                                  onChange={(e) => {
                                      const newAggs = [...aggs]; newAggs[idx].operation = e.target.value; onConfigChange('aggregations', newAggs);
                                  }}
                                  className="w-full px-2 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-sm"
                              >
                                  <option value="count">Count</option>
                                  <option value="sum">Sum</option>
                                  <option value="avg">Avg</option>
                                  <option value="min">Min</option>
                                  <option value="max">Max</option>
                                  <option value="first">First</option>
                                  <option value="last">Last</option>
                              </select>
                           </div>
                           <div className="pt-6">
                               <Button size="sm" variant="secondary" className="text-red-500" onClick={() => onConfigChange('aggregations', aggs.filter((_:any, i:number) => i !== idx))}><Trash2 size={16}/></Button>
                           </div>
                      </div>
                      <Input 
                          label="Target Column (Alias)" 
                          value={item.targetColumn || ''} 
                          onChange={(e: any) => {
                              const newAggs = [...aggs]; newAggs[idx].targetColumn = e.target.value; onConfigChange('aggregations', newAggs);
                          }}
                          placeholder="Optional: New column name"
                      />
                  </div>
              ))}
            </div>
        </div>
    );
};
