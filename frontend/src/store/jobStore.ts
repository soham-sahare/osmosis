import { create } from 'zustand';
import type { Job } from '../types/job';
import { jobService } from '../services/jobService';

interface JobStore {
  jobs: Job[];
  currentJob: Job | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchJobsByWorkspace: (workspaceId: string) => Promise<void>;
  fetchJob: (id: string) => Promise<void>;
  setCurrentJob: (job: Job | null) => void;
  createJob: (workspaceId: string, name: string, description: string) => Promise<Job>;
  updateJob: (id: string, data: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  exportJob: (id: string, filename: string) => Promise<void>;
  exportJobRecursive: (id: string, filename: string) => Promise<void>;
  importJob: (file: File, workspaceId: string) => Promise<Job>;
  bulkDeleteJobs: (ids: string[]) => Promise<void>;
  bulkExportJobs: (ids: string[]) => Promise<void>;
}

export const useJobStore = create<JobStore>((set, _get) => ({
  jobs: [],
  currentJob: null,
  loading: false,
  error: null,

  fetchJobsByWorkspace: async (workspaceId) => {
    set({ loading: true, error: null });
    try {
      const jobs = await jobService.getByWorkspace(workspaceId);
      set({ jobs, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch jobs', loading: false });
    }
  },

  fetchJob: async (id) => {
    set({ loading: true, error: null });
    try {
      const job = await jobService.getById(id);
      set({ currentJob: job, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch job', loading: false });
    }
  },

  setCurrentJob: (job) => {
    set({ currentJob: job });
  },

  createJob: async (workspaceId, name, description) => {
    set({ loading: true, error: null });
    try {
      const job = await jobService.create({ workspaceId, name, description });
      set((state) => ({
        jobs: [...state.jobs, job],
        loading: false,
      }));
      return job;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create job', loading: false });
      throw error;
    }
  },

  updateJob: async (id, data) => {
    try {
      const updated = await jobService.update(id, data as any);
      set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? updated : j)),
        currentJob: state.currentJob?.id === id ? updated : state.currentJob,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to update job' });
      throw error;
    }
  },

  deleteJob: async (id) => {
    set({ loading: true, error: null });
    try {
      await jobService.delete(id);
      set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== id),
        currentJob: state.currentJob?.id === id ? null : state.currentJob,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete job', loading: false });
      throw error;
    }
  },

  exportJob: async (id, filename) => {
    try {
      const blob = await jobService.export(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      set({ error: error.message || 'Failed to export job' });
      throw error;
    }
  },

  exportJobRecursive: async (id, filename) => {
    try {
      const blob = await jobService.exportRecursive(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      set({ error: error.message || 'Failed to export recursive job bundle' });
      throw error;
    }
  },

  importJob: async (file, workspaceId) => {
    set({ loading: true, error: null });
    try {
      const job = await jobService.import(file, workspaceId);
      set((state) => ({
        jobs: [...state.jobs, job],
        loading: false,
      }));
      return job;
    } catch (error: any) {
      set({ error: error.message || 'Failed to import job', loading: false });
      throw error;
    }
  },

  bulkDeleteJobs: async (ids) => {
    set({ loading: true, error: null });
    try {
      await jobService.bulkDelete(ids);
      set((state) => ({
        jobs: state.jobs.filter((j) => !ids.includes(j.id)),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to bulk delete jobs', loading: false });
      throw error;
    }
  },

  bulkExportJobs: async (ids) => {
    try {
      const blob = await jobService.bulkExport(ids);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk_export_${new Date().getTime()}.osmosis`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      set({ error: error.message || 'Failed to bulk export jobs' });
      throw error;
    }
  },
}));
