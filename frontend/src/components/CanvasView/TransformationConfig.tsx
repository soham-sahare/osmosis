import React from 'react';
import type { ColumnSchema } from '../../types/job';

// Import Config Components
import { UniqRowConfig } from './configs/UniqRowConfig';
import { SortConfig } from './configs/SortConfig';
import { AggregateConfig } from './configs/AggregateConfig';
import { NormalizeConfig, DenormalizeConfig } from './configs/PivotConfig';
import { SplitRowConfig } from './configs/SplitRowConfig';
import { ConvertTypeConfig } from './configs/ConvertTypeConfig';
import { RowGeneratorConfig } from './configs/RowGeneratorConfig';
import { ScriptConfig } from './configs/ScriptConfig';
import { RestConfig } from './configs/RestConfig';

interface TransformationConfigProps {
  type: string;
  config: any;
  onConfigChange: (key: string, value: any) => void;
  schema: ColumnSchema[];
}

export const TransformationConfig: React.FC<TransformationConfigProps> = ({ type, config, onConfigChange, schema }) => {
  
  switch (type) {
    case 'uniq-row':
      return <UniqRowConfig config={config} onConfigChange={onConfigChange} schema={schema} />;
    
    case 'sort':
      return <SortConfig config={config} onConfigChange={onConfigChange} schema={schema} />;
    
    case 'aggregate':
      return <AggregateConfig config={config} onConfigChange={onConfigChange} schema={schema} />;
      
    case 'normalize':
      return <NormalizeConfig config={config} onConfigChange={onConfigChange} schema={schema} />;
      
    case 'denormalize':
      return <DenormalizeConfig config={config} onConfigChange={onConfigChange} schema={schema} />;
      
    case 'split-row':
      return <SplitRowConfig config={config} onConfigChange={onConfigChange} schema={schema} />;
      
    case 'convert-type':
      return <ConvertTypeConfig config={config} onConfigChange={onConfigChange} schema={schema} />;
      
    case 'row-generator':
      return <RowGeneratorConfig config={config} onConfigChange={onConfigChange} />;
      
    case 'run-job':
    case 'java-row':
      return <ScriptConfig type={type} config={config} onConfigChange={onConfigChange} />;
      
    case 'rest-client':
      return <RestConfig config={config} onConfigChange={onConfigChange} />;
      
    default:
      return <div className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary italic">Configuration not available for {type}</div>;
  }
};
