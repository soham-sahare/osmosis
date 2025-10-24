import React from 'react';
import { MultiColumnSelect } from './ConfigUtils';
import type { ColumnSchema } from '../../../types/job';

interface UniqRowConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
    schema: ColumnSchema[];
}

export const UniqRowConfig: React.FC<UniqRowConfigProps> = ({ config, onConfigChange, schema }) => {
    return (
        <MultiColumnSelect 
            values={config.uniqueKey || []} 
            onChange={(val) => onConfigChange('uniqueKey', val)} 
            label="Unique Key Columns (Leave empty for all)" 
            schema={schema}
        />
    );
};
