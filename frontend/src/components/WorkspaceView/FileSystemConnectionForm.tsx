import React from 'react';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

interface FileSystemConnectionFormProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

export const FileSystemConnectionForm: React.FC<FileSystemConnectionFormProps> = ({ config, onConfigChange }) => {
  // Default to ssh if not set or invalid
  const connectionMethod = ['ssh', 's3', 'hdfs'].includes(config.connectionMethod) 
    ? config.connectionMethod 
    : 'ssh';

  const authType = config.authType || 'password';

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Connection Name */}
      <div>
        <Input
          label="Mount Name"
          value={config.name || ''}
          onChange={(e) => onConfigChange('name', e.target.value)}
          placeholder="My Remote Files"
        />
      </div>

      {/* Connection Method */}
      <div>
        <Select
          label="File System Type"
          value={connectionMethod}
          onChange={(e) => onConfigChange('connectionMethod', e.target.value)}
        >
          <option value="ssh">SSH / SFTP (Linux VM)</option>
          <option value="s3">S3 / Cloud Storage</option>
          <option value="hdfs">HDFS (Hadoop)</option>
        </Select>
      </div>

      {/* SSH Fields */}
      {connectionMethod === 'ssh' && (
        <>
            <div className="col-span-2">
                <Input
                label="Host / IP Address"
                value={config.host || ''}
                onChange={(e) => onConfigChange('host', e.target.value)}
                placeholder="192.168.1.100"
                />
            </div>

            <Input
                label="Port"
                type="number"
                value={config.port || ''}
                onChange={(e) => onConfigChange('port', parseInt(e.target.value) || '')}
                placeholder="22"
            />
            
            <Input
                label="Username"
                value={config.username || ''}
                onChange={(e) => onConfigChange('username', e.target.value)}
                placeholder="ubuntu"
            />

            {/* Auth Type Selection */}
            <div className="col-span-2">
                <Select
                    label="Authentication Type"
                    value={authType}
                    onChange={(e) => onConfigChange('authType', e.target.value)}
                >
                    <option value="password">Password</option>
                    <option value="privateKey">Private Key</option>
                </Select>
            </div>

            {authType === 'privateKey' && (
                 <div className="col-span-2">
                    <Input
                        label="Private Key Path"
                        value={config.privateKeyPath || ''}
                        onChange={(e) => onConfigChange('privateKeyPath', e.target.value)}
                        placeholder="/home/user/.ssh/id_rsa"
                    />
                     {/* Optional password for encrypted key 
                       Not typically used in simple UI but good to have if needed. 
                       Let's hide it for simplicity unless requested or if key is encrypted.
                       Actually, usually passowrd field is reused for key passphrase.
                     */}
                    <div className="mt-2">
                        <Input
                            label="Key Passphrase (Optional)"
                            type="password"
                            value={config.password || ''}
                            onChange={(e) => onConfigChange('password', e.target.value)}
                            placeholder="Passphrase if key is encrypted"
                        />
                    </div>
                </div>
            )}

            {authType === 'password' && (
                 <div className="col-span-2">
                    <Input
                        label="Password"
                        type="password"
                        value={config.password || ''}
                        onChange={(e) => onConfigChange('password', e.target.value)}
                        placeholder="password"
                    />
                </div>
            )}
        </>
      )}

      {/* S3 Fields */}
      {connectionMethod === 's3' && (
        <>
             <div className="col-span-2">
                <Input
                label="Bucket Name"
                value={config.bucket || ''}
                onChange={(e) => onConfigChange('bucket', e.target.value)}
                placeholder="my-data-bucket"
                />
            </div>
             <Input
                label="Region"
                value={config.region || ''}
                onChange={(e) => onConfigChange('region', e.target.value)}
                placeholder="us-east-1"
            />
             <Input
                label="Endpoint URL (Optional)"
                value={config.endpoint || ''}
                onChange={(e) => onConfigChange('endpoint', e.target.value)}
                placeholder="https://s3.amazonaws.com"
            />
             <Input
                label="Access Key ID"
                value={config.accessKey || ''}
                onChange={(e) => onConfigChange('accessKey', e.target.value)}
                placeholder="AKIA..."
            />
             <Input
                label="Secret Access Key"
                type="password"
                value={config.secretKey || ''}
                onChange={(e) => onConfigChange('secretKey', e.target.value)}
                placeholder="Required for private buckets"
            />
        </>
      )}
      
      {/* HDFS Fields */}
      {connectionMethod === 'hdfs' && (
        <div className="col-span-2 py-4 text-center">
            <p className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
                HDFS connection support is coming soon.
            </p>
        </div>
      )}
    </div>
  );
};
