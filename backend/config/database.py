import sqlite3
import os
import json
from datetime import datetime

def get_db_connection(db_path):
    """Create a database connection."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path):
    """Initialize the database with required tables."""
    # Create data directory if it doesn't exist
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    
    # Create workspaces table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
    # Create jobs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            canvas_state TEXT,
            schedule TEXT,
            dependencies TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
        )
    ''')
    
    # Create executions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS executions (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            status TEXT NOT NULL,
            trigger_type TEXT DEFAULT 'MANUAL',
            message TEXT,
            logs TEXT,
            start_time TEXT NOT NULL,
            end_time TEXT,
            FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
        )
    ''')
    
    # Create workspace_variables table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS workspace_variables (
            id TEXT PRIMARY KEY,
            workspace_id TEXT NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            is_secret INTEGER DEFAULT 0,
            FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
            UNIQUE(workspace_id, key)
        )
    ''')
    
    # Check for missing columns in existing tables (Migration)
    try:
        cursor.execute("SELECT trigger_type FROM executions LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating executions table: adding trigger_type column")
        cursor.execute("ALTER TABLE executions ADD COLUMN trigger_type TEXT DEFAULT 'MANUAL'")

    try:
        cursor.execute("SELECT is_secret FROM workspace_variables LIMIT 1")
    except sqlite3.OperationalError:
        print("Migrating workspace_variables table: adding is_secret column")
        cursor.execute("ALTER TABLE workspace_variables ADD COLUMN is_secret INTEGER DEFAULT 0")

    # Create indexes for better performance
    try:
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_jobs_workspace ON jobs(workspace_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_executions_job ON executions(job_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_executions_start ON executions(start_time DESC)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_variables_workspace ON workspace_variables(workspace_id)')
    except Exception as e:
        print(f"Error creating indexes: {e}")

    conn.commit()
    conn.close()
    
    print(f"Database initialized at {db_path}")
