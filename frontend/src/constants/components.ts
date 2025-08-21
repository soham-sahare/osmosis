import type { ComponentType } from "../types/job";

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  category: "input" | "output" | "transformation";
  icon: string;
  description: string;
  defaultConfig: Record<string, any>;
}

export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // Input Components
  {
    type: "database-reader",
    label: "Database Reader",
    category: "input",
    icon: "Database",
    description:
      "Read data from databases (MySQL, PostgreSQL, MongoDB, SQLite, Oracle)",
    defaultConfig: {
      useExistingConnection: false,
      connectionId: "",
      databaseType: "mysql",
      host: "localhost",
      port: 3306,
      database: "",
      username: "",
      password: "",
      query: "SELECT * FROM table_name",
    },
  },

  // Output Components
  {
    type: "database-writer",
    label: "Database Writer",
    category: "output",
    icon: "Database",
    description:
      "Write data to databases (MySQL, PostgreSQL, MongoDB, SQLite, Oracle)",
    defaultConfig: {
      useExistingConnection: false,
      connectionId: "",
      databaseType: "mysql",
      host: "localhost",
      port: 3306,
      database: "",
      username: "",
      password: "",
      table: "output_table",
    },
  },
  {
    type: "file-reader",
    label: "File Reader",
    category: "input",
    icon: "FileInput",
    description: "Read data from files (CSV, Excel, Parquet)",
    defaultConfig: {
      filePath: "",
      fileType: "delimited",
      delimiter: ",",
      encoding: "utf-8",
      headerRow: 1,
      footerRows: 0,
    },
  },
  {
    type: "file-writer",
    label: "File Writer",
    category: "output",
    icon: "FileOutput",
    description: "Write data to files (CSV, Excel, Parquet)",
    defaultConfig: {
      filePath: "",
      fileType: "delimited",
      delimiter: ",",
      encoding: "utf-8",
      headerRow: 1,
      footerRows: 0,
    },
  },
  {
    type: "filter",
    label: "Filter",
    category: "transformation",
    icon: "Filter",
    description: "Filter rows based on conditions",
    defaultConfig: {
      conditions: [{ column: "", operator: "equals", value: "" }],
      logic: "AND",
    },
  },
  {
    type: "aggregate",
    label: "Aggregate",
    category: "transformation",
    icon: "Calculator",
    description: "Perform aggregation operations (sum, count, avg, min, max)",
    defaultConfig: {
      groupByColumns: [],
      aggregations: [],
    },
  },
  {
    type: "sort",
    label: "Sort",
    category: "transformation",
    icon: "ArrowUpDown",
    description: "Sort data by one or more columns",
    defaultConfig: {
      sortBy: [],
    },
  },
  {
    type: "union",
    label: "Union",
    category: "transformation",
    icon: "Merge",
    description: "Combine multiple inputs into one dataset",
    defaultConfig: {
      mode: "all",
    },
  },
  {
    type: "log",
    label: "Log",
    category: "transformation",
    icon: "FileText",
    description: "Print data to execution logs for debugging",
    defaultConfig: {
      message: "Logging data...",
    },
  },
  {
    type: "map",
    label: "Map",
    category: "transformation",
    icon: "GitMerge",
    description: "Join and map columns",
    defaultConfig: {
      mappings: [],
      joinType: "left",
    },
  },
  {
    type: "uniq-row",
    label: "Unique Row",
    category: "transformation",
    icon: "Fingerprint",
    description: "Remove duplicate rows based on keys",
    defaultConfig: {
      uniqueKey: [], // List of columns
    },
  },
  {
    type: "normalize",
    label: "Normalize (Unpivot)",
    category: "transformation",
    icon: "Minimize2",
    description: "Unpivot columns to rows (Melt)",
    defaultConfig: {
      idColumns: [],
      valueColumns: [],
      varName: "variable",
      valueName: "value",
    },
  },
  {
    type: "denormalize",
    label: "Denormalize (Pivot)",
    category: "transformation",
    icon: "Maximize2",
    description: "Pivot rows to columns",
    defaultConfig: {
      indexColumns: [],
      pivotColumn: "",
      valueColumn: "",
      aggFunc: "first",
    },
  },
  {
    type: "row-generator",
    label: "Row Generator",
    category: "input",
    icon: "Zap",
    description: "Generate synthetic data for testing",
    defaultConfig: {
      rows: 10,
      fields: [],
    },
  },
  {
    type: "run-job",
    label: "Run Job",
    category: "transformation",
    icon: "PlayCircle",
    description: "Trigger another Osmosis job",
    defaultConfig: {
      jobId: "",
      waitForCompletion: true,
    },
  },
  {
    type: "java-row",
    label: "Script (Python)",
    category: "transformation",
    icon: "Code",
    description: "Execute custom Python code per row",
    defaultConfig: {
      code: '# row is a dict\n# return row or None\n# row["new_col"] = "value"\nreturn row',
    },
  },
  {
    type: "rest-client",
    label: "REST Client",
    category: "transformation",
    icon: "Globe",
    description: "Make HTTP requests",
    defaultConfig: {
      url: "https://api.example.com",
      method: "GET",
      headers: {},
      body: "{}",
    },
  },
  {
    type: "split-row",
    label: "Split Row",
    category: "transformation",
    icon: "Scissors",
    description: "Split one row into multiple rows",
    defaultConfig: {
      column: "",
      separator: ",",
    },
  },
  {
    type: "convert-type",
    label: "Convert Type",
    category: "transformation",
    icon: "RefreshCw",
    description: "Convert column data types",
    defaultConfig: {
      conversions: [],
    },
  },
  {
    type: "kafka-input",
    label: "Kafka Input",
    category: "input",
    icon: "RadioReceiver", // customized later
    description: "Consume messages from Kafka topic",
    defaultConfig: {
      bootstrapServers: "localhost:9092",
      topic: "",
      groupId: "",
      autoOffsetReset: "earliest",
    },
  },
  {
    type: "kafka-output",
    label: "Kafka Output",
    category: "output",
    icon: "Radio",
    description: "Produce messages to Kafka topic",
    defaultConfig: {
      bootstrapServers: "localhost:9092",
      topic: "",
    },
  },
];

export const getComponentDefinition = (
  type: ComponentType,
): ComponentDefinition | undefined => {
  return COMPONENT_DEFINITIONS.find((def) => def.type === type);
};

export const getComponentsByCategory = (
  category: "input" | "output" | "transformation",
): ComponentDefinition[] => {
  return COMPONENT_DEFINITIONS.filter((def) => def.category === category);
};
