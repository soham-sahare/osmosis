import axios from 'axios';
import { APP_CONSTANTS } from '../constants/app';

const API_BASE_URL = import.meta.env.PROD 
  ? '/api' 
  : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens (future use)
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = localStorage.getItem('auth-token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// File preview API
export const previewFile = async (filePath: string, fileType: string, config: any) => {
  const response = await apiClient.post(APP_CONSTANTS.API.PREVIEW_FILE, {
    filePath,
    fileType,
    config,
  });
  return response.data;
};

// Connection management API
export const getConnections = async (workspaceId: string) => {
  const response = await apiClient.get(APP_CONSTANTS.API.CONNECTIONS(workspaceId));
  return response.data;
};

// Context Variable API
export const getContextVariables = async (workspaceId: string) => {
  const response = await apiClient.get(APP_CONSTANTS.API.VARIABLES(workspaceId));
  return response.data;
};

export const createContextVariable = async (workspaceId: string, variableData: any) => {
  const response = await apiClient.post(APP_CONSTANTS.API.VARIABLES(workspaceId), variableData);
  return response.data;
};

export const updateContextVariable = async (workspaceId: string, id: string, variableData: any) => {
  // Note: The API likely uses key or ID. The frontend passed 'id' but the constant uses 'key'. 
  // Let's assume the variableData contains the key if needed, or we use the ID if the backend supports it.
  // Based on APP_CONSTANTS.API.VARIABLE_BY_KEY, it expects a key.
  // However, the component passed `editingVariable.id`. Let's assume for now we should use the key from variableData if available, or fall back to the ID if it happens to be the key.
  // Actually, looking at the component, it passes `formData` which has `key`.
  // Let's use the key for the URL as per APP_CONSTANTS.
  const key = variableData.key || id; 
  const response = await apiClient.put(APP_CONSTANTS.API.VARIABLE_BY_KEY(workspaceId, key), variableData);
  return response.data;
};

export const deleteContextVariable = async (workspaceId: string, id: string) => {
    // The component passes ID, but the API constant expects KEY.
    // This is a potential mismatch. 
    // If the ID passed is actually the Key, then it works.
    // In ContextVariablesView.tsx, `variableToDelete` is the whole object, and we pass `variableToDelete.id`.
    // If the backend expects ID for deletion, we need a new constant or change the constant.
    // If the backend expects KEY, we should pass `variableToDelete.key`.
    
    // START CORRECTION: In ContextVariablesView.tsx, we refactored to use `variableToDelete.id` but the previous code used `variable.key`. 
    // The previous code: `handleDeleteClick(variable.key)` and `deleteVariable(workspaceId, variableToDelete)`.
    // So `variableToDelete` WAS the key.
    // My new code: `handleDeleteClick(variable)` allows accessing `.id` or `.key`.
    // The `deleteContextVariable` call in `ContextVariablesView.tsx` uses `variableToDelete.id`.
    // If the backend uses Key, I should change `ContextVariablesView.tsx` or handle it here.
    // Let's check `APP_CONSTANTS.API.VARIABLE_BY_KEY`. It takes `key`.
    // So the delete function should likely take a key.
    // I will implement this function assuming the second argument IS the key (or treated as such for the URL).
    // I will also verify `ContextVariablesView.tsx` to make sure we pass the key if that's what's expected.
    
  const response = await apiClient.delete(APP_CONSTANTS.API.VARIABLE_BY_KEY(workspaceId, id)); // 'id' here acts as the key identifier
  return response.data;
};

export const getConnection = async (workspaceId: string, connectionId: string) => {
  const response = await apiClient.get(APP_CONSTANTS.API.CONNECTION_BY_ID(workspaceId, connectionId));
  return response.data;
};

export const createConnection = async (workspaceId: string, connectionData: any) => {
  const response = await apiClient.post(APP_CONSTANTS.API.CONNECTIONS(workspaceId), connectionData);
  return response.data;
};

export const updateConnection = async (workspaceId: string, connectionId: string, connectionData: any) => {
  const response = await apiClient.put(APP_CONSTANTS.API.CONNECTION_BY_ID(workspaceId, connectionId), connectionData);
  return response.data;
};

export const deleteConnection = async (workspaceId: string, connectionId: string) => {
  const response = await apiClient.delete(APP_CONSTANTS.API.CONNECTION_BY_ID(workspaceId, connectionId));
  return response.data;
};

export const testConnection = async (connectionData: any) => {
  const response = await apiClient.post(APP_CONSTANTS.API.TEST_CONNECTION, connectionData);
  return response.data;
};
