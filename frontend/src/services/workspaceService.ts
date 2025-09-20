import { apiClient } from './api';
import { APP_CONSTANTS } from '../constants/app';
import type { Workspace, CreateWorkspaceDto, UpdateWorkspaceDto, WorkspaceVariable, CreateVariableDto, UpdateVariableDto } from '../types/workspace';

export const workspaceService = {
  // Get all workspaces
  async getAll(): Promise<Workspace[]> {
    const response = await apiClient.get<Workspace[]>(APP_CONSTANTS.API.WORKSPACES);
    return response.data;
  },

  // Get workspace by ID
  async getById(id: string): Promise<Workspace> {
    const response = await apiClient.get<Workspace>(APP_CONSTANTS.API.WORKSPACE_BY_ID(id));
    return response.data;
  },

  // Create workspace
  async create(data: CreateWorkspaceDto): Promise<Workspace> {
    const response = await apiClient.post<Workspace>(APP_CONSTANTS.API.WORKSPACES, data);
    return response.data;
  },

  // Update workspace
  async update(id: string, data: UpdateWorkspaceDto): Promise<Workspace> {
    const response = await apiClient.put<Workspace>(APP_CONSTANTS.API.WORKSPACE_BY_ID(id), data);
    return response.data;
  },

  // Delete workspace
  async delete(id: string): Promise<void> {
    await apiClient.delete(APP_CONSTANTS.API.WORKSPACE_BY_ID(id));
  },

  // Variables
  async getVariables(workspaceId: string): Promise<WorkspaceVariable[]> {
    const response = await apiClient.get<WorkspaceVariable[]>(APP_CONSTANTS.API.VARIABLES(workspaceId));
    return response.data;
  },

  async createVariable(workspaceId: string, data: CreateVariableDto): Promise<WorkspaceVariable> {
     const response = await apiClient.post<WorkspaceVariable>(APP_CONSTANTS.API.VARIABLES(workspaceId), data);
     return response.data;
  },

  async updateVariable(workspaceId: string, key: string, data: UpdateVariableDto): Promise<WorkspaceVariable> {
     const response = await apiClient.put<WorkspaceVariable>(APP_CONSTANTS.API.VARIABLE_BY_KEY(workspaceId, key), data);
     return response.data;
  },

  async deleteVariable(workspaceId: string, key: string): Promise<void> {
     await apiClient.delete(APP_CONSTANTS.API.VARIABLE_BY_KEY(workspaceId, key));
  },

  async export(id: string): Promise<Blob> {
      const response = await apiClient.get(APP_CONSTANTS.API.EXPORT_WORKSPACE(id), {
          responseType: 'blob'
      });
      return response.data;
  },

  async bulkDelete(workspaceIds: string[]): Promise<number> {
      const response = await apiClient.post<{ deletedCount: number }>('/workspaces/bulk/delete', { workspaceIds });
      return response.data.deletedCount;
  },
};

