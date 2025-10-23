import React, { useState, useEffect } from 'react';
import { Clock, Workflow, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useJobStore } from '../../store/jobStore';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: string | null, dependencies?: string[]) => void; 
  initialSchedule: string | null;
  initialDependencies?: string[];
  jobName: string;
  jobId: string;
}

type Frequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
type Tab = 'schedule' | 'dependencies';

// Helper to generate hours/minutes from time string "HH:MM"
const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(':');
  return { hour: parseInt(h, 10), minute: parseInt(m, 10) };
};

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
    isOpen, onClose, onSave, initialSchedule, initialDependencies, jobName, jobId 
}) => {
  const { jobs } = useJobStore();
  const [activeTab, setActiveTab] = useState<Tab>('schedule');
  const [frequency, setFrequency] = useState<Frequency>('none');
  const [schedule, setSchedule] = useState<string>('');
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  // Visual Builder State
  const [time, setTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]); // 0-6 (Sun-Sat)
  const [selectedDates, setSelectedDates] = useState<number[]>([]); // 1-31
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]); // 1-12
  const [customCron, setCustomCron] = useState('');
  
  // Initialize state from props
  useEffect(() => {
    if (isOpen) {
        // Init Dependencies
        setSelectedDependencies(initialDependencies || []);

        // Init Schedule
        if (!initialSchedule) {
            setFrequency('none');
            setSchedule('');
        } else {
            // Reverse engineer cron
            const parts = initialSchedule.split(' ');
            if (parts.length !== 5) {
                setFrequency('custom');
                setSchedule(initialSchedule);
                setCustomCron(initialSchedule);
            } else {
                const [min, hour, dom, month, dow] = parts;
                
                // Helper to set time
                const h = hour.padStart(2, '0');
                const m = min.padStart(2, '0');
                setTime(`${h}:${m}`);

                if (dom === '*' && month === '*' && dow === '*') {
                    setFrequency('daily');
                } else if (dom === '*' && month === '*' && dow !== '*') {
                    setFrequency('weekly');
                    setSelectedDays(dow.split(',').map(d => parseInt(d, 10)));
                } else if (dom !== '*' && month === '*' && dow === '*') {
                    setFrequency('monthly');
                    setSelectedDates(dom.split(',').map(d => parseInt(d, 10)));
                } else if (dom !== '*' && month !== '*' && dow === '*') {
                    setFrequency('yearly');
                    setSelectedDates(dom.split(',').map(d => parseInt(d, 10)));
                    setSelectedMonths(month.split(',').map(m => parseInt(m, 10)));
                } else {
                    setFrequency('custom');
                    setCustomCron(initialSchedule);
                    setSchedule(initialSchedule);
                }
            }
        }
    }
  }, [initialSchedule, initialDependencies, isOpen]);

  // Generate cron string when visual state changes
  useEffect(() => {
    if (!isOpen) return;
    
    let newCron = '';
    const { hour, minute } = parseTime(time);

    if (frequency === 'none') {
        newCron = '';
    } else if (frequency === 'custom') {
        newCron = customCron;
    } else if (frequency === 'daily') {
        newCron = `${minute} ${hour} * * *`;
    } else if (frequency === 'weekly') {
        const dow = selectedDays.length > 0 ? selectedDays.sort((a,b) => a-b).join(',') : '*';
        newCron = `${minute} ${hour} * * ${dow}`;
    } else if (frequency === 'monthly') {
        const dom = selectedDates.length > 0 ? selectedDates.sort((a,b) => a-b).join(',') : '1';
        newCron = `${minute} ${hour} ${dom} * *`;
    } else if (frequency === 'yearly') {
        const dom = selectedDates.length > 0 ? selectedDates.sort((a,b) => a-b).join(',') : '1';
        const mon = selectedMonths.length > 0 ? selectedMonths.sort((a,b) => a-b).join(',') : '1';
        newCron = `${minute} ${hour} ${dom} ${mon} *`;
    }

    setSchedule(newCron);
  }, [frequency, time, selectedDays, selectedDates, selectedMonths, customCron, isOpen]);

  const handleFrequencyChange = (freq: Frequency) => {
      setFrequency(freq);
  };

  const toggleDay = (day: number) => {
      setSelectedDays(prev => {
          if (prev.includes(day)) return prev.filter(d => d !== day);
          return [...prev, day].sort((a,b) => a-b);
      });
  };

  const toggleDate = (date: number) => {
      setSelectedDates(prev => {
          if (prev.includes(date)) return prev.filter(d => d !== date);
          return [...prev, date].sort((a,b) => a-b);
      });
  };

  const toggleMonth = (month: number) => {
      setSelectedMonths(prev => {
          if (prev.includes(month)) return prev.filter(m => m !== month);
          return [...prev, month].sort((a,b) => a-b);
      });
  };

  const handleSave = () => {
      onSave(schedule || null, selectedDependencies);
      onClose(); // Parent handles logic, local state just passes data
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Schedule: ${jobName}`} size="2xl">
      <div className="flex flex-col h-full">
        {/* Tabs */}
        <div className="flex px-1 border-b border-gray-100 dark:border-[#2a2a2a] mb-6">
            <button 
                onClick={() => setActiveTab('schedule')}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                    activeTab === 'schedule' 
                    ? 'border-blue-500 text-blue-500' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
                <div className="flex items-center gap-2">
                    <Clock size={16} />
                    Schedule
                </div>
            </button>
            <button 
                onClick={() => setActiveTab('dependencies')}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                    activeTab === 'dependencies' 
                    ? 'border-blue-500 text-blue-500' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
                <div className="flex items-center gap-2">
                    <Workflow size={16} />
                    Dependencies
                </div>
            </button>
        </div>

        {/* Content */}
        <div className="space-y-6">
            {activeTab === 'schedule' ? (
                <>
                    <div>
                        <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3 block">
                            Frequency
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom'].map((freq) => (
                                <button
                                    key={freq}
                                    onClick={() => handleFrequencyChange(freq as Frequency)}
                                    className={`
                                        px-5 py-2.5 rounded-md text-sm font-semibold transition-all capitalize border
                                        ${frequency === freq 
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                            : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-color)] hover:text-[var(--text-primary)]'}
                                    `}
                                >
                                    {freq}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-5">
                         {frequency === 'none' && (
                             <div className="flex items-center gap-3 text-[var(--text-tertiary)]">
                                <AlertTriangle size={20} className="text-blue-500" />
                                <p className="text-sm">This job will not run automatically. You can always trigger it manually.</p>
                             </div>
                         )}

                         {frequency === 'custom' && (
                             <div>
                                 <Input 
                                     value={customCron} 
                                     onChange={(e) => setCustomCron(e.target.value)}
                                     placeholder="0 0 * * *"
                                     className="font-mono bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-primary)]"
                                 />
                                 <div className="mt-3 text-xs text-[var(--text-tertiary)]">
                                   <p>Standard cron expression format:</p>
                                   <p className="font-mono mt-1">Minute Hour Day Month DayOfWeek</p>
                                 </div>
                             </div>
                         )}

                         {/* Visual Builder UI */}
                         {['daily', 'weekly', 'monthly', 'yearly'].includes(frequency) && (
                             <div className="space-y-6">
                                 {/* Time Selector */}
                                 <div className="flex flex-col">
                                     <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-2">Time (Local)</label>
                                     <div className="relative w-40">
                                        <input 
                                            type="time" 
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-md px-3 py-2 text-sm focus:border-blue-500 focus:outline-none pr-10"
                                        />
                                        <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" size={16} />
                                     </div>
                                 </div>
                                 
                                 {/* Weekly Day Selector */}
                                 {frequency === 'weekly' && (
                                     <div>
                                         <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-3 block">Days of Week</label>
                                         <div className="flex flex-wrap gap-2">
                                             {DAYS.map((day, index) => (
                                                 <button
                                                     key={day}
                                                     onClick={() => toggleDay(index)}
                                                     className={`
                                                         w-12 h-12 rounded-full text-sm font-medium transition-all flex items-center justify-center border
                                                         ${selectedDays.includes(index) 
                                                             ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                                             : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-tertiary)] hover:border-blue-500 hover:text-[var(--text-primary)]'}
                                                     `}
                                                 >
                                                     {day}
                                                 </button>
                                             ))}
                                         </div>
                                         {selectedDays.length === 0 && (
                                            <div className="flex items-center gap-2 mt-3 text-red-500 text-xs">
                                                <AlertTriangle size={12} /> Select at least one day.
                                            </div>
                                         )}
                                     </div>
                                 )}

                                 {/* Yearly: Month Selector */}
                                 {frequency === 'yearly' && (
                                     <div>
                                         <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-3 block">Months</label>
                                         <div className="grid grid-cols-6 gap-2">
                                             {MONTHS.map((m, i) => (
                                                  <button
                                                     key={m}
                                                     onClick={() => toggleMonth(i + 1)}
                                                     className={`
                                                         py-2 rounded-md text-xs font-semibold transition-all border
                                                         ${selectedMonths.includes(i + 1) 
                                                             ? 'bg-blue-600 border-blue-600 text-white' 
                                                             : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-tertiary)] hover:border-blue-500 hover:text-[var(--text-primary)]'}
                                                     `}
                                                 >
                                                     {m}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 )}

                                 {/* Monthly/Yearly: Date Selector */}
                                 {(frequency === 'monthly' || frequency === 'yearly') && (
                                     <div>
                                         <label className="text-xs font-semibold text-[var(--text-tertiary)] mb-3 block">Days of Month</label>
                                         <div className="grid grid-cols-7 gap-2">
                                             {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                                 <button
                                                     key={d}
                                                     onClick={() => toggleDate(d)}
                                                     className={`
                                                         w-10 h-10 rounded-full text-sm font-medium transition-all flex items-center justify-center border
                                                         ${selectedDates.includes(d) 
                                                             ? 'bg-blue-600 border-blue-600 text-white' 
                                                             : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-tertiary)] hover:border-blue-500 hover:text-[var(--text-primary)]'}
                                                     `}
                                                 >
                                                     {d}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 )}

                                 <div className="pt-4 mt-2 border-t border-[var(--border-color)] flex items-center gap-2">
                                     <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Generated:</span>
                                     <code className="text-blue-500 font-mono bg-blue-500/10 px-2 py-1 rounded text-sm border border-blue-500/20">
                                        {schedule}
                                     </code>
                                 </div>
                             </div>
                         )}
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                     <p className="text-sm text-[var(--text-secondary)] mb-4">
                         Select jobs that should trigger <strong className="text-[var(--text-primary)]">{jobName}</strong> upon successful completion.
                     </p>
                     
                     <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                         {jobs.filter(j => j.id !== jobId).map(job => {
                             const isSelected = selectedDependencies.includes(job.id);
                             return (
                                 <div 
                                     key={job.id}
                                     onClick={() => {
                                         if (isSelected) setSelectedDependencies(prev => prev.filter(id => id !== job.id));
                                         else setSelectedDependencies(prev => [...prev, job.id]);
                                     }}
                                     className={`
                                         flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all duration-200
                                         ${isSelected 
                                             ? 'bg-blue-500/10 border-blue-500 text-[var(--text-primary)] shadow-[0_4px_12px_rgba(59,130,246,0.1)]' 
                                             : 'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]'}
                                     `}
                                 >
                                     <span className="font-medium">{job.name}</span>
                                     {isSelected && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"><Workflow size={12} className="text-white" /></div>}
                                 </div>
                             );
                         })}
                         
                         {jobs.length <= 1 && (
                             <div className="text-center text-[var(--text-tertiary)] py-12 border border-dashed border-[var(--border-color)] rounded-lg">
                                 No other jobs available to depend on.
                             </div>
                         )}
                     </div>
                </div>
            )}
        </div>

        {/* Footer - Pinned to bottom */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-[#2a2a2a]">
            <Button variant="secondary" onClick={onClose}>
                Cancel
            </Button>
            <Button 
                variant="primary" 
                onClick={handleSave}
            >
                Save Configuration
            </Button>
        </div>
      </div>
    </Modal>
  );
};
