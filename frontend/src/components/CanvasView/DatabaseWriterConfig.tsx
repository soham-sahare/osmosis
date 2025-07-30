import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { getConnections } from '../../services/api';
import { useJobStore } from '../../store/jobStore';

interface DatabaseWriterConfigProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

export const DatabaseWriterConfig: React.FC<DatabaseWriterConfigProps> = ({
  config,
  onConfigChange,
}) => {
  const { currentJob } = useJobStore();
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const useExistingConnection = config.useExistingConnection || false;

  useEffect(() => {
    if (useExistingConnection && currentJob?.workspaceId) {
      loadConnections();
    }
  }, [useExistingConnection, currentJob?.workspaceId]);

  const loadConnections = async () => {
    if (!currentJob?.workspaceId) return;
    
    setLoadingConnections(true);
    try {
      const data = await getConnections(currentJob.workspaceId);
      setConnections(data);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoadingConnections(false);
    }
  };

  const handleConnectionSelect = (connectionId: string) => {
    const selectedConnection = connections.find(c => c.id === connectionId);
    if (selectedConnection) {
      // Copy connection config to current config
      onConfigChange('connectionId', connectionId);
      onConfigChange('connectionMethod', selectedConnection.connectionMethod);
      onConfigChange('dbType', selectedConnection.dbType);
      onConfigChange('databaseType', selectedConnection.dbType);
      onConfigChange('host', selectedConnection.host);
      onConfigChange('port', selectedConnection.port);
      onConfigChange('database', selectedConnection.database);
      onConfigChange('username', selectedConnection.username);
      onConfigChange('password', selectedConnection.password);
      
      // JDBC specific
      if (selectedConnection.jdbcDriver) {
        onConfigChange('jdbcDriver', selectedConnection.jdbcDriver);
        onConfigChange('jdbcUrl', selectedConnection.jdbcUrl);
        onConfigChange('jdbcJarPath', selectedConnection.jdbcJarPath);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Use Existing Connection Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="useExistingConnection"
          checked={useExistingConnection}
          onChange={(e) => {
            onConfigChange('useExistingConnection', e.target.checked);
            if (!e.target.checked) {
              onConfigChange('connectionId', '');
            }
          }}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <label htmlFor="useExistingConnection" className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">
          Use Existing Connection
        </label>
      </div>

      {useExistingConnection ? (
        <>
          {/* Connection Dropdown */}
          <div>
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
              Select Connection
            </label>
            <select
              value={config.connectionId || ''}
              onChange={(e) => handleConnectionSelect(e.target.value)}
              disabled={loadingConnections}
              className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
            >
              <option value="">
                {loadingConnections ? 'Loading connections...' : 'Select a connection'}
              </option>
              {connections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.name} ({conn.dbType})
                </option>
              ))}
            </select>
            {connections.length === 0 && !loadingConnections && (
              <p className="text-xs text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mt-1">
                No saved connections. Go to workspace Connections tab to create one.
              </p>
            )}
          </div>

          {/* Show connection details (read-only) */}
          {config.connectionId && (
            <div className="p-3 bg-vercel-light-surface dark:bg-vercel-dark-bg rounded-lg border border-vercel-light-border dark:border-vercel-dark-border">
              <p className="text-xs font-medium text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-2">
                Connection Details
              </p>
              <div className="space-y-1 text-xs text-vercel-light-text dark:text-vercel-dark-text">
                <p><span className="font-medium">Type:</span> {config.dbType}</p>
                <p><span className="font-medium">Host:</span> {config.host}:{config.port}</p>
                <p><span className="font-medium">Database:</span> {config.database}</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Manual Database Type Selection */}
          <div>
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
              Database Type
            </label>
            <select
              value={config.dbType || config.databaseType || 'mysql'}
              onChange={(e) => {
                onConfigChange('dbType', e.target.value);
                onConfigChange('databaseType', e.target.value);
              }}
              className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="oracle">Oracle</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlite">SQLite3</option>
            </select>
          </div>

          {/* Manual Configuration Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Input
                label="Host"
                value={config.host || ''}
                onChange={(e) => onConfigChange('host', e.target.value)}
                placeholder="localhost"
              />
            </div>
            <Input
              label="Port"
              type="number"
              value={config.port || ''}
              onChange={(e) => onConfigChange('port', parseInt(e.target.value))}
              placeholder="3306"
            />
            <Input
              label="Database"
              value={config.database || ''}
              onChange={(e) => onConfigChange('database', e.target.value)}
              placeholder="database_name"
            />
            <Input
              label="Username"
              value={config.username || ''}
              onChange={(e) => onConfigChange('username', e.target.value)}
              placeholder="username"
            />
            <Input
              label="Password"
              type="password"
              value={config.password || ''}
              onChange={(e) => onConfigChange('password', e.target.value)}
              placeholder="password"
            />
          </div>
        </>
      )}

      {/* Table Field (always shown for writers) */}
      <div className="pt-2">
        <Input
          label="Table Name"
          value={config.table || ''}
          onChange={(e) => onConfigChange('table', e.target.value)}
          placeholder="output_table"
        />
      </div>
    </div>
  );
};
