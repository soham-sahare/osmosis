
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, ChevronDown, Activity, FileText } from 'lucide-react';
import { executionService } from '../../services/executionService';
import { Loader } from '../common/Loader';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../../contexts/ToastContext';

// Types
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface Execution {
  id: string;
  jobId: string;
  jobName: string;
  status: 'success' | 'error' | 'failed' | 'running';
  triggerType?: 'MANUAL' | 'SCHEDULED' | 'DEPENDENCY';
  startTime: string;
  endTime?: string;
  logs: LogEntry[];
  message?: string;
}

export const ExecutionHistoryView: React.FC<{ workspaceId: string }> = ({ workspaceId }) => {
  const [selectedLogs, setSelectedLogs] = useState<Execution | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Search & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const data = await executionService.getExecutionsByWorkspace(workspaceId);
      setExecutions(data);
    } catch (error) {
      console.error('Failed to fetch executions:', error);
      addToast('error', 'Failed to load execution history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchExecutions();
      // Optional: Poll for updates every 10 seconds?
      const interval = setInterval(fetchExecutions, 10000);
      return () => clearInterval(interval);
    }
  }, [workspaceId]);

  // Reset page when search or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Filter and Paginate
  const filteredExecutions = executions.filter(exec => 
    exec.jobName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredExecutions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExecutions = filteredExecutions.slice(startIndex, startIndex + itemsPerPage);

  // Format duration helper
  const calculateDuration = (start: string, end?: string) => {
    if (!end) return 'Running...';
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      const diff = endTime - startTime;
      
      if (diff < 1000) return `${diff}ms`;
      if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return `${mins}m ${secs}s`;
    } catch (e) {
      return '-';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      case 'error':
      case 'failed': return <XCircle size={18} className="text-red-500" />;
      case 'running': return <Play size={18} className="text-blue-500 animate-pulse" />;
      default: return null;
    }
  };
  
  const getTriggerBadge = (type?: string) => {
      const triggerType = type || 'MANUAL';
      const styles = triggerType === 'SCHEDULED' 
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          : triggerType === 'DEPENDENCY'
          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
          
      return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${styles}`}>
              {triggerType}
          </span>
      );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-vercel-light-text dark:text-vercel-dark-text flex items-center gap-2">
                <Activity size={20} className="text-vercel-accent-blue" />
                Execution History
            </h2>
            <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mt-1">
                View past job runs and logs
            </p>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary" size={16} />
                  <input 
                      type="text"
                      placeholder="Search by job name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-vercel-accent-blue transition-all text-vercel-light-text dark:text-vercel-dark-text placeholder:text-gray-400"
                  />
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary hidden sm:inline">Rows:</span>
                  <div className="relative">
                      <select 
                          value={itemsPerPage}
                          onChange={(e) => setItemsPerPage(Number(e.target.value))}
                          className="appearance-none pl-3 pr-8 py-1.5 bg-white dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-md text-sm focus:outline-none cursor-pointer text-vercel-light-text dark:text-vercel-dark-text"
                      >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                  </div>
              </div>
          </div>
      </div>

    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-color)]">
          <tr>
            <th className="w-12 px-4 py-3 font-medium text-[var(--text-tertiary)]"></th>
            <th className="px-4 py-3 font-medium text-[var(--text-tertiary)]">Job Name</th>
            <th className="px-4 py-3 font-medium text-[var(--text-tertiary)]">Type</th>
            <th className="px-4 py-3 font-medium text-[var(--text-tertiary)]">Start Time</th>
            <th className="px-4 py-3 font-medium text-[var(--text-tertiary)] text-right">Duration</th>
            <th className="px-4 py-3 font-medium text-[var(--text-tertiary)] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {loading ? (
             <tr>
                 <td colSpan={6} className="text-center py-12">
                     <Loader size="md" text="Loading history..." />
                 </td>
             </tr>
          ) : filteredExecutions.length === 0 ? (
             <tr>
                 <td colSpan={6} className="text-center py-12 text-[var(--text-tertiary)]">
                     {searchQuery ? 'No matching executions found.' : 'No executions found for this workspace.'}
                 </td>
             </tr>
          ) : (
             paginatedExecutions.map((exec) => (
            <tr key={exec.id} className="hover:bg-[var(--bg-hover)] transition-colors h-[44px] group">
              <td className="px-4 py-2">
                <div className="flex items-center justify-center" title={exec.status}>
                    {getStatusIcon(exec.status)}
                </div>
              </td>
              <td className="px-4 py-2 font-medium text-[var(--text-primary)] truncate max-w-[200px]" title={exec.jobName}>
                {exec.jobName}
              </td>
              <td className="px-4 py-2">
                 {getTriggerBadge(exec.triggerType)}
              </td>
              <td className="px-4 py-2 text-[var(--text-tertiary)]">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                        {new Date(exec.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
              </td>
              <td className="px-4 py-2 text-[var(--text-tertiary)] font-mono text-xs text-right">
                {calculateDuration(exec.startTime, exec.endTime)}
              </td>
              <td className="px-4 py-2 text-right">
                <button 
                    onClick={() => navigate(`/workspace/${workspaceId}/execution/${exec.id}?tab=executions`)}
                    className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    title="View Logs"
                >
                    <FileText size={16} />
                </button>
              </td>
            </tr>
          ))
          )}
        </tbody>
      </table>
      </div>
      
      {/* Pagination Footer */}
      {!loading && filteredExecutions.length > 0 && (
          <div className="px-6 py-4 border-t border-vercel-light-border dark:border-vercel-dark-border flex items-center justify-between">
              <span className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredExecutions.length)} of {filteredExecutions.length}
              </span>
              
              <div className="flex items-center gap-2">
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      icon={<ChevronLeft size={16}/>}
                  >
                      Prev
                  </Button>
                  <span className="text-sm font-medium px-2">
                      Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                      Next
                      <ChevronRight size={16}/>
                  </Button>
              </div>
          </div>
      )}

      {/* Logs Modal - Kept just in case, though functionality moved to new page */}
      <Modal 
        isOpen={!!selectedLogs} 
        onClose={() => setSelectedLogs(null)} 
        title={`Logs: ${selectedLogs?.jobName}`}
        size="lg"
      >
        <div className="bg-gray-900 text-gray-200 p-4 rounded-lg font-mono text-xs h-[400px] overflow-y-auto custom-scrollbar">
            {selectedLogs?.logs.map((log, i) => (
                <div key={i} className="mb-1 border-b border-gray-800 pb-1 last:border-0 flex gap-4">
                    <span className="text-gray-500 shrink-0 w-36">{new Date(log.timestamp).toLocaleString()}</span>
                    <span className={`break-all ${log.level === 'error' ? 'text-red-400' : log.level === 'warning' ? 'text-yellow-400' : 'text-blue-300'}`}>
                        [{log.level.toUpperCase()}] {log.message}
                    </span>
                </div>
            ))}
            {(!selectedLogs?.logs || selectedLogs.logs.length === 0) && (
                <div className="text-gray-500 italic text-center mt-4">No logs available</div>
            )}
        </div>
        <div className="flex justify-end pt-4">
             <Button variant="secondary" onClick={() => setSelectedLogs(null)}>Close</Button>
        </div>
      </Modal>
    </div>
    </div>
  );
};

