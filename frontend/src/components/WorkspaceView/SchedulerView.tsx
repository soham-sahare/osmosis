import { formatDateOnly, formatTimeOnly } from '../../utils/date';
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, Clock, Plus, Play } from 'lucide-react';
import { useJobStore } from '../../store/jobStore';
import { jobService } from '../../services/jobService';
import { executionService } from '../../services/executionService';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { ScheduleModal } from './ScheduleModal';
import { Modal } from '../common/Modal';
import { useToast } from '../../contexts/ToastContext';
import type { Job } from '../../types/job';
import { DayTimeline } from './DayTimeline';

interface SchedulerViewProps {
  workspaceId: string;
}

interface UpcomingRun {
  jobId: string;
  jobName: string;
  timestamp: string;
  cron: string;
}

export const SchedulerView: React.FC<SchedulerViewProps> = ({ workspaceId }) => {
  const { jobs, fetchJobsByWorkspace, updateJob, loading: jobsLoading } = useJobStore();
  const [upcomingRuns, setUpcomingRuns] = useState<UpcomingRun[]>([]);
  const [loadingRuns, setLoadingRuns] = useState(false);
  
  // State for Calendar
  const [currentDate, setCurrentDate] = useState(new Date()); // Tracks the month being viewed
  const [selectedDate, setSelectedDate] = useState<Date>(new Date()); // Tracks the selected day
  const [searchQuery, setSearchQuery] = useState('');
  
  // New State for Day View
  const [dayViewOpen, setDayViewOpen] = useState(false);

  // Modal State
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchJobsByWorkspace(workspaceId);
  }, [workspaceId]);

  // Fetch upcoming runs when month changes
  useEffect(() => {
    fetchMonthlyRuns();
  }, [workspaceId, currentMonthString()]);

  function currentMonthString() {
      return `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
  }

  const fetchMonthlyRuns = async () => {
      try {
          setLoadingRuns(true);
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          
          // Get start and end of month
          const start = new Date(year, month, 1).toISOString();
          const end = new Date(year, month + 1, 0).toISOString();
          
          const runs = await jobService.getUpcomingRuns(workspaceId, start, end);
          setUpcomingRuns(runs);
      } catch (error) {
          console.error("Failed to fetch runs", error);
          // addToast('error', 'Failed to load upcoming schedules');
      } finally {
          setLoadingRuns(false);
      }
  };

  // --- Calendar Logic ---
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0-6 (Sun-Sat)
  
  const calendarDays = useMemo(() => {
      const days = [];
      // Fill empty slots for previous month days
      for (let i = 0; i < firstDayOfMonth; i++) {
          days.push(null);
      }
      // Fill days
      for (let i = 1; i <= daysInMonth; i++) {
          days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
      }
      // Fill remaining slots to complete 6 rows (42 days)
      const remainingSlots = 42 - days.length;
      for (let i = 0; i < remainingSlots; i++) {
        days.push(null);
      }
      return days;
  }, [currentDate, daysInMonth, firstDayOfMonth]);

  const changeMonth = (delta: number) => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
      // Reset selected date to first of new month or keep? keeping feels better if valid, else clamp
      // For now, simpler to just let user re-select or default to "today" if in view? 
      // Let's not auto-select to avoid confusion, or select the 1st.
      setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };
  
  // --- Filtering ---
  const filteredRuns = useMemo(() => {
      if (!searchQuery) return upcomingRuns;
      return upcomingRuns.filter(run => run.jobName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [upcomingRuns, searchQuery]);
  
  // Get runs for specific date
  const getRunsForDate = (date: Date) => {
      const dateStr = date.toDateString(); // "Mon Jan 01 2024" - good enough for day comparison
      return filteredRuns.filter(run => new Date(run.timestamp).toDateString() === dateStr);
  };
  
  const runsOnSelectedDate = selectedDate ? getRunsForDate(selectedDate) : [];

  // --- Handlers ---
  const handleOpenSchedule = (job: Job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleSaveSchedule = async (schedule: string | null, dependencies?: string[]) => {
    if (!selectedJob) return;
    try {
      await updateJob(selectedJob.id, { schedule: schedule, dependencies: dependencies || [] });
      addToast('success', 'Job configuration updated successfully');
      fetchJobsByWorkspace(workspaceId); 
      fetchMonthlyRuns(); // Refresh calendar
    } catch (error) {
      console.error('Failed to update config:', error);
      addToast('error', 'Failed to update configuration');
    }
  };

  // Handler for opening day view
  const handleDateDoubleClick = (date: Date) => {
    setSelectedDate(date);
    setDayViewOpen(true);
  };
  
  // Simplified "Add Schedule" for unscheduled jobs (just picks the first unscheduled one or opens a picker?)
  // For now, let's just show a list of jobs to pick from if "Plus" is clicked?
  // Or just rely on the list in the side panel.

  if (jobsLoading && jobs.length === 0) {
    return <Loader size="lg" text="Loading scheduler..." />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-240px)] animate-in fade-in zoom-in-95 duration-200">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-vercel-light-text dark:text-vercel-dark-text flex items-center gap-2">
             <CalendarIcon className="text-vercel-accent-blue" />
             Scheduler
          </h2>
          
          <div className="flex items-center gap-3">
              <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary" size={16} />
                  <input 
                      type="text"
                      placeholder="Search jobs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-vercel-accent-blue transition-all text-vercel-light-text dark:text-vercel-dark-text placeholder:text-gray-400"
                  />
              </div>
          </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
          
          {/* Main Calendar Section */}
          <div className="flex-1 flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
              
              {/* Calendar Header */}
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface)]">
                  <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold text-[var(--text-primary)] min-w-[150px]">
                          {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/New_York' })}
                      </h3>
                      <div className="flex items-center bg-[var(--bg-secondary)] rounded-md border border-[var(--border-color)] p-0.5">
                          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                              <ChevronLeft size={16} />
                          </button>
                          <div className="w-px h-4 bg-[var(--border-color)] mx-1"></div>
                          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                              <ChevronRight size={16} />
                          </button>
                      </div>
                  </div>
                  
                  {loadingRuns && <Loader size="sm" text="Updating..." />}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="py-2 text-center text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                          {day}
                      </div>
                  ))}
              </div>
              
              <div className="flex-1 grid grid-cols-7 grid-rows-6 bg-[var(--bg-secondary)]">
                  {calendarDays.map((day, i) => {
                      if (!day) return <div key={i} className="bg-[var(--bg-surface)]/50 border-r border-b border-[var(--border-color)]" />;
                      
                      const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                      const isToday = day.toDateString() === new Date().toDateString();
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6; // Sun or Sat
                      const runs = getRunsForDate(day);
                      
                      return (
                          <div 
                              key={i} 
                              onClick={() => setSelectedDate(day)}
                              onDoubleClick={() => handleDateDoubleClick(day)}
                              className={`
                                  relative p-2 border-r border-b border-[var(--border-color)] cursor-pointer transition-colors
                                  ${isSelected ? 'bg-vercel-accent-blue/10 shadow-[inset_0_0_0_1px_var(--accent-blue)]' : isWeekend ? 'bg-[var(--bg-surface)]/30' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)]'}
                              `}
                          >
                              <div className={`
                                  text-xs w-6 h-6 flex items-center justify-center rounded-full mb-1 font-medium
                                  ${isToday ? 'border border-vercel-accent-blue text-vercel-accent-blue' : 'text-[var(--text-tertiary)]'}
                              `}>
                                  {day.getDate()}
                              </div>
                              
                              {/* Run Indicators */}
                              <div className="space-y-1">
                                  {runs.slice(0, 3).map((run, idx) => (
                                      <div 
                                        key={idx} 
                                        className="text-[10px] truncate px-1.5 h-[20px] flex items-center rounded bg-vercel-accent-blue/10 text-vercel-accent-blue border border-vercel-accent-blue/20"
                                        title={run.jobName}
                                      >
                                          {run.jobName}
                                      </div>
                                  ))}
                                  {runs.length > 3 && (
                                      <div className="text-[10px] text-[var(--text-tertiary)] pl-1 font-medium">
                                          +{runs.length - 3} more
                                      </div>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
          
          {/* Side Panel: Info Details */}
          <div className="w-80 flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-surface)]">
                  <h3 className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                       <Clock size={16} className="text-[var(--text-tertiary)]" />
                       {formatDateOnly(selectedDate.toISOString())}
                  </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-thumb-[var(--border-color)] scrollbar-track-transparent">
                  {runsOnSelectedDate.length > 0 ? (
                      <div className="divide-y divide-[var(--border-color)]">
                          {runsOnSelectedDate.map((run, i) => (
                              <div key={i} className="p-4 hover:bg-[var(--bg-hover)] transition-colors group relative cursor-default border-l-2 border-transparent hover:border-blue-500">
                                   <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1">
                                          <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-mono text-[var(--text-tertiary)]">
                                                 {formatTimeOnly(run.timestamp)}
                                              </span>
                                              
                                              {/* Actions - Visible on hover */}
                                              <div className="flex items-center gap-1">
                                                  <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className="h-6 w-6 p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                                      title="Edit Schedule"
                                                      onClick={() => {
                                                          const job = jobs.find(j => j.id === run.jobId);
                                                          if(job) handleOpenSchedule(job);
                                                      }}
                                                  >
                                                      <Clock size={14} />
                                                  </Button>
                                                  <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className="h-6 w-6 p-0 text-[var(--text-tertiary)] hover:text-blue-400"
                                                      title="Run Now"
                                                      onClick={async () => {
                                                         try {
                                                            addToast('info', `Triggering run for ${run.jobName}...`);
                                                            await executionService.executeJob(run.jobId);
                                                            addToast('success', `Execution started for ${run.jobName}`);
                                                         } catch (err: any) {
                                                            addToast('error', `Failed to run job: ${err.message}`);
                                                         }
                                                      }}
                                                  >
                                                      <Play size={14} />
                                                  </Button>
                                              </div>
                                          </div>
                                          <h4 className="font-medium text-sm text-[var(--text-primary)] truncate" title={run.jobName}>
                                              {run.jobName}
                                          </h4>
                                      </div>
                                   </div>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="text-center py-10 text-[var(--text-tertiary)]">
                          <p className="text-sm">No runs scheduled for this day.</p>
                      </div>
                  )}
                  
                  {/* Unscheduled Jobs List (Mini) - Renamed to "Available to Schedule" */}
                   <div className="mt-4 border-t border-[var(--border-color)]">
                       <div className="px-4 py-3 flex items-center justify-between bg-[var(--bg-surface)]">
                           <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Unscheduled Jobs</h4>
                           <button 
                                onClick={() => setIsPickerOpen(true)}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                           >
                               <Plus size={12} /> Add
                           </button>
                       </div>
                       <div className="divide-y divide-[var(--border-color)]">
                            {jobs.filter(j => !j.schedule).map(job => (
                                <div key={job.id} 
                                     onClick={() => handleOpenSchedule(job)}
                                     className="group flex items-center justify-between text-sm px-4 py-3 hover:bg-[var(--bg-hover)] cursor-pointer"
                                >
                                    <span className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] truncate flex-1">{job.name}</span>
                                    <Plus size={14} className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] group-hover:text-blue-400 transition-all" />
                                </div>
                            ))}
                       </div>
                   </div>

              </div>
          </div>
      </div>

      {/* NEW DAY TIMELINE */}
      {dayViewOpen && (
          <DayTimeline 
            date={selectedDate}
            jobs={jobs}
            runs={getRunsForDate(selectedDate)}
            onClose={() => setDayViewOpen(false)}
            onEditSchedule={handleOpenSchedule}
          />
      )}

      {/* Job Picker Modal */}
      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title="Select Job to Schedule"
        size="md"
      >
          <div className="space-y-4">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                      type="text"
                      placeholder="Search jobs..."
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-black border border-vercel-light-border dark:border-vercel-dark-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                      autoFocus
                  />
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {jobs.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No jobs found in this workspace.</p>
                  ) : (
                      jobs.map(job => (
                          <div 
                              key={job.id}
                              onClick={() => {
                                  setIsPickerOpen(false);
                                  handleOpenSchedule(job);
                              }}
                              className="flex items-center justify-between p-3 rounded-lg border border-vercel-light-border dark:border-vercel-dark-border hover:border-blue-500 cursor-pointer transition-all group bg-white dark:bg-zinc-900"
                          >
                              <div className="flex flex-col">
                                  <span className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text group-hover:text-blue-500 transition-colors">
                                      {job.name}
                                  </span>
                                  {job.schedule ? (
                                      <span className="text-xs text-green-500 flex items-center gap-1 mt-0.5">
                                          <Clock size={10} /> Scheduled: {job.schedule}
                                      </span>
                                  ) : (
                                      <span className="text-xs text-gray-400 mt-0.5">Unscheduled</span>
                                  )}
                              </div>
                              <Plus size={16} className="text-gray-400 group-hover:text-blue-500" />
                          </div>
                      ))
                  )}
              </div>
          </div>
      </Modal>

      {selectedJob && (
          <ScheduleModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSave={handleSaveSchedule}
              initialSchedule={selectedJob.schedule || null}
              initialDependencies={selectedJob.dependencies || []}
              jobName={selectedJob.name}
              jobId={selectedJob.id}
          />
      )}
    </div>
  );
};
