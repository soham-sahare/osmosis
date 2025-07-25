import { create } from 'zustand';
import type { Workspace, WorkspaceVariable } from '../types/workspace';
import { workspaceService } from '../services/workspaceService';

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchWorkspaces: () => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  createWorkspace: (name: string, description: string) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  exportWorkspace: (id: string) => Promise<void>;
  bulkDeleteWorkspaces: (ids: string[]) => Promise<void>;
  
  // Variables
  workspaceVariables: WorkspaceVariable[];
  fetchVariables: (workspaceId: string) => Promise<void>;
  createVariable: (workspaceId: string, key: string, value: string, isSecret?: boolean) => Promise<void>;
  updateVariable: (workspaceId: string, key: string, value: string, isSecret?: boolean) => Promise<void>;
  deleteVariable: (workspaceId: string, key: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, _get) => ({
  // ... existing code ...
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,
  
  // ... (Fetch, Set worksapce actions skipped in patch) ... 
  
  fetchWorkspaces: async () => {
      // ... same
      set({ loading: true, error: null });
    try {
      const workspaces = await workspaceService.getAll();
      set({ workspaces, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch workspaces', loading: false });
    }
  },

  setCurrentWorkspace: (workspace) => {
    set({ currentWorkspace: workspace });
  },

  createWorkspace: async (name, description) => {
    set({ loading: true, error: null });
    try {
      const workspace = await workspaceService.create({ name, description });
      set((state) => ({
        workspaces: [...state.workspaces, workspace],
        loading: false,
      }));
      return workspace;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create workspace', loading: false });
      throw error;
    }
  },

  updateWorkspace: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await workspaceService.update(id, data);
      set((state) => ({
        workspaces: state.workspaces.map((w) => (w.id === id ? updated : w)),
        currentWorkspace: state.currentWorkspace?.id === id ? updated : state.currentWorkspace,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update workspace', loading: false });
      throw error;
    }
  },

  deleteWorkspace: async (id) => {
    set({ loading: true, error: null });
    try {
      await workspaceService.delete(id);
      set((state) => ({
        workspaces: state.workspaces.filter((w) => w.id !== id),
        currentWorkspace: state.currentWorkspace?.id === id ? null : state.currentWorkspace,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete workspace', loading: false });
      throw error;
    }
  },

  exportWorkspace: async (id) => {
    try {
        const response = await workspaceService.getById(id);
        const blob = await workspaceService.export(id);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${response.name || 'workspace'}_export.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error: any) {
        set({ error: error.message || 'Failed to export workspace' });
        throw error;
    }
  },

  bulkDeleteWorkspaces: async (ids: string[]) => {
      set({ loading: true, error: null });
      try {
          await workspaceService.bulkDelete(ids);
          set((state) => ({
              workspaces: state.workspaces.filter((w) => !ids.includes(w.id)),
              loading: false,
              // If current workspace was deleted, clear it
              currentWorkspace: state.currentWorkspace && ids.includes(state.currentWorkspace.id) ? null : state.currentWorkspace
          }));
      } catch (error: any) {
          set({ error: error.message || 'Failed to bulk delete workspaces', loading: false });
          throw error;
      }
  },

  // Variables
  workspaceVariables: [],
  
  fetchVariables: async (workspaceId: string) => {
    try {
      const variables = await workspaceService.getVariables(workspaceId);
      set({ workspaceVariables: variables });
    } catch (error: any) {
       console.error("Failed to fetch variables", error);
    }
  },

  createVariable: async (workspaceId: string, key: string, value: string, isSecret: boolean = false) => {
      try {
          const variable = await workspaceService.createVariable(workspaceId, { key, value, isSecret });
          set((state) => ({
              workspaceVariables: [...state.workspaceVariables, variable]
          }));
      } catch (error: any) {
           throw error;
      }
  },

  updateVariable: async (workspaceId: string, key: string, value: string, isSecret?: boolean) => {
      try {
          const updated = await workspaceService.updateVariable(workspaceId, key, { value, isSecret });
           set((state) => ({
              workspaceVariables: state.workspaceVariables.map(v => v.key === key ? updated : v)
          }));
      } catch (error: any) {
          throw error;
      }
  },

  deleteVariable: async (workspaceId: string, key: string) => {
      try {
          await workspaceService.deleteVariable(workspaceId, key);
          set((state) => ({
              workspaceVariables: state.workspaceVariables.filter(v => v.key !== key)
          }));
      } catch (error: any) {
          throw error;
      }
  },
}));
