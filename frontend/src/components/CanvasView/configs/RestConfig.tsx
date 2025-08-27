import React from 'react';
import { Input } from '../../common/Input';

interface RestConfigProps {
    config: any;
    onConfigChange: (key: string, value: any) => void;
}

export const RestConfig: React.FC<RestConfigProps> = ({ config, onConfigChange }) => {
    return (
        <div className="space-y-4">
             <div className="grid grid-cols-4 gap-4">
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">Method</label>
                     <select
                          value={config.method || 'GET'}
                          onChange={(e) => onConfigChange('method', e.target.value)}
                           className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text text-sm"
                      >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                          <option value="PATCH">PATCH</option>
                      </select>
                 </div>
                 <div className="col-span-3">
                     <Input label="URL" value={config.url || ''} onChange={(e:any) => onConfigChange('url', e.target.value)} placeholder="https://api.example.com/data/{id}" />
                 </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">Headers (JSON)</label>
                <textarea
                    value={typeof config.headers === 'string' ? config.headers : JSON.stringify(config.headers || {}, null, 2)}
                    onChange={(e) => onConfigChange('headers', e.target.value)}
                    className="w-full h-24 px-3 py-2 font-mono text-xs bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                    placeholder='{"Content-Type": "application/json"}'
                />
             </div>
             
             {['POST', 'PUT', 'PATCH'].includes(config.method) && (
                 <div>
                    <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">Body</label>
                    <textarea
                        value={config.body || ''}
                        onChange={(e) => onConfigChange('body', e.target.value)}
                        className="w-full h-32 px-3 py-2 font-mono text-xs bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                        placeholder='{"name": "{name}"}'
                    />
                    <p className="text-xs text-vercel-light-text-secondary mt-1">Use <code>{'{columnName}'}</code> for variable substitution.</p>
                 </div>
             )}
        </div>
    );
};
