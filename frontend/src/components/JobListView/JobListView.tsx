import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, ArrowLeft, Play, Upload, MoreVertical, Edit, Trash2, Clock, Layers } from 'lucide-react'; // Removed Search
import { useJobStore } from '../../store/jobStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Button } from '../common/Button';
import { ResourceFormModal } from '../common/ResourceFormModal';
import { ScheduleModal } from '../WorkspaceView/ScheduleModal';
import { EditJobModal } from '../WorkspaceView/EditJobModal';
import { SearchInput } from '../common/SearchInput'; // Added
import { ConfirmDialog } from '../common/ConfirmDialog'; // Added

import { Download, CheckSquare, Square } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { APP_CONSTANTS } from '../../constants/app';
import { useCrudState } from '../../hooks/useCrudState';
import { useFileImport } from '../../hooks/useFileImport';
import type { Job } from '../../types/job';
import { useViewMode } from '../../hooks/useViewMode';
import { LayoutGrid, List } from 'lucide-react';
import { formatDate } from '../../utils/date';
import { MissingDependenciesModal } from './MissingDependenciesModal'; // Added

interface JobListViewProps {
  workspaceId?: string;
  hideHeader?: boolean;
}

export const JobListView: React.FC<JobListViewProps> = ({ workspaceId: propWorkspaceId, hideHeader = false }) => {
  const params = useParams<{ workspaceId: string }>();
  // Use prop if available, otherwise fall back to params
  const workspaceId = propWorkspaceId || params.workspaceId;
  
  const navigate = useNavigate();
  const { jobs, loading, fetchJobsByWorkspace, createJob, importJob, updateJob, deleteJob, setCurrentJob, bulkDeleteJobs, bulkExportJobs, exportJob, exportJobRecursive } = useJobStore();
  const { currentWorkspace, setCurrentWorkspace, workspaces, exportWorkspace } = useWorkspaceStore();
  const { addToast } = useToast();
  
  const [creating, setCreating] = useState(false);
  const [scheduleJobId, setScheduleJobId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [importWarning, setImportWarning] = useState<{ job: Job; missing: string[] } | null>(null); // Added
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Reusable CRUD State
  const crud = useCrudState<Job>();
  const { mode, toggleMode } = useViewMode('jobs');

  // ... (Keep existing useEffects and handlers)
  // Initialize Workspace
  useEffect(() => {
    if (workspaceId) {
      fetchJobsByWorkspace(workspaceId);
      // Only set current workspace if we don't have it or it doesn't match
      if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
         const workspace = workspaces.find(w => w.id === workspaceId);
         if (workspace) setCurrentWorkspace(workspace);
      }
    }
  }, [workspaceId, workspaces]);

  // Handle Create Job
  const handleCreateJob = async (name: string, description: string) => {
    if (!workspaceId) return;
    
    // Duplicate Check
    const isDuplicate = jobs.some(job => job.name.toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) {
      addToast('error', APP_CONSTANTS.TOAST_MESSAGES.JOB.DUPLICATE_NAME(name));
      return;
    }

    setCreating(true);
    try {
      await createJob(workspaceId, name, description);
      addToast('success', APP_CONSTANTS.TOAST_MESSAGES.JOB.CREATE_SUCCESS);
      crud.setCreateOpen(false);
    } catch (error: any) {
      console.error('Failed to create job:', error);
      addToast('error', error.message || APP_CONSTANTS.TOAST_MESSAGES.JOB.CREATE_ERROR);
    } finally {
      setCreating(false);
    }
  };

  // Handle Import Job
  const { importing, fileInputRef, handleImportClick, handleFileChange } = useFileImport<Job>({
    onImport: async (file) => importJob(file, workspaceId!),
    validateContent: (data) => {
      // Check if job name duplicates existing job
      if (data.name && jobs.some(j => j.name.toLowerCase() === data.name.trim().toLowerCase())) {
        return APP_CONSTANTS.TOAST_MESSAGES.JOB.DUPLICATE_NAME(data.name);
      }
      return null;
    },
    onSuccess: async (job) => {
        if (workspaceId) {
            await fetchJobsByWorkspace(workspaceId);
        }
        if (job && job.missingDependencies && job.missingDependencies.length > 0) {

            setImportWarning({ job, missing: job.missingDependencies });
        }
    }
  });

  const openEdit = (job: Job) => {
      crud.prepareEdit(job);
  };

  const submitEdit = async (name: string, description: string) => {
      if (!crud.actionItem) return;
      crud.setProcessing(true);
      try {
          await updateJob(crud.actionItem.id, { name, description });
          addToast('success', APP_CONSTANTS.TOAST_MESSAGES.JOB.UPDATE_SUCCESS);
          crud.setEditOpen(false);
      } catch (error: any) {
          addToast('error', error.message || APP_CONSTANTS.TOAST_MESSAGES.JOB.UPDATE_ERROR);
      } finally {
          crud.setProcessing(false);
      }
  };

  // Handle Delete Job
  const submitDelete = async () => {
      if (!crud.actionItem) return;
      crud.setProcessing(true);
      try {
          await deleteJob(crud.actionItem.id);
          addToast('success', APP_CONSTANTS.TOAST_MESSAGES.JOB.DELETE_SUCCESS);
          crud.setDeleteOpen(false);
      } catch (error: any) {
          addToast('error', error.message || APP_CONSTANTS.TOAST_MESSAGES.JOB.DELETE_ERROR);
      } finally {
          crud.setProcessing(false);
      }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (crud.menuOpenId) crud.closeMenu();
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [crud.menuOpenId, crud]);

  const handleJobClick = (e: React.MouseEvent, jobId: string) => {
    if ((e.target as HTMLElement).closest('.job-menu-btn')) return;
    navigate(`/job/${jobId}`);
  };

  const handleScheduleClick = (job: Job) => {
      crud.closeMenu();
      setCurrentJob(job);
      setScheduleJobId(job.id);
  };

  const filteredJobs = jobs.filter(job => 
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Bulk Actions
  const toggleSelection = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSelection = new Set(selectedJobIds);
      if (newSelection.has(id)) {
          newSelection.delete(id);
      } else {
          newSelection.add(id);
      }
      setSelectedJobIds(newSelection);
  };

  const selectAll = () => {
      if (selectedJobIds.size === filteredJobs.length) {
          setSelectedJobIds(new Set());
      } else {
          setSelectedJobIds(new Set(filteredJobs.map(j => j.id)));
      }
  };

  const handleBulkDelete = async () => {
      try {
          await bulkDeleteJobs(Array.from(selectedJobIds));
          addToast('success', `Deleted ${selectedJobIds.size} jobs`);
          setSelectedJobIds(new Set());
          setBulkDeleteOpen(false);
      } catch (error: any) {
          addToast('error', 'Failed to delete selected jobs');
      }
  };

  const handleBulkExport = async () => {
      try {
          await bulkExportJobs(Array.from(selectedJobIds));
          addToast('success', 'Export started');
          setSelectedJobIds(new Set());
      } catch (error: any) {
          addToast('error', 'Failed to export jobs');
      }
  };
  
  const handleWorkspaceExport = async () => {
      if (!currentWorkspace) return;
      try {
          await exportWorkspace(currentWorkspace.id);
          addToast('success', 'Workspace export started');
      } catch (error: any) {
          addToast('error', 'Failed to export workspace');
      }
  };

  return (
    <div className={hideHeader ? "" : "min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg"}>
      {/* Header - Only show if not hidden */}
      {!hideHeader && (
        <header className="border-b border-vercel-light-border dark:border-vercel-dark-border bg-white dark:bg-vercel-dark-surface">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center gap-4 mb-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')} icon={<ArrowLeft size={18} />}>
                Back
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-vercel-light-text dark:text-vercel-dark-text">
                  {currentWorkspace?.name || 'Workspace'}
                </h1>
                <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mt-0.5">
                  {currentWorkspace?.description || 'Manage your ETL jobs'}
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept={APP_CONSTANTS.FILE_EXTENSIONS.IMPORT_ACCEPT}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleImportClick}
                  icon={<Upload size={18} />}
                  disabled={importing}
                  loading={importing}
                >
                  Import Job
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => crud.setCreateOpen(true)}
                  icon={<Plus size={18} />}
                >
                  New Job
                </Button>
                <div className="h-6 w-px bg-[var(--border-color)] mx-1"></div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleWorkspaceExport}
                    icon={<Download size={18} />}
                    title="Export Workspace"
                >
                    Export
                </Button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={hideHeader ? "" : "max-w-7xl mx-auto px-6 py-8"}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
                <h2 className="text-xl font-semibold text-vercel-light-text dark:text-vercel-dark-text">Jobs</h2>
                <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mt-1">
                    Select a job to open the canvas editor
                </p>
            </div>

          </div>


          <div className="flex items-center gap-3">
             {/* Bulk Selection Checkbox (Moved from Header) */}
             {filteredJobs.length > 0 && (
                <div className="flex items-center gap-2 mr-1 px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    <button 
                        onClick={selectAll}
                        className={`flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${selectedJobIds.size > 0 ? 'text-[var(--accent-blue)]' : 'text-[var(--text-secondary)]'} hover:text-[var(--text-primary)] transition-colors`}
                    >
                        {selectedJobIds.size === filteredJobs.length && filteredJobs.length > 0 ? <CheckSquare size={16} /> : <Square size={16} />}
                        <span>{selectedJobIds.size > 0 ? `${selectedJobIds.size} Selected` : 'Select All'}</span>
                    </button>
                    {selectedJobIds.size > 0 && (
                        <>
                            <div className="w-px h-4 bg-[var(--border-color)] mx-1"></div>
                            <button onClick={handleBulkExport} className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Export Selected">
                                <Download size={16} />
                            </button>
                            <button onClick={() => setBulkDeleteOpen(true)} className="p-1 hover:bg-red-500/10 rounded text-[var(--text-secondary)] hover:text-red-500" title="Delete Selected">
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                </div>
             )}

             {/* Search Bar */}
             <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search jobs..."
                className="w-[300px]"
             />
             
             <div className="flex border border-[var(--border-color)] rounded-md overflow-hidden">
                <button
                    onClick={() => mode !== 'grid' && toggleMode()}
                    className={`p-1.5 ${mode === 'grid' ? 'bg-[var(--bg-hover)] text-[var(--accent-blue)]' : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'} transition-colors`}
                    title="Grid View"
                >
                    <LayoutGrid size={18} />
                </button>
                <div className="w-px bg-[var(--border-color)]" />
                <button
                    onClick={() => mode !== 'list' && toggleMode()}
                    className={`p-1.5 ${mode === 'list' ? 'bg-[var(--bg-hover)] text-[var(--accent-blue)]' : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'} transition-colors`}
                    title="List View"
                >
                    <List size={18} />
                </button>
            </div>

             {/* If header is hidden, show action buttons here */}
             {hideHeader && (
                <>
                    <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept={APP_CONSTANTS.FILE_EXTENSIONS.IMPORT_ACCEPT}
                    />
                    <button
                        onClick={handleImportClick}
                        disabled={importing}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border-color)] hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {importing ? <span className="animate-spin">⟳</span> : <Upload size={16} />}
                        Import
                    </button>
                    <Button
                    variant="primary"
                    size="sm"
                    onClick={() => crud.setCreateOpen(true)}
                    icon={<Plus size={16} />}
                    >
                    New Job
                    </Button>
                </>
             )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-40 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse p-4">
                      <div className="flex justify-between items-start mb-4">
                          <div className="w-8 h-8 bg-[var(--bg-hover)] rounded"></div>
                          <div className="w-20 h-6 bg-[var(--bg-hover)] rounded-full"></div>
                      </div>
                      <div className="h-6 w-3/4 bg-[var(--bg-hover)] rounded mb-2"></div>
                      <div className="h-4 w-1/2 bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)]"></div>
                  </div>
              ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20">
            {searchQuery ? (
                 <>
                    {/* Fallback to generic icon if search icon import removed, or use something else */}
                    <div className="mx-auto text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-4 opacity-50 flex justify-center">
                        <FileText size={64} />
                    </div>
                    <h3 className="text-lg font-medium text-vercel-light-text dark:text-vercel-dark-text mb-2">No jobs found</h3>
                    <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
                        No jobs match your search for "{searchQuery}"
                    </p>
                 </>
            ) : (
                <>
                    <FileText size={64} className="mx-auto text-[var(--text-tertiary)] mb-4" />
                    <h3 className="text-lg font-medium text-vercel-light-text dark:text-vercel-dark-text mb-2">No jobs yet</h3>
                    <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-6">
                    Create your first job to start building pipelines
                    </p>
                    <Button variant="primary" size="md" onClick={() => crud.setCreateOpen(true)} icon={<Plus size={18} />}>
                    Create Job
                    </Button>
                </>
            )}
          </div>
        ) : mode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={(e) => handleJobClick(e, job.id)}
                className="relative p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-hover)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer group flex flex-col h-full max-w-[400px]"
              >
                {/* Header Section */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                       <button
                           onClick={(e) => toggleSelection(e, job.id)}
                           className={`p-1.5 rounded-md border transition-colors ${selectedJobIds.has(job.id) ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-transparent hover:border-[var(--text-secondary)]'}`}
                       >
                           <CheckSquare size={16} fill="currentColor" className={selectedJobIds.has(job.id) ? "opacity-100" : "opacity-0"} />
                       </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {/* Status Badge */}
                        {job.schedule && (
                             <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[11px] font-medium border border-emerald-500/20">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                 Scheduled
                             </div>
                        )}
                        
                        {/* More Menu - Always visible */}
                        <div className="transition-opacity">
                            <button
                              onClick={(e) => crud.toggleMenu(e, job.id)}
                              className="job-menu-btn p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* More Menu Dropdown */}
                {crud.menuOpenId === job.id && (
                  <div 
                    className="absolute top-10 right-4 w-52 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.15)] z-20 p-1.5 animate-in fade-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(job); }}
                      className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Edit size={16} className="text-[var(--text-tertiary)]" /> 
                      <span className="font-medium">Edit Configuration</span>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleScheduleClick(job); }}
                      className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Clock size={16} className="text-[var(--text-tertiary)]" /> 
                      <span className="font-medium">Schedule Job</span>
                    </button>
                    <button
                      onClick={async (e) => { 
                          e.stopPropagation(); 
                          try {
                              await exportJob(job.id, `${job.name}.osmosis`);
                              addToast('success', 'Export started');
                          } catch(e) { addToast('error', 'Export failed'); }
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Download size={16} className="text-[var(--text-tertiary)]" /> 
                      <span className="font-medium">Export Job</span>
                    </button>
                    <button
                      onClick={async (e) => { 
                          e.stopPropagation(); 
                          try {
                              await exportJobRecursive(job.id, `${job.name}_bundle.osmosis`);
                              addToast('success', 'Recursive export started');
                          } catch(e) { addToast('error', 'Export failed'); }
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Layers size={16} className="text-[var(--text-tertiary)]" /> 
                      <span className="font-medium">Export with Deps</span>
                    </button>
                    <div className="h-px bg-[var(--border-color)] my-1.5 mx-1"></div>
                    <button
                      onClick={(e) => { e.stopPropagation(); crud.prepareDelete(job); }}
                      className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                    >
                      <Trash2 size={16} /> 
                      <span className="font-medium">Delete Job</span>
                    </button>
                  </div>
                )}

                {/* Main Content */}
                <div className="mb-auto">
                    <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-1 truncate group-hover:text-[var(--accent-blue)] transition-colors">
                      {job.name}
                    </h3>
                    {/* Description - Fixed Height */}
                    <div className="h-10">
                        {job.description ? (
                            <p className="text-[14px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                              {job.description}
                            </p>
                        ) : (
                            <p className="text-[14px] text-[var(--text-tertiary)] italic">No description</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-[var(--border-color)]">
                    <div className="flex items-center gap-4 text-[13px] text-[var(--text-tertiary)]">
                        {/* Timestamp */}
                        <div className="flex items-center gap-1.5">
                            <Calendar size={13} strokeWidth={2} />
                            {new Date(job.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })} • {new Date(job.updatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })}
                        </div>
                    </div>
                    
                    {/* Component Count */}
                    <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors">
                        <Play size={10} fill="currentColor" />
                        <span>{job.canvasState?.nodes?.length || 0} {job.canvasState?.nodes?.length === 1 ? 'component' : 'components'}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
             {filteredJobs.map((job, index) => (
                <div 
                    key={job.id}
                    onClick={(e) => handleJobClick(e, job.id)}
                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group ${index !== filteredJobs.length - 1 ? 'border-b border-[var(--border-color)]' : ''}`}
                >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button
                           onClick={(e) => toggleSelection(e, job.id)}
                           className={`p-1.5 rounded-md border transition-colors ${selectedJobIds.has(job.id) ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white' : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-transparent hover:border-[var(--text-secondary)]'}`}
                       >
                           <CheckSquare size={16} fill="currentColor" className={selectedJobIds.has(job.id) ? "opacity-100" : "opacity-0"} />
                       </button>
                        <div className="min-w-0 flex-1">
                             <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                                    {job.name}
                                </h3>
                                {job.schedule && (
                                     <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[9px] font-medium border border-emerald-500/20">
                                         <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                                         Scheduled
                                     </div>
                                )}
                             </div>
                             {job.description && (
                                 <p className="text-xs text-[var(--text-secondary)] truncate">
                                     {job.description}
                                 </p>
                             )}
                        </div>
                    </div>
                    
                    {/* Right Side Actions */}
                    <div className="flex items-center gap-6">
                         {/* Nodes Meta */}
                         <div className="hidden md:flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] w-20 whitespace-nowrap">
                            <Play size={10} fill="currentColor" />
                            {job.canvasState?.nodes?.length || 0} nodes
                         </div>

                         {/* Date */}
                         <div className="text-xs text-[var(--text-tertiary)] whitespace-nowrap hidden md:flex items-center gap-1.5 min-w-[140px] justify-end">
                            <Calendar size={13} />
                            {formatDate(job.updatedAt)}
                         </div>

                         {/* Menu */}
                         <div className="flex items-center gap-2 relative">
                            <button
                              onClick={(e) => crud.toggleMenu(e, job.id)}
                              className="job-menu-btn p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {/* Dropdown for List View */}
                            {crud.menuOpenId === job.id && (
                              <div 
                                className="absolute top-8 right-0 w-52 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-lg shadow-xl z-20 p-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEdit(job); }}
                                  className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                  <Edit size={16} className="text-[var(--text-tertiary)]" /> Edit
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleScheduleClick(job); }}
                                  className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                  <Clock size={16} className="text-[var(--text-tertiary)]" /> Schedule
                                </button>
                                <button
                                  onClick={async (e) => { 
                                      e.stopPropagation(); 
                                      try {
                                          await exportJob(job.id, `${job.name}.osmosis`);
                                          addToast('success', 'Export started');
                                      } catch(e) { addToast('error', 'Export failed'); }
                                  }}
                                  className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                  <Download size={16} className="text-[var(--text-tertiary)]" /> Export
                                </button>
                                <div className="h-px bg-[var(--border-color)] my-1.5 mx-1"></div>
                                <button
                                  onClick={(e) => { e.stopPropagation(); crud.prepareDelete(job); }}
                                  className="w-full text-left px-3 py-2.5 text-sm flex items-center gap-3 rounded-md hover:bg-red-500/10 text-red-500 transition-colors"
                                >
                                  <Trash2 size={16} /> Delete
                                </button>
                              </div>
                            )}
                        </div>
                    </div>
                </div>
             ))}
          </div>
        )}
      </main>

      {/* Create Job Modal */}
      <ResourceFormModal
        isOpen={crud.isCreateOpen}
        onClose={() => crud.setCreateOpen(false)}
        onSubmit={handleCreateJob}
        title="Create New Job"
        confirmLabel="Create"
        processing={creating}
      />

      {/* Edit Job Modal */}
      <EditJobModal
        isOpen={crud.isEditOpen}
        onClose={() => crud.setEditOpen(false)}
        onSubmit={submitEdit}
        initialName={crud.actionItem?.name}
        initialDescription={crud.actionItem?.description}
        processing={crud.processing}
      />

      {/* Scheduler Modal */}
      {scheduleJobId && jobs.find(j => j.id === scheduleJobId) && (
        <ScheduleModal 
          isOpen={!!scheduleJobId}
          onClose={() => setScheduleJobId(null)}
          onSave={async (schedule, dependencies) => {
             // Wrapper to handle save
             try {
                await updateJob(scheduleJobId, { schedule, dependencies });
                addToast('success', 'Job scheduled successfully');
             } catch (err) {
                 console.error('Failed to schedule', err);
                 addToast('error', 'Failed to update schedule');
             }
          }}
          initialSchedule={jobs.find(j => j.id === scheduleJobId)?.schedule || null}
          initialDependencies={jobs.find(j => j.id === scheduleJobId)?.dependencies || []}
          jobName={jobs.find(j => j.id === scheduleJobId)?.name || 'Job'}
          jobId={scheduleJobId || ''}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={crud.isDeleteOpen}
        onClose={() => crud.setDeleteOpen(false)}
        onConfirm={submitDelete}
        title="Delete Job"
        message={
            <p>
                Are you sure you want to delete <span className="font-semibold">{crud.actionItem?.name}</span>? This action cannot be undone.
            </p>
        }
        confirmLabel="Delete"
        processing={crud.processing}
      />
      
      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedJobIds.size} Jobs`}
        message={
            <p>
                Are you sure you want to delete <strong>{selectedJobIds.size}</strong> selected jobs? This action cannot be undone.
            </p>
        }
        confirmLabel="Delete All"
        processing={false}
      />
      
      {/* Missing Dependencies Warning Modal */}
      {importWarning && (
          <MissingDependenciesModal 
              isOpen={!!importWarning}
              onClose={() => {
                  // Default close behavior: Keep as is? Or force choice?
                  // Let's assume close = Keep as is (least destructive)
                  setImportWarning(null);
              }}
              jobName={importWarning.job.name}
              missingDependencies={importWarning.missing}
              onKeep={() => {
                  setImportWarning(null);
                  addToast('success', 'Job imported with partial dependencies.');
              }}
              onRemoveDependencies={async () => {
                  try {
                      await updateJob(importWarning.job.id, { dependencies: [] });
                      setImportWarning(null);
                      addToast('success', 'Job imported and dependencies removed.');
                  } catch (e:any) {
                      addToast('error', 'Failed to remove dependencies');
                  }
              }}
              onCancelImport={async () => {
                  try {
                      await deleteJob(importWarning.job.id);
                      setImportWarning(null);
                      addToast('info', 'Import cancelled.');
                  } catch (e:any) {
                      addToast('error', 'Failed to delete imported job');
                  }
              }}
          />
      )}
    </div>
  );
};
