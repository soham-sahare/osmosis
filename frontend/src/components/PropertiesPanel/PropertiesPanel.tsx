import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { Input } from '../common/Input';
import { Textarea } from '../common/Textarea';

interface PropertiesPanelProps {
  nodeId: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ nodeId }) => {
  const { nodes, updateNodeData } = useCanvasStore();
  const node = nodes.find((n) => n.id === nodeId);
  const [config, setConfig] = useState(node?.data.config || {});

  useEffect(() => {
    if (node) {
      setConfig(node.data.config || {});
    }
  }, [node]);

  if (!node) return null;

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    updateNodeData(nodeId, { config: newConfig });
  };

  const renderConfigFields = () => {
    const { type } = node.data;

    // Database components
    if (type.includes('database')) {
      return (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
              Database Type
            </label>
            <select
              value={config.databaseType || 'mysql'}
              onChange={(e) => handleConfigChange('databaseType', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlite">SQLite</option>
              <option value="oracle">Oracle</option>
            </select>
          </div>
          <Input
            label="Host"
            value={config.host || ''}
            onChange={(e) => handleConfigChange('host', e.target.value)}
            placeholder="localhost"
          />
          <Input
            label="Port"
            type="number"
            value={config.port || ''}
            onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
            placeholder="3306"
          />
          <Input
            label="Database"
            value={config.database || ''}
            onChange={(e) => handleConfigChange('database', e.target.value)}
            placeholder="database_name"
          />
          <Input
            label="Username"
            value={config.username || ''}
            onChange={(e) => handleConfigChange('username', e.target.value)}
            placeholder="username"
          />
          <Input
            label="Password"
            type="password"
            value={config.password || ''}
            onChange={(e) => handleConfigChange('password', e.target.value)}
            placeholder="password"
          />
          {type.includes('reader') && (
            <Textarea
              label="Query"
              value={config.query || ''}
              onChange={(e) => handleConfigChange('query', e.target.value)}
              placeholder="SELECT * FROM table_name"
              rows={3}
            />
          )}
          {type.includes('writer') && (
            <Input
              label="Table"
              value={config.table || ''}
              onChange={(e) => handleConfigChange('table', e.target.value)}
              placeholder="table_name"
            />
          )}
        </>
      );
    }

    // File components
    if (type.includes('csv') || type.includes('excel') || type.includes('file')) {
      return (
        <>
          <Input
            label="File Path"
            value={config.filePath || ''}
            onChange={(e) => handleConfigChange('filePath', e.target.value)}
            placeholder="/path/to/file"
          />
          {(type.includes('csv') || type.includes('custom')) && (
            <>
              <Input
                label="Delimiter"
                value={config.delimiter || ','}
                onChange={(e) => handleConfigChange('delimiter', e.target.value)}
                placeholder=","
              />
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasHeader"
                  checked={config.hasHeader !== false}
                  onChange={(e) => handleConfigChange('hasHeader', e.target.checked)}
                  className="w-4 h-4 text-vercel-accent-blue bg-white dark:bg-vercel-dark-bg border-vercel-light-border dark:border-vercel-dark-border rounded focus:ring-2 focus:ring-vercel-accent-blue"
                />
                <label
                  htmlFor="hasHeader"
                  className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text"
                >
                  Has Header Row
                </label>
              </div>
              <Input
                label="Encoding"
                value={config.encoding || 'utf-8'}
                onChange={(e) => handleConfigChange('encoding', e.target.value)}
                placeholder="utf-8"
              />
            </>
          )}
          {type.includes('excel') && (
            <Input
              label="Sheet Name"
              value={config.sheetName || 'Sheet1'}
              onChange={(e) => handleConfigChange('sheetName', e.target.value)}
              placeholder="Sheet1"
            />
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div className="w-80 border-l border-vercel-light-border dark:border-vercel-dark-border bg-white dark:bg-vercel-dark-surface flex flex-col">
      <div className="p-4 border-b border-vercel-light-border dark:border-vercel-dark-border">
        <h2 className="text-sm font-semibold text-vercel-light-text dark:text-vercel-dark-text">
          Properties
        </h2>
        <p className="text-xs text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mt-0.5">
          {node.data.label}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <Input
          label="Component Label"
          value={node.data.label}
          onChange={(e) => updateNodeData(nodeId, { label: e.target.value })}
          placeholder="Component name"
        />
        
        {renderConfigFields()}
      </div>
    </div>
  );
};
