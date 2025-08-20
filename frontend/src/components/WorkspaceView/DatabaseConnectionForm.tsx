import React from 'react';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

interface DatabaseConnectionFormProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

export const DatabaseConnectionForm: React.FC<DatabaseConnectionFormProps> = ({ config, onConfigChange }) => {
  const connectionMethod = config.connectionMethod || 'native';
  const authType = config.authType || 'none';

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Connection Name */}
      <div>
        <Input
          label="Connection Name"
          value={config.name || ''}
          onChange={(e) => onConfigChange('name', e.target.value)}
          placeholder="My Database Connection"
        />
      </div>

      {/* Connection Method */}
      <div>
        <Select
          label="Connection Method"
          value={connectionMethod}
          onChange={(e) => onConfigChange('connectionMethod', e.target.value)}
        >
          <option value="native">Native (SQLAlchemy)</option>
          <option value="jdbc">JDBC (Custom Drivers)</option>
          <option value="mongo">MongoDB</option>
        </Select>
      </div>

      {/* Database Type - Full Width */}
      <div className="col-span-2">
        <Select
          label="Database Type"
          value={config.dbType || 'mysql'}
          onChange={(e) => onConfigChange('dbType', e.target.value)}
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
        </Select>
      </div>

      {/* JDBC-Specific Fields */}
      {connectionMethod === 'jdbc' && (
        <>
          <div className="col-span-2">
            <Input
              label="JDBC Driver Class"
              value={config.jdbcDriver || ''}
              onChange={(e) => onConfigChange('jdbcDriver', e.target.value)}
              placeholder="com.cloudera.impala.jdbc.Driver"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="JDBC URL"
              value={config.jdbcUrl || ''}
              onChange={(e) => onConfigChange('jdbcUrl', e.target.value)}
              placeholder="jdbc:impala://host:21050/default"
            />
          </div>
          <div className="col-span-2">
            <Input
              label="JDBC JAR Path"
              value={config.jdbcJarPath || ''}
              onChange={(e) => onConfigChange('jdbcJarPath', e.target.value)}
              placeholder="driver.jar"
            />
          </div>

          {/* Authentication Type */}
          <div className="col-span-2">
            <Select
              label="Authentication Type"
              value={authType}
              onChange={(e) => onConfigChange('authType', e.target.value)}
            >
              <option value="none">No Authentication</option>
              <option value="userpass">Username & Password</option>
              <option value="kerberos">Kerberos</option>
            </Select>
          </div>

          {/* Username/Password for JDBC */}
          {authType === 'userpass' && (
            <>
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
            </>
          )}

          {/* Kerberos Fields */}
          {authType === 'kerberos' && (
            <>
              <div className="col-span-2">
                <Input
                  label="Kerberos Principal"
                  value={config.kerberosPrincipal || ''}
                  onChange={(e) => onConfigChange('kerberosPrincipal', e.target.value)}
                  placeholder="user@REALM.COM"
                />
              </div>
              <div className="col-span-2">
                <Input
                  label="Keytab Path"
                  value={config.kerberosKeytab || ''}
                  onChange={(e) => onConfigChange('kerberosKeytab', e.target.value)}
                  placeholder="/path/to/user.keytab"
                />
              </div>
            </>
          )}
        </>
      )}

      {/* Native/Mongo Connection Fields */}
      {['native', 'mongo'].includes(connectionMethod) && (
        <>
          {config.dbType !== 'sqlite' && (
             <>
                <div className="col-span-2">
                    <Input
                    label="Host"
                    value={config.host || ''}
                    onChange={(e) => onConfigChange('host', e.target.value)}
                    placeholder={connectionMethod === 'mongo' ? 'localhost' : '192.168.1.100'}
                    />
                </div>
                <Input
                    label="Port"
                    type="number"
                    value={config.port || ''}
                    onChange={(e) => onConfigChange('port', parseInt(e.target.value) || '')}
                    placeholder="3306"
                />
             </>
          )}

          <div className={config.dbType === 'sqlite' ? 'col-span-2' : ''}>
              <Input
                label={config.dbType === 'sqlite' ? 'Database File Path' : 'Database'}
                value={config.database || ''}
                onChange={(e) => onConfigChange('database', e.target.value)}
                placeholder={config.dbType === 'sqlite' ? '/path/to/db.sqlite' : 'database_name'}
              />
          </div>
          
          {config.dbType !== 'sqlite' && (
              <>
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
              </>
          )}
        </>
      )}
    </div>
  );
};
