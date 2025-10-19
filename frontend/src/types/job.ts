import type { Node, Edge } from 'reactflow';

// Job types
export interface Job {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  canvasState?: CanvasState | null;
  schedule?: string | null;
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
  missingDependencies?: string[];
}

export interface CanvasState {
  nodes: Node<ComponentData>[];
  edges: Edge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface ComponentData {
  label: string;
  type: ComponentType;
  config: ComponentConfig;
  schema?: ColumnSchema[];
  status?: 'idle' | 'pending' | 'running' | 'success' | 'error';
}

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'integer' | 'boolean' | 'date';
  nullable?: boolean;
  value?: string;
}

export type ComponentType =
  | 'database-reader'
  | 'database-writer'
  | 'mysql-reader'
  | 'mysql-writer'
  | 'postgresql-reader'
  | 'postgresql-writer'
  | 'mongodb-reader'
  | 'mongodb-writer'
  | 'file-reader'
  | 'file-writer'
  | 'filter'
  | 'aggregate'
  | 'sort'
  | 'union'
  | 'map'
  | 'log'
  | 'uniq-row'
  | 'normalize'
  | 'denormalize'
  | 'run-job'
  | 'java-row'
  | 'row-generator'
  | 'rest-client'
  | 'split-row'
  | 'convert-type'
  | 'kafka-input'
  | 'kafka-output';

export interface ComponentConfig {
  // Connection config
  name?: string;
  connectionMethod?: 'native' | 'jdbc' | 'mongo';
  authType?: 'none' | 'userpass' | 'kerberos';
  connectionId?: string;
  useExistingConnection?: boolean;
  
  // Database config
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  query?: string;
  table?: string;
  databaseType?: string;
  dbType?: string;
  
  // File config
  filePath?: string;
  fileType?: 'delimited' | 'excel' | 'parquet' | 'json';
  delimiter?: string;
  hasHeader?: boolean;
  encoding?: string;
  sheetName?: string;
  headerRow?: number;
  footerRows?: number;
  
  // Filter config
  conditions?: Array<{
    column: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with';
    value: string;
  }>;
  logic?: 'AND' | 'OR';
  
  // Aggregate config
  groupByColumns?: string[];
  aggregations?: Array<{
    column: string;
    function: 'sum' | 'count' | 'avg' | 'min' | 'max';
    alias?: string;
  }>;
  
  // Sort config
  sortBy?: Array<{
    column: string;
    direction: 'asc' | 'desc';
  }>;
  
  // Union config
  mode?: 'all' | 'distinct';
  
  // Map config
  mappings?: Array<{
    targetColumn: string;
    expression?: string;
  }>;
  // Configuration for each input (lookup) node
  inputJoinConfigs?: Record<string, { // Key is Node ID
      type: 'inner' | 'left' | 'full';
      keys: Array<{
          leftColumn: string; // e.g. "row1.id"
          rightColumn: string; // e.g. "id" (column in the lookup node)
      }>;
  }>;
  // Configuration for multiple outputs
  outputs?: Record<string, { // Key is Output Name (e.g. "out1")
      mappings: Array<{
          targetColumn: string;
          expression?: string;
      }>;
      schema: ColumnSchema[];
  }>;
  
  // Log config
  message?: string;
  
  // Common
  [key: string]: any;
}

export interface CreateJobDto {
  workspaceId: string;
  name: string;
  description: string;
}

export interface UpdateJobDto {
  name?: string;
  description?: string;
  canvasState?: CanvasState;
  schedule?: string | null;
  dependencies?: string[];
}

export interface ExecutionResult {
  jobId: string;
  status: 'success' | 'error';
  message: string;
  logs: ExecutionLog[];
  startTime: string;
  endTime: string;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  componentId?: string;
}
