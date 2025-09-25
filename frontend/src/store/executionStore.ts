import { create } from 'zustand';

interface ExecutionStore {
  isExecuting: boolean;
  isOpen: boolean;
  logs: string[];
  
  setIsExecuting: (isExecuting: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
  addLog: (log: string) => void;
  clearLogs: () => void;
  toggleOpen: () => void;
}

export const useExecutionStore = create<ExecutionStore>((set) => ({
  isExecuting: false,
  isOpen: false,
  logs: [],

  setIsExecuting: (isExecuting) => set({ isExecuting }),
  setIsOpen: (isOpen) => set({ isOpen }),
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
}));
