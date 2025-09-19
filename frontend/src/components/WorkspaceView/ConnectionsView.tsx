import React, { useEffect, useState } from 'react';
import { Database, Plus, Plug, FolderOpen, MoreVertical, Pencil, Trash } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { SearchInput } from '../common/SearchInput';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { DatabaseConnectionForm } from './DatabaseConnectionForm';
import { FileSystemConnectionForm } from './FileSystemConnectionForm';
import { getConnections, createConnection, updateConnection, deleteConnection, testConnection } from '../../services/api';
import { Loader } from '../common/Loader';
import { useToast } from '../../contexts/ToastContext';

interface ConnectionsViewProps {
  workspaceId: string;
  type?: 'database' | 'filesystem';
}

export const ConnectionsView: React.FC<ConnectionsViewProps> = ({ workspaceId, type = 'database' }) => {
  const { addToast } = useToast();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<any | null>(null);
  const isFilesystem = type === 'filesystem';
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [config, setConfig] = useState<any>({
    name: '',
    connectionMethod: isFilesystem ? 'ssh' : 'native',
    dbType: 'mysql',
    host: 'localhost',
    port: isFilesystem ? 22 : 3306,
    database: '',
    username: '',
    password: '',
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingConnection, setSavingConnection] = useState(false);

  useEffect(() => {
    loadConnections();
  }, [workspaceId, type]);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const data = await getConnections(workspaceId);
      // Filter based on type
      const filtered = data.filter((c: any) => {
          if (type === 'filesystem') {
              return ['ssh', 's3', 'hdfs'].includes(c.connectionMethod);
          } else {
              // Database
              return ['native', 'jdbc', 'mongo'].includes(c.connectionMethod);
          }
      });
      setConnections(filtered);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConnections = connections.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.connectionMethod.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const result = await testConnection(config);
      setTestResult(result);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.response?.data?.error || 'Connection test failed'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveConnection = async () => {
    setSavingConnection(true);
    
    try {
      if (editingConnection) {
        await updateConnection(workspaceId, editingConnection.id, config);
        addToast('success', `${isFilesystem ? 'Mount' : 'Connection'} updated successfully`);
      } else {
        await createConnection(workspaceId, config);
        addToast('success', `${isFilesystem ? 'Mount' : 'Connection'} created successfully`);
      }
      await loadConnections();
      handleCloseModal();
    } catch (error: any) {
      addToast('error', 'Failed to save: ' + (error.response?.data?.error || error.message));
    } finally {
      setSavingConnection(false);
    }
  };

  const handleEditConnection = (connection: any) => {
    setEditingConnection(connection);
    setConfig(connection);
    setIsModalOpen(true);
  };

  const handleNewConnection = () => {
    setEditingConnection(null);
    setConfig({
      name: '',
      connectionMethod: isFilesystem ? 'ssh' : 'native',
      dbType: 'mysql',
      host: 'localhost',
      port: isFilesystem ? 22 : 3306,
      database: '',
      username: '',
      password: '',
    });
    setTestResult(null);
    setIsModalOpen(true);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConnection(null);
    setTestResult(null);
  };

  const handleDeleteClick = (connection: any) => {
      setConnectionToDelete(connection);
      setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!connectionToDelete) return;
    setDeleting(true);
    try {
      await deleteConnection(workspaceId, connectionToDelete.id);
      addToast('success', `${isFilesystem ? 'Mount' : 'Connection'} deleted successfully`);
      await loadConnections();
      setDeleteModalOpen(false);
      setConnectionToDelete(null);
    } catch (error: any) {
      addToast('error', 'Failed to delete: ' + (error.response?.data?.error || error.message));
    } finally {
      setDeleting(false);
    }
  };

  const getConnectionIcon = () => {
    if (isFilesystem) return <FolderOpen size={20} className="text-vercel-accent-blue" />;
    return <Database size={20} className="text-vercel-accent-blue" />;
  };

  const getConnectionMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      native: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      jdbc: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
      mongo: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
      ssh: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      s3: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      hdfs: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[method] || colors.native}`}>
        {method.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader size="md" text="Loading connections..." />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-vercel-light-text dark:text-vercel-dark-text">
            {isFilesystem ? 'File Systems' : 'Database Connections'}
          </h2>
          <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mt-1">
            {isFilesystem ? 'Manage remote file mounts (SSH, S3, HDFS)' : 'Manage reusable database connections for this workspace'}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={`Search ${isFilesystem ? 'mounts' : 'connections'}...`}
                className="w-64"
            />
            <Button variant="primary" onClick={handleNewConnection} icon={<Plus size={16} />}>
            New {isFilesystem ? 'Mount' : 'Connection'}
            </Button>
        </div>
      </div>

      {filteredConnections.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-vercel-dark-surface rounded-lg border border-vercel-light-border dark:border-vercel-dark-border">
           {searchQuery ? (
                 <>
                    <FolderOpen size={48} className="mx-auto text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-vercel-light-text dark:text-vercel-dark-text mb-2">No {isFilesystem ? 'mounts' : 'connections'} found</h3>
                    <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
                        No matches for "{searchQuery}"
                    </p>
                 </>
           ) : (
               <>
                  {isFilesystem ? <FolderOpen size={48} className="mx-auto text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-4" /> : <Database size={48} className="mx-auto text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-4" />}
                  <h3 className="text-lg font-medium text-vercel-light-text dark:text-vercel-dark-text mb-2">
                    No connections yet
                  </h3>
                  <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-4">
                    {isFilesystem ? 'Create your first file system mount to get started' : 'Create your first database connection to get started'}
                  </p>
                  <Button variant="primary" onClick={handleNewConnection} icon={<Plus size={16} />}>
                    Create {isFilesystem ? 'Mount' : 'Connection'}
                  </Button>
               </>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnections.map((connection) => (
            <div
              key={connection.id}
              className="relative p-5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-hover)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 group flex flex-col h-full min-h-[180px]"
            >
              {/* Header: Icon + Name + Badge + Menu */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md">
                    {getConnectionIcon()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)] text-[15px] leading-tight mb-1">
                      {connection.name}
                    </h3>
                    <div className="flex items-center gap-2">
                        {getConnectionMethodBadge(connection.connectionMethod)}
                        {connection.connectionMethod === 'native' && (
                             <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider font-medium">{connection.dbType}</span>
                        )}
                    </div>
                  </div>
                </div>
                
                 {/* Menu Button - Removed for now as we have explicit Edit/Delete buttons */}
              </div>

              {/* Connection Details */}
              <div className="space-y-2 mb-6 flex-1">
                {/* Native / Mongo: Host:Port, DB, User */}
                {(['native', 'mongo'].includes(connection.connectionMethod)) && (
                   <div className="grid grid-cols-1 gap-1.5">
                    {/* Host:Port - Skip for SQLite */}
                    {connection.dbType !== 'sqlite' && (
                        <div className="flex items-center text-[13px]">
                          <span className="w-20 text-[var(--text-tertiary)] font-medium">Host</span> 
                          <span className={`flex-1 truncate font-mono text-xs ${connection.host ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`} title={`${connection.host}:${connection.port}`}>
                              {connection.host ? `${connection.host}${connection.port ? `:${connection.port}` : ''}` : 'pending'}
                          </span>
                        </div>
                    )}
                    
                    {/* Database / Path */}
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">{connection.dbType === 'sqlite' ? 'Path' : ((['oracle', 'service'].includes(connection.dbType) ? 'Service' : 'Database'))}</span> 
                        <span className={`flex-1 truncate ${connection.database ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`} title={connection.database}>
                            {connection.database || 'pending'}
                        </span>
                    </div>

                    {/* Username */}
                    {connection.dbType !== 'sqlite' && (
                        <div className="flex items-center text-[13px]">
                            <span className="w-20 text-[var(--text-tertiary)] font-medium">User</span> 
                            <span className={`flex-1 truncate font-mono text-xs ${connection.username ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`}>
                                {connection.username || 'pending'}
                            </span>
                        </div>
                    )}
                   </div>
                )}

                {/* JDBC: URL, Driver, User */}
                {connection.connectionMethod === 'jdbc' && (
                   <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">JDBC URL</span> 
                        <span className={`flex-1 truncate font-mono text-xs ${connection.jdbcUrl ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`} title={connection.jdbcUrl}>
                            {connection.jdbcUrl || 'pending'}
                        </span>
                    </div>
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">Driver</span> 
                        <span className={`flex-1 truncate font-mono text-xs ${connection.jdbcDriver ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`} title={connection.jdbcDriver}>
                            {connection.jdbcDriver || 'pending'}
                        </span>
                    </div>
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">User</span> 
                        <span className={`flex-1 truncate font-mono text-xs ${connection.username ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`}>
                            {connection.username || 'pending'}
                        </span>
                    </div>
                   </div>
                )}

                {/* SSH: Host:Port, User */}
                {connection.connectionMethod === 'ssh' && (
                   <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">Host</span> 
                        <span className={`flex-1 truncate font-mono text-xs ${connection.host ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`} title={`${connection.host}:${connection.port}`}>
                            {connection.host ? `${connection.host}${connection.port ? `:${connection.port}` : ''}` : 'pending'}
                        </span>
                    </div>
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">User</span> 
                        <span className={`flex-1 truncate font-mono text-xs ${connection.username ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`}>
                            {connection.username || 'pending'}
                        </span>
                    </div>
                   </div>
                )}

                {/* S3: Bucket, Region, Endpoint? */}
                {connection.connectionMethod === 's3' && (
                   <div className="grid grid-cols-1 gap-1.5">
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">Bucket</span> 
                        <span className={`flex-1 truncate ${connection.bucket ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`} title={connection.bucket}>
                            {connection.bucket || 'pending'}
                        </span>
                    </div>
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">Region</span> 
                        <span className={`flex-1 truncate ${connection.region ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`}>
                            {connection.region || 'pending'}
                        </span>
                    </div>
                    {/* Endpoint is optional, show if present or pending? Usually optional means hidden if empty, but per request "if not present the values give in italic pending". Let's show it. */}
                    <div className="flex items-center text-[13px]">
                        <span className="w-20 text-[var(--text-tertiary)] font-medium">Endpoint</span> 
                        <span className={`flex-1 truncate ${connection.endpoint ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] italic'}`} title={connection.endpoint}>
                            {connection.endpoint || 'pending'}
                        </span>
                    </div>
                   </div>
                )}

                {/* HDFS: Host:Port, User */}
                {connection.connectionMethod === 'hdfs' && (
                   <div className="grid grid-cols-1 gap-1.5">
                     <div className="flex items-center text-[13px]">
                         <span className="text-[var(--text-tertiary)] italic">HDFS configuration pending</span>
                     </div>
                   </div>
                )}
              </div>

                <div className="absolute top-4 right-4 z-10">
                   <div className="relative">
                       <button
                           onClick={(e) => {
                               e.stopPropagation();
                               setOpenMenuId(openMenuId === connection.id ? null : connection.id);
                           }}
                           className="p-1.5 hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
                       >
                           <MoreVertical size={16} />
                       </button>

                       {openMenuId === connection.id && (
                           <>
                               <div 
                                   className="fixed inset-0 z-20 cursor-default" 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setOpenMenuId(null);
                                   }} 
                               />
                               <div className="absolute right-0 mt-1 w-36 py-1 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-lg z-30 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                   <button
                                       onClick={(e) => {
                                           e.stopPropagation();
                                           setOpenMenuId(null);
                                           handleEditConnection(connection);
                                       }}
                                       className="w-full text-left px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
                                   >
                                       <Pencil size={14} /> Edit
                                   </button>
                                   <button
                                       onClick={(e) => {
                                           e.stopPropagation();
                                           setOpenMenuId(null);
                                           handleDeleteClick(connection);
                                       }}
                                       className="w-full text-left px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 flex items-center gap-2"
                                   >
                                       <Trash size={14} /> Delete
                                   </button>
                               </div>
                           </>
                       )}
                   </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Connection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingConnection ? 'Edit Connection' : (isFilesystem ? 'New Mount' : 'New Connection')}
        size="xl"
      >
        <div className="space-y-4">
          {isFilesystem ? (
              <FileSystemConnectionForm
                config={config}
                onConfigChange={handleConfigChange}
              />
          ) : (
              <DatabaseConnectionForm
                config={config}
                onConfigChange={handleConfigChange}
              />
          )}

          {/* This part of component remains unchanged... */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">
              💡 Password Variables Supported
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Use context variables (<code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">{'${VAR_NAME}'}</code>), 
              environment variables (<code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">$VAR_NAME</code>), 
              or unix commands (<code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/40 rounded">$(cat /path/to/secret)</code>)
            </p>
          </div>

          <div className="flex gap-2 pt-4 border-t border-vercel-light-border dark:border-vercel-dark-border">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestConnection}
              loading={testingConnection}
              icon={<Plug size={16} />}
              className="flex-1"
            >
              Test Connection
            </Button>
          </div>

          {testResult && (
            <div className={`p-3 rounded-lg ${testResult.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
              <p className="text-sm font-medium">
                {testResult.success ? '✓ ' : '✗ '}
                {testResult.message}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-vercel-light-border dark:border-vercel-dark-border">
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveConnection}
              loading={savingConnection}
            >
              {editingConnection ? 'Update' : 'Create'} {isFilesystem ? 'Mount' : 'Connection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={`Delete ${isFilesystem ? 'Mount' : 'Connection'}`}
        message={
            <p>
                Are you sure you want to delete <span className="font-semibold">{connectionToDelete?.name}</span>? This action cannot be undone.
            </p>
        }
        confirmLabel="Delete"
        processing={deleting}
      />
    </div>
  );
};
