// Workspace types
export interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceDto {
  name: string;
  description: string;
}

export interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
}

export interface WorkspaceVariable {
  id: string;
  workspaceId: string;
  key: string;
  value: string;
  isSecret?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVariableDto {
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface UpdateVariableDto {
  value: string;
  isSecret?: boolean;
}
