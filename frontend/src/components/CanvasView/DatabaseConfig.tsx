import React from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { apiClient } from '../../services/api';
import { APP_CONSTANTS } from '../../constants/app';

interface DatabaseConfigProps {
  config: any;
  type: string;
  onConfigChange: (key: string, value: any) => void;
  onPreview: () => void;
  previewLoading: boolean;
  previewError: string | null;
}

export const DatabaseConfig: React.FC<DatabaseConfigProps> = ({
  config,
  type,
  onConfigChange,
  onPreview,
  previewLoading,
  previewError
}) => {
  const connectionMethod = config.connectionMethod || 'native';

  const handleJarUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jar';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
          const response = await apiClient.post(APP_CONSTANTS.API.UPLOAD_JDBC_DRIVER, formData, {
              headers: {
                  'Content-Type': 'multipart/form-data',
              },
          });
          const data = response.data;
          onConfigChange('jdbcJarPath', data.filename);
          alert(`Uploaded: ${data.filename}`);
        } catch (error) {
          alert('Upload failed: ' + error);
        }
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      {/* Connection Method Selector */}
      <div>
        <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
          Connection Method
        </label>
        <select
          value={connectionMethod}
          onChange={(e) => onConfigChange('connectionMethod', e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
        >
          <option value="native">Native (SQLAlchemy)</option>
          <option value="jdbc">JDBC (Custom Drivers)</option>
          <option value="mongo">MongoDB</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {connectionMethod === 'native' && 'Use native Python drivers (MySQL, PostgreSQL, Oracle)'}
          {connectionMethod === 'jdbc' && 'Use JDBC drivers (Impala, custom JARs, Kerberos)'}
          {connectionMethod === 'mongo' && 'MongoDB native driver'}
        </p>
      </div>

      {/* Database Type */}
      <div>
        <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
          Database Type
        </label>
        <select
          value={config.dbType || 'mysql'}
          onChange={(e) => onConfigChange('dbType', e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
        >
          {connectionMethod === 'native' && (
            <>
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="oracle">Oracle</option>
              <option value="sqlite">SQLite</option>
            </>
          )}
          {connectionMethod === 'jdbc' && (
            <>
              <option value="oracle">Oracle (JDBC)</option>
              <option value="impala">Impala</option>
              <option value="hive">Hive</option>
              <option value="custom">Custom JDBC</option>
            </>
          )}
          {connectionMethod === 'mongo' && (
            <option value="mongodb">MongoDB</option>
          )}
        </select>
      </div>

      {/* JDBC-Specific Fields */}
      {connectionMethod === 'jdbc' && (
        <>
          <Input
            label="JDBC Driver Class"
            value={config.jdbcDriver || ''}
            onChange={(e) => onConfigChange('jdbcDriver', e.target.value)}
            placeholder="com.cloudera.impala.jdbc.Driver"
          />
          
          <div>
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
              JDBC URL
            </label>
            <input
              type="text"
              value={config.jdbcUrl || ''}
              onChange={(e) => onConfigChange('jdbcUrl', e.target.value)}
              placeholder="jdbc:impala://host:21050/default"
              className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
              JDBC Driver JAR
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.jdbcJarPath || ''}
                onChange={(e) => onConfigChange('jdbcJarPath', e.target.value)}
                placeholder="driver.jar"
                className="flex-1 px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleJarUpload}
              >
                Upload JAR
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload JAR file or enter filename if already uploaded
            </p>
          </div>

          {/* Authentication Type for JDBC */}
          <div>
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
              Authentication Type
            </label>
            <select
              value={config.authType || 'none'}
              onChange={(e) => onConfigChange('authType', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
            >
              <option value="none">No Authentication</option>
              <option value="userpass">Username & Password</option>
              <option value="kerberos">Kerberos</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {config.authType === 'none' && 'No authentication required'}
              {config.authType === 'userpass' && 'Use username and password for authentication'}
              {(!config.authType || config.authType === 'kerberos') && 'Use Kerberos authentication with keytab'}
            </p>
          </div>

          {/* Username/Password Fields */}
          {config.authType === 'userpass' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Username"
                value={config.username || ''}
                onChange={(e) => onConfigChange('username', e.target.value)}
                placeholder="database_user"
              />
              <Input
                label="Password"
                type="password"
                value={config.password || ''}
                onChange={(e) => onConfigChange('password', e.target.value)}
                placeholder="password"
              />
            </div>
          )}

          {/* Kerberos Fields */}
          {config.authType === 'kerberos' && (
            <>
              <Input
                label="Kerberos Principal"
                value={config.kerberosPrincipal || ''}
                onChange={(e) => onConfigChange('kerberosPrincipal', e.target.value)}
                placeholder="user@REALM.COM"
              />
              <Input
                label="Keytab Path"
                value={config.kerberosKeytab || ''}
                onChange={(e) => onConfigChange('kerberosKeytab', e.target.value)}
                placeholder="/path/to/user.keytab"
              />
              <Input
                label="JAAS Config Path (Optional)"
                value={config.jaasConfig || ''}
                onChange={(e) => onConfigChange('jaasConfig', e.target.value)}
                placeholder="/path/to/jaas.conf"
              />
            </>
          )}
        </>
      )}

      {/* Native/Mongo Connection Fields */}
      {connectionMethod !== 'jdbc' && (
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
            placeholder={connectionMethod === 'mongo' ? '27017' : '3306'}
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
      )}

      {/* Query/Collection Field */}
      {type.includes('reader') && (
        <div>
          <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
            {connectionMethod === 'mongo' ? 'Collection Name' : 'Query'}
          </label>
          <textarea 
            className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
            rows={3}
            value={config.query || ''}
            onChange={(e) => onConfigChange('query', e.target.value)}
            placeholder={connectionMethod === 'mongo' ? 'users' : 'SELECT * FROM table'}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={onPreview}
            disabled={!config.query}
            loading={previewLoading}
            className="mt-2"
          >
            Preview Query & Schema
          </Button>
          {previewError && (
            <p className="text-sm text-red-500 mt-1">{previewError}</p>
          )}
        </div>
      )}

      {type.includes('writer') && (
        <Input
          label="Table"
          value={config.table || ''}
          onChange={(e) => onConfigChange('table', e.target.value)}
          placeholder="table_name"
        />
      )}
    </div>
  );
};
