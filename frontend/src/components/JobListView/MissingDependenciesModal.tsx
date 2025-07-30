import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface MissingDependenciesModalProps {
  isOpen: boolean;
  onClose: () => void; // Treat as Cancel? Or generic close?
  jobName: string;
  missingDependencies: string[];
  onKeep: () => void;
  onRemoveDependencies: () => void;
  onCancelImport: () => void;
  processing?: boolean;
}

export const MissingDependenciesModal: React.FC<MissingDependenciesModalProps> = ({
  isOpen,
  onClose,
  jobName,
  missingDependencies,
  onKeep,
  onRemoveDependencies,
  onCancelImport,
  processing = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Missing Dependencies Detected">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 dark:text-amber-500">
          <TriangleAlert className="shrink-0 mt-0.5" size={18} />
          <div className="text-sm">
            <p className="font-medium mb-1">
              The job "{jobName}" depends on the following jobs which could not be found in this workspace:
            </p>
            <ul className="list-disc list-inside opacity-90">
              {missingDependencies.map((dep, i) => (
                <li key={i}>{dep}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
          How would you like to proceed with the import?
        </p>

        <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-color)] mt-4">
           {/* Option 1: Keep (Import as is) */}
           <div className="flex items-center justify-between p-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">Import as is</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Keep existing valid dependencies, ignore missing ones.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={onKeep} disabled={processing}>
                  Import
              </Button>
           </div>

           {/* Option 2: Remove All */}
           <div className="flex items-center justify-between p-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">Remove all dependencies</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Import with no dependencies scheduled.</p>
              </div>
              <Button size="sm" variant="secondary" onClick={onRemoveDependencies} disabled={processing}>
                  Remove & Import
              </Button>
           </div>
           
           {/* Option 3: Cancel */}
           <div className="flex items-center justify-between p-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)]">Cancel Import</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Abort the operation and delete the imported job.</p>
              </div>
              <Button size="sm" variant="danger" onClick={onCancelImport} disabled={processing}>
                  Cancel
              </Button>
           </div>
        </div>
      </div>
    </Modal>
  );
};
