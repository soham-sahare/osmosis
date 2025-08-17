import React, { useState } from 'react';
import { Input } from '../common/Input';


interface MessagingConfigProps {
  type: string;
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

export const MessagingConfig: React.FC<MessagingConfigProps> = ({ type, config, onConfigChange }) => {
  const isInput = type === 'kafka-input';
  const [activeTab, setActiveTab] = useState<'basic' | 'security' | 'schema' | 'advanced'>('basic');

  const tabs = [
    { id: 'basic', label: 'Basic' },
    { id: 'security', label: 'Security' },
    { id: 'schema', label: 'Schema Registry' },
    { id: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-vercel-light-border dark:border-vercel-dark-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-vercel-accent-blue text-vercel-accent-blue'
                : 'border-transparent text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary hover:text-vercel-light-text dark:hover:text-vercel-dark-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Basic Settings */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <Input
            label="Bootstrap Servers"
            value={config.bootstrapServers || 'localhost:9092'}
            onChange={(e) => onConfigChange('bootstrapServers', e.target.value)}
            placeholder="localhost:9092,broker2:9092"
          />
          
          <Input
            label="Topic"
            value={config.topic || ''}
            onChange={(e) => onConfigChange('topic', e.target.value)}
            placeholder="topic_name"
          />
          
          {isInput && (
            <>
                <Input
                    label="Consumer Group ID"
                    value={config.groupId || ''}
                    onChange={(e) => onConfigChange('groupId', e.target.value)}
                    placeholder="my-consumer-group"
                />
                
                <div>
                    <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                        Auto Offset Reset
                    </label>
                    <select
                        value={config.autoOffsetReset || 'earliest'}
                        onChange={(e) => onConfigChange('autoOffsetReset', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue text-sm"
                    >
                        <option value="earliest">Earliest (Beginning)</option>
                        <option value="latest">Latest (Newest)</option>
                        <option value="none">None (Throw exception)</option>
                    </select>
                </div>
            </>
          )}

          {!isInput && (
             <div>
                <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                    Compression Type
                </label>
                <select
                    value={config.compressionType || 'none'}
                    onChange={(e) => onConfigChange('compressionType', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue text-sm"
                >
                    <option value="none">None</option>
                    <option value="gzip">GZIP</option>
                    <option value="snappy">Snappy</option>
                    <option value="lz4">LZ4</option>
                    <option value="zstd">Zstd</option>
                </select>
             </div>
          )}
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                    Security Protocol
                </label>
                <select
                    value={config.securityProtocol || 'PLAINTEXT'}
                    onChange={(e) => onConfigChange('securityProtocol', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue text-sm"
                >
                    <option value="PLAINTEXT">PLAINTEXT</option>
                    <option value="SSL">SSL</option>
                    <option value="SASL_PLAINTEXT">SASL_PLAINTEXT</option>
                    <option value="SASL_SSL">SASL_SSL</option>
                </select>
            </div>

            {(config.securityProtocol?.startsWith('SASL')) && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                            SASL Mechanism
                        </label>
                        <select
                            value={config.saslMechanism || 'PLAIN'}
                            onChange={(e) => onConfigChange('saslMechanism', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue text-sm"
                        >
                            <option value="PLAIN">PLAIN</option>
                            <option value="SCRAM-SHA-256">SCRAM-SHA-256</option>
                            <option value="SCRAM-SHA-512">SCRAM-SHA-512</option>
                            <option value="GSSAPI">GSSAPI (Kerberos)</option>
                            <option value="OAUTHBEARER">OAUTHBEARER</option>
                        </select>
                    </div>
                    <Input
                        label="SASL Username / key"
                        value={config.saslUsername || ''}
                        onChange={(e) => onConfigChange('saslUsername', e.target.value)}
                    />
                    <Input
                        label="SASL Password / secret"
                        type="password"
                        value={config.saslPassword || ''}
                        onChange={(e) => onConfigChange('saslPassword', e.target.value)}
                    />
                </>
            )}
            
            {(config.securityProtocol?.includes('SSL')) && (
                 <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs rounded-md">
                     SSL/TLS certificate paths configuration will be handled via File Mounts or environment variables in the future.
                 </div>
            )}
        </div>
      )}

      {/* Schema Registry */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={config.useSchemaRegistry || false}
                    onChange={(e) => onConfigChange('useSchemaRegistry', e.target.checked)}
                    className="w-4 h-4 text-vercel-accent-blue border-vercel-light-border dark:border-vercel-dark-border rounded focus:ring-vercel-accent-blue"
                  />
                  <label className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">Enable Schema Registry</label>
             </div>

             {config.useSchemaRegistry && (
                 <>
                    <Input
                        label="Schema Registry URL"
                        value={config.schemaRegistryUrl || ''}
                        onChange={(e) => onConfigChange('schemaRegistryUrl', e.target.value)}
                        placeholder="http://localhost:8081"
                    />
                    
                    <div>
                        <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                            Schema Type
                        </label>
                        <select
                            value={config.schemaType || 'AVRO'}
                            onChange={(e) => onConfigChange('schemaType', e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue text-sm"
                        >
                            <option value="AVRO">Avro</option>
                            <option value="JSON">JSON Schema</option>
                            <option value="PROTOBUF">Protobuf</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <Input
                            label="Key Subject Name Strategy"
                            value={config.keySubject || ''}
                            onChange={(e) => onConfigChange('keySubject', e.target.value)}
                            placeholder="Default: TopicNameStrategy"
                        />
                         <Input
                            label="Value Subject Name Strategy"
                            value={config.valueSubject || ''}
                            onChange={(e) => onConfigChange('valueSubject', e.target.value)}
                            placeholder="Default: TopicNameStrategy"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                         <Input
                            label="Registry Username"
                            value={config.schemaRegistryUser || ''}
                            onChange={(e) => onConfigChange('schemaRegistryUser', e.target.value)}
                        />
                         <Input
                            label="Registry Password"
                            type="password"
                            value={config.schemaRegistryPass || ''}
                            onChange={(e) => onConfigChange('schemaRegistryPass', e.target.value)}
                        />
                    </div>
                 </>
             )}
        </div>
      )}

      {/* Advanced Settings */}
      {activeTab === 'advanced' && (
        <div className="space-y-4">
             {isInput ? (
                 <>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Max Poll Records"
                            type="number"
                            value={config.maxPollRecords || 500}
                            onChange={(e) => onConfigChange('maxPollRecords', e.target.value)}
                        />
                         <Input
                            label="Fetch Min Bytes"
                            type="number"
                            value={config.fetchMinBytes || 1}
                            onChange={(e) => onConfigChange('fetchMinBytes', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <Input
                            label="Heartbeat Interval (ms)"
                            type="number"
                            value={config.heartbeatIntervalMs || 3000}
                            onChange={(e) => onConfigChange('heartbeatIntervalMs', e.target.value)}
                        />
                         <Input
                            label="Session Timeout (ms)"
                            type="number"
                            value={config.sessionTimeoutMs || 10000}
                            onChange={(e) => onConfigChange('sessionTimeoutMs', e.target.value)}
                        />
                    </div>
                    <Input
                        label="Max Poll Interval (ms)"
                        type="number"
                        value={config.maxPollIntervalMs || 300000}
                        onChange={(e) => onConfigChange('maxPollIntervalMs', e.target.value)}
                    />
                 </>
             ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                                Acks
                            </label>
                            <select
                                value={config.acks || 'all'}
                                onChange={(e) => onConfigChange('acks', e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue text-sm"
                            >
                                <option value="all">All (Strongest)</option>
                                <option value="1">Leader (Medium)</option>
                                <option value="0">None (Fastest)</option>
                            </select>
                        </div>
                         <Input
                            label="Retries"
                            type="number"
                            value={config.retries || 2147483647}
                            onChange={(e) => onConfigChange('retries', e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <Input
                            label="Batch Size (bytes)"
                            type="number"
                            value={config.batchSize || 16384}
                            onChange={(e) => onConfigChange('batchSize', e.target.value)}
                        />
                         <Input
                            label="Linger (ms)"
                            type="number"
                            value={config.lingerMs || 0}
                            onChange={(e) => onConfigChange('lingerMs', e.target.value)}
                        />
                    </div>
                </>
             )}
             
             <div className="pt-2 border-t border-vercel-light-border dark:border-vercel-dark-border mt-2">
                 <h4 className="text-sm font-medium mb-2">Manually Add Properties</h4>
                 <p className="text-xs text-vercel-light-text-secondary mb-2">Add raw key=value pairs for other configs (e.g., <code>client.id=my-app</code>)</p>
                 <textarea
                     value={config.extraProps || ''}
                     onChange={(e) => onConfigChange('extraProps', e.target.value)}
                     className="w-full h-24 px-3 py-2 font-mono text-xs bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                     placeholder="key=value&#10;another.key=value"
                 />
             </div>
        </div>
      )}
    </div>
  );
};
