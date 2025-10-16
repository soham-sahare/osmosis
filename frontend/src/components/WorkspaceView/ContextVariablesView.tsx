
import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Eye, EyeOff, Plus, Trash2, Edit2, Check, X, Variable, Search } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface ContextVariablesViewProps {
  workspaceId: string;
}

export const ContextVariablesView: React.FC<ContextVariablesViewProps> = ({
  workspaceId,
}) => {
  const { workspaceVariables, fetchVariables, createVariable, updateVariable, deleteVariable } = useWorkspaceStore();
  
  const { addToast } = useToast();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [isNewSecret, setIsNewSecret] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editIsSecret, setEditIsSecret] = useState(false);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVariables(workspaceId);
  }, [workspaceId, fetchVariables]);

  const toggleVisible = (key: string) => {
      setVisibleSecrets(prev => {
          const next = new Set(prev);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          return next;
      });
  };

  const filteredVariables = workspaceVariables.filter(v => {
      const query = searchQuery.toLowerCase();
      const matchKey = v.key.toLowerCase().includes(query);
      const matchValue = !v.isSecret && v.value.toLowerCase().includes(query);
      return matchKey || matchValue;
  });

  // ... (handlers) ...

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      setError('Key and Value are required');
      return;
    }
    
    // Simple key validation (uppercase, underscores)
    if (!/^[A-Z_][A-Z0-9_]*$/.test(newKey)) {
        setError('Key must start with A-Z or _, and contain only A-Z, 0-9, _');
        return;
    }

    try {
      await createVariable(workspaceId, newKey, newValue, isNewSecret);
      addToast('success', 'Variable created successfully');
      setNewKey('');
      setNewValue('');
      setIsNewSecret(false);
      setError(null);
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to create variable';
      setError(msg);
      addToast('error', msg);
    }
  };

  const handleUpdate = async (key: string) => {
    try {
      await updateVariable(workspaceId, key, editValue, editIsSecret);
      addToast('success', 'Variable updated successfully');
      setEditingKey(null);
      setError(null);
    } catch (e: any) {
        const msg = e.response?.data?.error || 'Failed to update variable';
        setError(msg);
        addToast('error', msg);
    }
  };

  const startEditing = (variable: any) => {
      setEditingKey(variable.key);
      setEditValue(variable.value);
      setEditIsSecret(variable.isSecret || false);
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ...

  const handleDeleteClick = (key: string) => {
      setVariableToDelete(key);
      setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!variableToDelete) return;
    setDeleting(true);
    try {
      await deleteVariable(workspaceId, variableToDelete);
      addToast('success', 'Variable deleted successfully');
      setDeleteModalOpen(false);
      setVariableToDelete(null);
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Failed to delete variable';
      setError(msg);
      addToast('error', msg);
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-vercel-light-text dark:text-vercel-dark-text flex items-center gap-2">
                <Variable size={20} className="text-vercel-accent-blue" />
                Workspace Context Variables
            </h2>
            <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mt-1">
                Variables defined here are global to this workspace.
            </p>
          </div>
                  <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary" size={16} />
                      <input 
                          type="text" 
                          placeholder="Search variables by key..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-md focus:outline-none focus:ring-1 focus:ring-vercel-accent-blue w-64 text-vercel-light-text dark:text-vercel-dark-text placeholder:text-gray-400"
                      />
                  </div>
      </div>

      {/* Add New Variable */}
      <div className="flex gap-4 items-end bg-gray-50 dark:bg-vercel-dark-bg/50 p-4 rounded-lg border border-vercel-light-border dark:border-vercel-dark-border">
         {/* ... (inputs) ... */}
         {/* Retain existing inputs */}
        <div className="flex-1">
          <Input
            label="Key"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
            placeholder="KEY"
          />
        </div>
        <div className="flex-1">
          <Input
            label="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="value"
            type={isNewSecret ? "password" : "text"}
          />
        </div>
        <div className="flex items-center h-[42px] px-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-vercel-light-text dark:text-vercel-dark-text select-none">
                <input 
                    type="checkbox" 
                    checked={isNewSecret}
                    onChange={(e) => setIsNewSecret(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700 text-vercel-accent-blue focus:ring-vercel-accent-blue"
                />
                Secret
            </label>
        </div>
        <Button onClick={handleAdd} icon={<Plus size={16} />}>
          Add
        </Button>
      </div>

      {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded text-red-600 dark:text-red-400 text-sm">
              {error}
          </div>
      )}

      {/* Variables Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[var(--border-color)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
            <div className="col-span-4">Key</div>
            <div className="col-span-6">Value</div>
            <div className="col-span-2 text-right">Actions</div>
        </div>

        {filteredVariables.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] py-12">
            {searchQuery ? 'No variables match your search.' : 'No variables defined. Add one above to get started.'}
          </p>
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {filteredVariables.map((variable, index) => (
              <div
                key={variable.key}
                className={`grid grid-cols-12 gap-4 px-6 h-[48px] items-center hover:bg-[var(--bg-hover)] transition-colors ${index % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}`}
              >
                {/* Key Column */}
                <div className="col-span-4 font-mono text-sm font-medium text-[var(--text-primary)] flex items-center gap-2 truncate" title={variable.key}>
                  <span className="truncate">{variable.key}</span>
                  {variable.isSecret && (
                    <span className="flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-medium border border-amber-500/20">
                        <div className="w-1 h-1 rounded-full bg-amber-500"></div>
                        Secret
                    </span>
                  )}
                </div>
                
                {/* Value Column */}
                <div className="col-span-6 font-mono text-sm text-[var(--text-secondary)] truncate flex items-center gap-3">
                  {editingKey === variable.key ? (
                     <div className="flex items-center gap-2 w-full">
                         <input 
                            className="flex-1 bg-transparent border-b border-blue-500 focus:outline-none text-[var(--text-primary)] py-1"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            type={editIsSecret ? "password" : "text"}
                         />
                         <label className="flex items-center gap-1 cursor-pointer text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                            <input 
                                type="checkbox" 
                                checked={editIsSecret}
                                onChange={(e) => setEditIsSecret(e.target.checked)}
                                className="rounded border-[var(--border-color)] bg-[var(--bg-hover)]"
                            /> Secret
                         </label>
                     </div>
                  ) : (
                      <div className="flex items-center gap-2 min-w-0 w-full group">
                        <span className="truncate flex-1">
                            {variable.isSecret && !visibleSecrets.has(variable.key) ? '•'.repeat(12) : variable.value}
                        </span>
                        {/* Inline actions for secret visibility */}
                        {variable.isSecret && (
                            <button 
                                onClick={() => toggleVisible(variable.key)}
                                className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                {visibleSecrets.has(variable.key) ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        )}
                      </div>
                  )}
                </div>

                {/* Actions Column */}
                <div className="col-span-2 flex items-center justify-end gap-3">
                   {/* ... same actions ... */}
                   {editingKey === variable.key ? (
                       <>
                        <button
                            onClick={() => handleUpdate(variable.key)}
                            className="p-1.5 text-green-500 hover:bg-green-500/10 rounded transition-colors"
                            title="Save"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={() => setEditingKey(null)}
                            className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded transition-colors"
                            title="Cancel"
                        >
                            <X size={16} />
                        </button>
                       </>
                   ) : (
                       <>
                        <button
                            onClick={() => startEditing(variable)}
                            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                            title="Edit"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            onClick={() => handleDeleteClick(variable.key)}
                            className="text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                       </>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Variable"
      >
        <div className="space-y-4">
          <p className="text-vercel-light-text dark:text-vercel-dark-text">
            Are you sure you want to delete variable <span className="font-mono font-semibold">{variableToDelete}</span>?
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
