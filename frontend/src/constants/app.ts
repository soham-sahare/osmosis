export const APP_CONSTANTS = {
  FILE_EXTENSIONS: {
    EXPORT: '.osmosis',
    IMPORT: '.osmosis',
    IMPORT_ACCEPT: '.osmosis',
  },
  DATE_FORMAT: {
    DISPLAY: 'DD-MON-YY HH:MM:ss AM/PM',
  },
  TOAST_MESSAGES: {
    JOB: {
      CREATE_SUCCESS: 'Job created successfully',
      CREATE_ERROR: 'Failed to create job',
      UPDATE_SUCCESS: 'Job updated successfully',
      UPDATE_ERROR: 'Failed to update job',
      DELETE_SUCCESS: 'Job deleted successfully',
      DELETE_ERROR: 'Failed to delete job',
      IMPORT_SUCCESS: 'Job imported successfully',
      IMPORT_ERROR: 'Failed to import job',
      EXPORT_SUCCESS: 'Job exported successfully',
      EXPORT_ERROR: 'Failed to export job',
      DUPLICATE_NAME: (name: string) => `A job with the name "${name}" already exists.`,
      INVALID_FILE: 'Invalid file format. Please use a valid .osmosis file.',
      READ_ERROR: 'Failed to read file',
    },
    WORKSPACE: {
      CREATE_SUCCESS: 'Workspace created successfully',
      CREATE_ERROR: 'Failed to create workspace',
      UPDATE_SUCCESS: 'Workspace updated successfully',
      UPDATE_ERROR: 'Failed to update workspace',
      DELETE_SUCCESS: 'Workspace deleted successfully',
      DELETE_ERROR: 'Failed to delete workspace',
    }
  },
  API: {
    // Workspace endpoints
    WORKSPACES: '/workspaces',
    WORKSPACE_BY_ID: (id: string) => `/workspaces/${id}`,
    
    // Variable endpoints
    VARIABLES: (workspaceId: string) => `/workspaces/${workspaceId}/variables`,
    VARIABLE_BY_KEY: (workspaceId: string, key: string) => `/workspaces/${workspaceId}/variables/${key}`,
    
    // Job endpoints
    JOBS: '/jobs',
    JOB_BY_ID: (id: string) => `/jobs/${id}`,
    JOBS_BY_WORKSPACE: (workspaceId: string) => `/workspaces/${workspaceId}/jobs`,
    
    // Execution endpoints
    EXECUTE_JOB: (jobId: string) => `/jobs/${jobId}/execute`,
    EXECUTIONS_BY_WORKSPACE: (workspaceId: string) => `/workspaces/${workspaceId}/executions`,
    EXECUTION_BY_ID: (id: string) => `/executions/${id}`,
    EXECUTIONS_BY_JOB: (jobId: string) => `/jobs/${jobId}/executions`,
    
    // Scheduler endpoints
    JOB_SCHEDULE_PREVIEW: '/jobs/schedule/preview',
    UPCOMING_SCHEDULES: (workspaceId: string) => `/workspaces/${workspaceId}/schedules/upcoming`,
    
    // Import/Export endpoints
    EXPORT_JOB: (jobId: string) => `/jobs/${jobId}/export`,
    EXPORT_JOB_RECURSIVE: (jobId: string) => `/jobs/${jobId}/export/recursive`,
    EXPORT_WORKSPACE: (workspaceId: string) => `/workspaces/${workspaceId}/export`,
    BULK_EXPORT_JOBS: '/jobs/bulk/export',
    BULK_DELETE_JOBS: '/jobs/bulk/delete',
    IMPORT_JOB: '/jobs/import',

    // Connection endpoints
    CONNECTIONS: (workspaceId: string) => `/workspaces/${workspaceId}/connections`,
    CONNECTION_BY_ID: (workspaceId: string, connectionId: string) => `/workspaces/${workspaceId}/connections/${connectionId}`,
    TEST_CONNECTION: '/connections/test',

    // File endpoints
    PREVIEW_FILE: '/files/preview',
    UPLOAD_JDBC_DRIVER: '/upload-jdbc-driver',
  },
  STORAGE: {
    THEME: 'osmosis-theme',
    LAST_WORKSPACE: 'osmosis-last-workspace',
    LAST_JOB: 'osmosis-last-job',
  }
};
