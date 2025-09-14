import React, { useMemo, useEffect, useRef } from 'react';
import type { Job } from '../../types/job';
import { X, Clock } from 'lucide-react';
import { formatTimeOnly } from '../../utils/date';

interface DayTimelineProps {
  date: Date;
  jobs: Job[];
  runs: any[]; // Using the generic run structure from SchedulerView
  onClose: () => void;
  onEditSchedule: (job: Job) => void;
}

interface VisualEvent {
  jobId: string;
  jobName: string;
  timestamp: string;
  cron: string;
  startMinutes: number;
  endMinutes: number;
  duration: number;
  colIndex: number;
  totalCols: number;
}

export const DayTimeline: React.FC<DayTimelineProps> = ({ date, runs, jobs, onClose, onEditSchedule }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Time slots: 00:00 to 23:00
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  // Current time line
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Scroll to 8 AM or first event on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
        // Default scroll to 8 AM (8 * 60px height assumption per hour)
        scrollContainerRef.current.scrollTop = 8 * 60;
    }
  }, []);

  // Process runs into positionable blocks with overlap detection
  const events: VisualEvent[] = useMemo(() => {
      // 1. Convert to basic event objects
      const basicEvents = runs.map(run => {
          const runDate = new Date(run.timestamp);
          const startMinutes = runDate.getHours() * 60 + runDate.getMinutes();
          // Assume 45 min duration for visual block to provide enough space for text
          const duration = 45; 
          return {
              ...run,
              startMinutes,
              duration,
              endMinutes: startMinutes + duration,
              colIndex: 0,
              totalCols: 1
          };
      });

      // 2. Sort by start time
      basicEvents.sort((a, b) => a.startMinutes - b.startMinutes);

      // 3. Group into clusters of overlapping events
      const clusters: (typeof basicEvents)[] = [];
      let currentCluster: (typeof basicEvents) = [];

      basicEvents.forEach(event => {
          if (currentCluster.length === 0) {
              currentCluster.push(event);
          } else {
              // Check if this event overlaps with the *entire cluster's range*
              const clusterEnd = Math.max(...currentCluster.map(e => e.endMinutes));
              if (event.startMinutes < clusterEnd) {
                  currentCluster.push(event);
              } else {
                  clusters.push(currentCluster);
                  currentCluster = [event];
              }
          }
      });
      if (currentCluster.length > 0) clusters.push(currentCluster);

      // 4. Assign columns within each cluster (basic "lane" algorithm)
      clusters.forEach(cluster => {
          // Sort clustering by duration desc or something? no, start time is fine.
          
          // Simple greedy lane assignment
          const lanes: number[] = []; // stores end time of last event in each lane
          
          cluster.forEach(event => {
              let placed = false;
              for (let i = 0; i < lanes.length; i++) {
                  if (event.startMinutes >= lanes[i]) {
                      event.colIndex = i;
                      lanes[i] = event.endMinutes;
                      placed = true;
                      break;
                  }
              }
              if (!placed) {
                  event.colIndex = lanes.length;
                  lanes.push(event.endMinutes);
              }
          });

          // All events in this cluster share visual width based on total lanes used
          const totalLanes = lanes.length;
          cluster.forEach(event => {
              event.totalCols = totalLanes;
          });
      });

      return basicEvents;
  }, [runs]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-[95vw] max-w-[1800px] h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200 dark:border-zinc-800">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
           <div>
               <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                   {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
               </h2>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                   {events.length} scheduled {events.length === 1 ? 'run' : 'runs'}
               </p>
           </div>
           <ButtonIcon onClick={onClose} />
        </div>

        {/* Timeline Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative bg-white dark:bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            
            {/* Grid Container with padding for top/bottom visibility */}
            <div className="relative min-h-[1440px] pb-24 pt-4"> 
                
                {/* Time Labels & Horizontal Lines */}
                {timeSlots.map(hour => (
                    <div key={hour} className="absolute w-full flex" style={{ top: `${hour * 60 + 16}px`, height: '60px' }}> {/* +16 for pt-4 */}
                        {/* Label */}
                        <div className="w-16 text-right pr-4 text-xs font-medium text-zinc-400 dark:text-zinc-500 -mt-2 uppercase">
                             {hour === 0 ? '12 am' : hour < 12 ? `${hour} am` : hour === 12 ? '12 pm' : `${hour - 12} pm`}
                        </div>
                        {/* Line */}
                        <div className="flex-1 border-t border-zinc-100 dark:border-zinc-800/60 pointer-events-none"></div>
                    </div>
                ))}

                {/* Current Time Indicator */}
                {isToday && (
                    <div 
                        className="absolute left-16 right-0 border-t-2 border-red-500 z-[60] pointer-events-none flex items-center shadow-sm"
                        style={{ top: `${currentMinutes + 16}px` }}
                    >
                        <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 ring-2 ring-white dark:ring-zinc-900"></div>
                        <div className="absolute left-0 -translate-x-full pr-2 flex items-center justify-end w-16">
                             <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded shadow-sm">
                                {formatTimeOnly(now.toISOString())}
                             </span>
                        </div>
                    </div>
                )}

                {/* Events */}
                <div className="absolute left-16 right-4 top-4 bottom-24"> {/* Matches pt-4 and pb-24 */}
                    {events.map((event, idx) => (
                        <div
                            key={idx}
                            onClick={() => {
                                const job = jobs.find(j => j.id === event.jobId);
                                if (job) onEditSchedule(job);
                            }}
                            className="absolute rounded-md border border-vercel-accent-blue/20 bg-vercel-accent-blue/10 hover:bg-vercel-accent-blue/15 transition-colors cursor-pointer px-2 py-1.5 overflow-hidden flex flex-col group z-20 hover:z-30 hover:shadow-md"
                            style={{
                                top: `${event.startMinutes}px`,
                                height: `${Math.max(event.duration, 30)}px`, 
                                left: `${(event.colIndex / event.totalCols) * 100}%`, 
                                width: `calc(${100 / event.totalCols}% - 4px)`, // -4px gap between cols
                            }}
                        >
                            <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                                <span className="font-semibold text-xs text-vercel-accent-blue truncate">
                                    {event.jobName}
                                </span>
                                {event.totalCols < 3 && ( // Hide time if cramped
                                    <span className="text-[10px] text-vercel-accent-blue/80 font-mono opacity-80">
                                        {formatTimeOnly(event.timestamp)}
                                    </span>
                                )}
                            </div>
                            {event.totalCols < 4 && Math.max(event.duration, 30) > 35 && (
                                <div className="text-[10px] text-vercel-accent-blue/70 truncate flex items-center gap-1">
                                    <Clock size={10} />
                                    Cron: {event.cron}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

const ButtonIcon = ({ onClick }: { onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
    >
        <X size={20} />
    </button>
);
