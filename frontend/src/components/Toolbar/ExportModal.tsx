import React from 'react';
import { Package, FileJson, Info } from 'lucide-react';
import { Modal } from '../common/Modal'; 
import { Button } from '../common/Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobName: string;
  dependencyNames: string[];
  onExportSingle: () => void;
  onExportRecursive: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  jobName,
  dependencyNames,
  onExportSingle,
  onExportRecursive,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Export ${jobName}`}>
      <div className="space-y-4">
        {/* Info Block */}
        <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-600 dark:text-blue-500">
            <Info className="shrink-0 mt-0.5" size={18} />
            <div className="text-sm">
                <p className="font-medium">Dependencies Detected</p>
                <p className="opacity-90 mt-1">
                    This job depends on the following jobs:
                </p>
                <ul className="list-disc list-inside mt-1 ml-1 opacity-80">
                    {dependencyNames.slice(0, 5).map((name, i) => (
                        <li key={i}>{name}</li>
                    ))}
                    {dependencyNames.length > 5 && <li>...and {dependencyNames.length - 5} more</li>}
                </ul>
            </div>
        </div>

        <div className="grid gap-3 pt-2">
           {/* Option 1: Standard Export */}
           <div 
             className="flex flex-col p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors group"
             onClick={onExportSingle}
           >
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded bg-emerald-500/10 text-emerald-500">
                    <FileJson size={20} />
                 </div>
                 <h4 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
                     Export Job Only
                 </h4>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pl-[3.25rem] leading-relaxed">
                  Export only this job configuration. Dependencies will be referenced by ID but not included in calculation.
              </p>
           </div>

           {/* Option 2: Recursive Bundle */}
           <div 
             className="flex flex-col p-4 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] cursor-pointer transition-colors group"
             onClick={onExportRecursive}
           >
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded bg-indigo-500/10 text-indigo-500">
                    <Package size={20} />
                 </div>
                 <h4 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
                     Export with Dependencies
                 </h4>
              </div>
              <p className="text-xs text-[var(--text-secondary)] pl-[3.25rem] leading-relaxed">
                  Export a single bundle file (.osmosis) containing this job AND all its dependencies recursively.
              </p>
           </div>
        </div>
        
        <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={onClose}>
                Cancel
            </Button>
        </div>
      </div>
    </Modal>
  );
};
