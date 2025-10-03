import React from 'react';
import { MultiColumnSelect, ColumnSelect } from './ConfigUtils';
import { Input } from '../../common/Input';
import type { ColumnSchema } from '../../../types/job';

interface NormalizeConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
    schema: ColumnSchema[];
}

export const NormalizeConfig: React.FC<NormalizeConfigProps> = ({ config, onConfigChange, schema }) => {
    return (
        <div className="space-y-4">
            <MultiColumnSelect values={config.idColumns || []} onChange={(val) => onConfigChange('idColumns', val)} label="ID Columns (Keep as identifiers)" schema={schema} />
            <MultiColumnSelect values={config.valueColumns || []} onChange={(val) => onConfigChange('valueColumns', val)} label="Value Columns (To unpivot)" schema={schema} />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Name Column (Var Name)" value={config.varName || 'variable'} onChange={(e: any) => onConfigChange('varName', e.target.value)} />
                <Input label="Value Column (Value Name)" value={config.valueName || 'value'} onChange={(e: any) => onConfigChange('valueName', e.target.value)} />
            </div>
        </div>
    );
};

interface DenormalizeConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
    schema: ColumnSchema[];
}

export const DenormalizeConfig: React.FC<DenormalizeConfigProps> = ({ config, onConfigChange, schema }) => {
    return (
       <div className="space-y-4">
           <MultiColumnSelect values={config.indexColumns || []} onChange={(val) => onConfigChange('indexColumns', val)} label="Index Columns" schema={schema} />
           <div className="grid grid-cols-2 gap-4">
             <div>
                <ColumnSelect value={config.pivotColumn} onChange={(val) => onConfigChange('pivotColumn', val)} label="Pivot Column (Becomes Headers)" required schema={schema} />
             </div>
             <div>
                <ColumnSelect value={config.valueColumn} onChange={(val) => onConfigChange('valueColumn', val)} label="Value Column" required schema={schema} />
             </div>
           </div>
            <div>
               <label className="block text-xs font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">Aggregation Function</label>
               <select
                     value={config.aggFunc || 'first'}
                     onChange={(e) => onConfigChange('aggFunc', e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text text-sm"
                 >
                     <option value="first">First</option>
                     <option value="last">Last</option>
                     <option value="sum">Sum</option>
                     <option value="mean">Mean (Avg)</option>
                     <option value="min">Min</option>
                     <option value="max">Max</option>
                     <option value="count">Count</option>
               </select>
            </div>
       </div>
    );
};
