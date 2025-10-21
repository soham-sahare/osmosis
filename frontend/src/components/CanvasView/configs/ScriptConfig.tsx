import React from 'react';
import { Input } from '../../common/Input';

interface ScriptConfigProps {
    type: string;
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const ScriptConfig: React.FC<ScriptConfigProps> = ({ type, config, onConfigChange }) => {
    if (type === 'run-job') {
      return (
          <div className="space-y-4">
              <Input label="Target Job ID" value={config.jobId || ''} onChange={(e:any) => onConfigChange('jobId', e.target.value)} placeholder="UUID" />
               <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.waitForCompletion !== false}
                    onChange={(e) => onConfigChange('waitForCompletion', e.target.checked)}
                    className="w-4 h-4 text-vercel-accent-blue border-vercel-light-border dark:border-vercel-dark-border rounded focus:ring-vercel-accent-blue"
                  />
                  <span className="text-sm text-vercel-light-text dark:text-vercel-dark-text">Wait for completion</span>
               </label>
          </div>
      )
    }

    // Java-Row (Python Script)
    return (
        <div className="space-y-4">
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">Python Script</label>
            <p className="text-xs text-vercel-light-text-secondary">Available variables: <code>row</code> (dict), <code>json</code>, <code>datetime</code>, <code>math</code>, <code>re</code>. Return modified row or None to filter out.</p>
            <textarea
                value={config.code || ''}
                onChange={(e) => onConfigChange('code', e.target.value)}
                className="w-full h-64 px-3 py-2 font-mono text-sm bg-vercel-light-surface dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                placeholder={`# Example:\nif row['amount'] > 100:\n    row['status'] = 'HIGH'\nreturn row`}
            />
        </div>
    )
};
