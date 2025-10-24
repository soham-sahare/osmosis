import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { getConnections } from '../../services/api';
import { FolderOpen } from 'lucide-react';

interface FileWriterConfigProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
  onEditSchema?: () => void;
}

export const FileWriterConfig: React.FC<FileWriterConfigProps> = ({ config, onConfigChange, onEditSchema }) => {
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const useExistingConnection = config.useExistingConnection || false;

  useEffect(() => {
    if (useExistingConnection) {
      loadConnections();
    }
  }, [useExistingConnection]);

  const loadConnections = async () => {
    setLoadingConnections(true);
    try {
      const pathParts = window.location.pathname.split('/');
      const workspaceId = pathParts[2];
      if (workspaceId) {
          const data = await getConnections(workspaceId);
          const fileConnections = data.filter((c: any) => ['ssh', 's3', 'hdfs'].includes(c.connectionMethod));
          setConnections(fileConnections);
      }
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Mode Toggle */}
      <div className="flex items-center gap-2 mb-2">
        <input
            type="checkbox"
            id="useExistingConnection"
            checked={useExistingConnection}
            onChange={(e) => {
                onConfigChange('useExistingConnection', e.target.checked);
                if (!e.target.checked) {
                    onConfigChange('connectionId', undefined);
                }
            }}
            className="w-4 h-4 text-vercel-accent-blue border-vercel-light-border dark:border-vercel-dark-border rounded focus:ring-vercel-accent-blue"
        />
        <label htmlFor="useExistingConnection" className="text-sm text-vercel-light-text dark:text-vercel-dark-text cursor-pointer select-none">
            Use Saved File Connection (SSH / S3)
        </label>
      </div>

       {/* Connection Selector */}
       {useExistingConnection ? (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">
            Select Connection
          </label>
          <div className="relative">
             <select
              value={config.connectionId || ''}
              onChange={(e) => onConfigChange('connectionId', e.target.value)}
              disabled={loadingConnections}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue disabled:opacity-50 appearance-none"
            >
              <option value="">Select a file system...</option>
              {connections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.name} ({conn.connectionMethod.toUpperCase()})
                </option>
              ))}
            </select>
            <FolderOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary" />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {loadingConnections && <p className="text-xs text-vercel-light-text-secondary">Loading connections...</p>}
        </div>
      ) : null}

      <div className="space-y-2">
        <Input
          label={useExistingConnection ? "Remote Path" : "Local File Path"}
          value={config.filePath || ''}
          onChange={(e) => onConfigChange('filePath', e.target.value)}
          placeholder={useExistingConnection ? "/home/user/output.csv" : "/path/to/output.csv"}
        />
        
        {onEditSchema && (
            <div className="flex gap-2">
                 <Button
                  variant="secondary"
                  size="sm"
                  onClick={onEditSchema}
                  className="flex-1"
                >
                  Edit Output Schema
                </Button>
            </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">
          File Type
        </label>
        <div className="flex gap-4">
          {['delimited', 'excel', 'parquet', 'json'].map((ft) => (
            <label key={ft} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="fileType"
                value={ft}
                checked={(config.fileType || 'delimited') === ft}
                onChange={(e) => onConfigChange('fileType', e.target.value)}
                className="w-4 h-4 text-vercel-accent-blue border-vercel-light-border dark:border-vercel-dark-border focus:ring-vercel-accent-blue"
              />
              <span className="text-sm capitalize text-vercel-light-text dark:text-vercel-dark-text">
                {ft}
              </span>
            </label>
          ))}
        </div>
      </div>
      
       <div className="grid grid-cols-2 gap-4">
        {config.fileType === 'delimited' && (
            <>
            <div className="col-span-2 space-y-2">
                <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">
                    Delimiter
                </label>
                <select
                    value={['.','|','\t',','].includes(config.delimiter) ? config.delimiter : 'custom'}
                    onChange={(e) => {
                         if (e.target.value !== 'custom') {
                            onConfigChange('delimiter', e.target.value);
                        } else {
                            onConfigChange('delimiter', '');
                        }
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                >
                    <option value=",">Comma (,)</option>
                    <option value="|">Pipe (|)</option>
                    <option value="	">Tab (\t)</option>
                    <option value="custom">Custom</option>
                </select>
            </div>

            <div className="col-span-2">
                    <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                    Encoding
                </label>
                <select
                    value={config.encoding || 'utf-8'}
                    onChange={(e) => onConfigChange('encoding', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                >
                    <option value="utf-8">UTF-8</option>
                    <option value="ascii">ASCII</option>
                    <option value="iso-8859-1">ISO-8859-1 (Latin-1)</option>
                    <option value="utf-16">UTF-16</option>
                </select>
            </div>
            </>
        )}

        {config.fileType === 'json' && (
             <div className="col-span-2 space-y-2">
                 <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">
                    JSON Mode
                </label>
                <select
                    value={config.jsonMode || 'array'}
                    onChange={(e) => onConfigChange('jsonMode', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                >
                    <option value="array">Standard Array ([...])</option>
                    <option value="lines">JSON Lines (NDJSON)</option>
                </select>
            </div>
        )}
      </div>
    </div>
  );
};
