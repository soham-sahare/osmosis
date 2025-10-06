import { apiClient } from './api';
import { APP_CONSTANTS } from '../constants/app';
import type { Job, CreateJobDto, UpdateJobDto } from '../types/job';

export const jobService = {
  // Get all jobs
  async getAll(): Promise<Job[]> {
    const response = await apiClient.get<Job[]>(APP_CONSTANTS.API.JOBS);
    return response.data;
  },

  // Get jobs by workspace
  async getByWorkspace(workspaceId: string): Promise<Job[]> {
    const response = await apiClient.get<Job[]>(APP_CONSTANTS.API.JOBS_BY_WORKSPACE(workspaceId));
    return response.data;
  },

  // Get job by ID
  async getById(id: string): Promise<Job> {
    const response = await apiClient.get<Job>(APP_CONSTANTS.API.JOB_BY_ID(id));
    return response.data;
  },

  // Create job
  async create(data: CreateJobDto): Promise<Job> {
    const response = await apiClient.post<Job>(APP_CONSTANTS.API.JOBS, data);
    return response.data;
  },

  // Update job (auto-save)
  async update(id: string, data: UpdateJobDto): Promise<Job> {
    const response = await apiClient.put<Job>(APP_CONSTANTS.API.JOB_BY_ID(id), data);
    return response.data;
  },

  // Delete job
  async delete(id: string): Promise<void> {
    await apiClient.delete(APP_CONSTANTS.API.JOB_BY_ID(id));
  },

  // Export job
  async export(id: string): Promise<Blob> {
    const response = await apiClient.get(APP_CONSTANTS.API.EXPORT_JOB(id), {
      responseType: 'blob',
    });
    return response.data;
  },

  async exportRecursive(id: string): Promise<Blob> {
      const response = await apiClient.get(APP_CONSTANTS.API.EXPORT_JOB_RECURSIVE(id), {
          responseType: 'blob'
      });
      return response.data;
  },

  // Import job
  async import(file: File, workspaceId: string): Promise<Job> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId);
    
    const response = await apiClient.post<Job>(APP_CONSTANTS.API.IMPORT_JOB, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Preview schedule
  async previewSchedule(cron: string): Promise<string[]> {
      const response = await apiClient.post<string[]>(APP_CONSTANTS.API.JOB_SCHEDULE_PREVIEW, { cron });
      return response.data;
  },

  async getUpcomingRuns(workspaceId: string, start: string, end: string): Promise<any[]> {
      const response = await apiClient.get<any[]>(`${APP_CONSTANTS.API.UPCOMING_SCHEDULES(workspaceId)}?start=${start}&end=${end}`);
      return response.data;
  },

  // Bulk Operations
  async bulkDelete(jobIds: string[]): Promise<{ count: number }> {
      const response = await apiClient.post(APP_CONSTANTS.API.BULK_DELETE_JOBS, { jobIds });
      return response.data;
  },

  async bulkExport(jobIds: string[]): Promise<Blob> {
      const response = await apiClient.post(APP_CONSTANTS.API.BULK_EXPORT_JOBS, { jobIds }, {
          responseType: 'blob'
      });
      return response.data;
  }
};
