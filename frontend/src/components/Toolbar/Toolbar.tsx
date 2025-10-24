import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Undo2, Redo2, Play, Download, Moon, Sun, Calendar, Save } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useToast } from '../../contexts/ToastContext';
import { useThemeStore } from '../../store/themeStore';
import { useJobStore } from '../../store/jobStore';
import { useExecutionStore } from '../../store/executionStore';
import { executionService } from '../../services/executionService';
import { Button } from '../common/Button';
import { ScheduleModal } from '../WorkspaceView/ScheduleModal';

interface ToolbarProps {
  jobId: string;
  jobName: string;
  onSave?: () => void;
}

import { ExportModal } from './ExportModal'; // Added

interface ToolbarProps {
  jobId: string;
  jobName: string;
  onSave?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ jobId, jobName, onSave }) => {
  const navigate = useNavigate();
  const { undo, redo, canUndo, canRedo, isSaving, lastSaved } = useCanvasStore();
  const { theme, toggleTheme } = useThemeStore();
  const { exportJob, exportJobRecursive, currentJob, updateJob } = useJobStore(); // Added exportJobRecursive
  const { addToast } = useToast();
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  
  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportDependencyNames, setExportDependencyNames] = useState<string[]>([]);

  const handleUndo = () => {
    if (canUndo()) undo();
  };

  const handleRedo = () => {
    if (canRedo()) redo();
  };

  const { setIsExecuting, addLog, clearLogs } = useExecutionStore();
  const [localIsExecuting, setLocalIsExecuting] = useState(false);

  const handleRun = async () => {
    setLocalIsExecuting(true);
    setIsExecuting(true);
    clearLogs();
    addLog(`Starting execution for job: ${jobName}...`);
    
    try {
      const startTime = Date.now();
      const result = await executionService.executeJob(jobId);
      if (result.logs && Array.isArray(result.logs)) {
        result.logs.forEach((log: any) => {
          if (typeof log === 'object') {
             const timestamp = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';
             const level = log.level ? log.level.toUpperCase() : 'INFO';
             addLog(`[${timestamp}] ${level}: ${log.message}`);
          } else {
             addLog(String(log));
          }
        });
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      addLog(`Execution completed in ${duration}s`);
      addLog(`Status: ${result.status}`);

      if (result.error) {
         addLog(`Error: ${result.error}`);
      } else if (!result.logs) {
        // Fallback if no logs
        addLog(JSON.stringify(result, null, 2));
      }

    } catch (error: any) {
      addLog(`Execution failed: ${error.message || 'Unknown error'}`);
      console.error('Execution failed:', error);
    } finally {
      setLocalIsExecuting(false);
      setIsExecuting(false);
    }
  };

  const handleExportClick = () => {
      const deps = currentJob?.dependencies || [];
      if (deps.length > 0) {
          // Resolve names
          // We can try to find them in the workspace list logic or just show IDs
          // Assuming workspace jobs are loaded in store usually?
          // If not, we fall back to IDs.
          // Note: WorkspaceListView fetches them, but we are in CanvasView. 
          // CanvasView fetches workspace if missing. 
          // But does it fetch ALL jobs of workspace? Not necessarily.
          // Let's rely on what we have.
          
          // Actually, let's just use IDs if names unavailable, or try to find in workspaces store if populated.
          // We can access 'jobs' from a store if available? 
          // 'useJobStore' has 'jobs' list if 'fetchJobsByWorkspace' was called.
          // Let's assume we might need to export directly if no deps.
          
          // For now, let's just set the IDs or names we know.
          // Better: If we really want names, we might need to fetch them.
          // Or just show "Job <ID>"
          
          // Let's try to map if useJobStore().jobs is populated.
          // Actually useJobStore exposes 'jobs' array?
          // Checking jobStore.ts... it has 'jobs: Job[]'.
          
          const jobs = useJobStore.getState().jobs;
          const names = deps.map(dId => {
              const j = jobs.find(j => j.id === dId);
              return j ? j.name : `Job ${dId.substring(0, 8)}...`;
          });
          
          setExportDependencyNames(names);
          setIsExportModalOpen(true);
      } else {
          // Direct Standard Export
          performExportSingle();
      }
  };

  const performExportSingle = async () => {
    try {
      setIsExportModalOpen(false);
      await exportJob(jobId, `${jobName}.osmosis`);
      addToast('success', 'Job exported successfully');
    } catch (error: any) {
      console.error('Export failed:', error);
      addToast('error', error.message || 'Failed to export job');
    }
  };
  
  const performExportRecursive = async () => {
      try {
          setIsExportModalOpen(false);
          // Export as bundle with same extension or specific? User said ".osmosis".
          // It's still a JSON file, just with different structure (type='recursive_job_export').
          await exportJobRecursive(jobId, `${jobName}_bundle.osmosis`);
          addToast('success', 'Job bundle exported successfully');
      } catch (error: any) {
          console.error('Export recursive failed:', error);
          addToast('error', error.message || 'Failed to export bundle');
      }
  };

  const handleSaveSchedule = async (schedule: string | null, dependencies?: string[]) => {
      try {
          await updateJob(jobId, { 
              schedule: schedule, 
              dependencies 
          });
          addToast('success', 'Schedule updated successfully');
      } catch (error) {
          console.error('Failed to update schedule:', error);
          addToast('error', 'Failed to update schedule');
      }
  };

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getSaveStatus = () => {
    if (!isOnline) return 'Offline';
    if (isSaving) return 'Saving...';
    if (lastSaved) {
      const seconds = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      if (seconds < 60) return 'Saved just now';
      return `Saved ${Math.floor(seconds / 60)}m ago`;
    }
    return 'Not saved';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (isSaving) return 'bg-yellow-500';
    if (lastSaved) return 'bg-green-500';
    return 'bg-gray-300';
  };

  return (
    <div className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-primary)] flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft size={18} />}
        >
            Back
        </Button>
        
        <div className="h-6 w-px bg-[var(--border-color)]" />
        
        <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
            {jobName}
            </h1>
            <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
            <p className="text-xs text-[var(--text-secondary)]">
                {getSaveStatus()}
            </p>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo()}
            icon={<Undo2 size={16} />}
            title="Undo (Ctrl+Z)"
        />
        <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo()}
            icon={<Redo2 size={16} />}
            title="Redo (Ctrl+Y)"
        />
        
        <div className="h-6 w-px bg-[var(--border-color)]" />

        <button
            onClick={() => setIsSchedulerOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)] hover:opacity-80"
            title="Schedule & Dependencies"
        >
            <Calendar size={16} />
            Schedule
        </button>

        <button
            onClick={handleExportClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)] hover:opacity-80"
            title="Export Job"
        >
            <Download size={16} />
            Export Job
        </button>
        
        <div className="h-6 w-px bg-[var(--border-color)]" />
        
        <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            title="Toggle Theme"
        />
        
        <div className="h-6 w-px bg-[var(--border-color)]" />
        
        <Button
            variant="secondary"
            size="sm"
            onClick={onSave}
            disabled={isSaving || !onSave}
            loading={isSaving}
            icon={<Save size={16} />}
            title="Save manually"
        >
            Save
        </Button>
        
        <Button
            variant="primary"
            size="sm"
            onClick={handleRun}
            loading={localIsExecuting}
            icon={<Play size={16} />}
        >
            Run
        </Button>
      </div>

      <ScheduleModal 
        isOpen={isSchedulerOpen} 
        onClose={() => setIsSchedulerOpen(false)} 
        onSave={handleSaveSchedule}
        initialSchedule={currentJob?.schedule || null}
        initialDependencies={currentJob?.dependencies}
        jobName={currentJob?.name || jobName}
        jobId={jobId} 
      />
      
      <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          jobName={jobName}
          dependencyNames={exportDependencyNames}
          onExportSingle={performExportSingle}
          onExportRecursive={performExportRecursive}
      />
    </div>
  );
};
