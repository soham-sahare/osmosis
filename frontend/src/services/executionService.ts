import { apiClient } from './api';
import { APP_CONSTANTS } from '../constants/app';
interface ExecutionResult {
  status: 'success' | 'failed';
  logs: any[];
  error?: string;
}

export const executionService = {
  // Execute job
  async executeJob(jobId: string): Promise<ExecutionResult> {
    const response = await apiClient.post<ExecutionResult>(APP_CONSTANTS.API.EXECUTE_JOB(jobId));
    return response.data;
  },

  // Get executions by workspace
  async getExecutionsByWorkspace(workspaceId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(APP_CONSTANTS.API.EXECUTIONS_BY_WORKSPACE(workspaceId));
    return response.data;
  },

  // Get single execution
  async getExecutionById(executionId: string): Promise<any> {
    const response = await apiClient.get<any>(APP_CONSTANTS.API.EXECUTION_BY_ID(executionId));
    return response.data;
  },

  // Get executions by job
  async getExecutionsByJob(jobId: string, limit: number = 5): Promise<any[]> {
    const response = await apiClient.get<any[]>(`${APP_CONSTANTS.API.EXECUTIONS_BY_JOB(jobId)}?limit=${limit}`);
    return response.data;
  },
};
