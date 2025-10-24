import React from 'react';
import { ColumnSelect } from './ConfigUtils';
import { Input } from '../../common/Input';
import type { ColumnSchema } from '../../../types/job';

interface SplitRowConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
    schema: ColumnSchema[];
}

export const SplitRowConfig: React.FC<SplitRowConfigProps> = ({ config, onConfigChange, schema }) => {
    return (
        <div className="space-y-4">
             <ColumnSelect value={config.column} onChange={(val) => onConfigChange('column', val)} label="Column to Split" required schema={schema} />
             <Input label="Separator" value={config.separator || ','} onChange={(e:any) => onConfigChange('separator', e.target.value)} placeholder="," />
        </div>
    );
};
