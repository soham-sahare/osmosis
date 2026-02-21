import os
from sqlalchemy import create_engine, text

def get_engine(db_path):
    """Create a database engine via SQLAlchemy."""
    return create_engine(db_path)

def init_db(db_path):
    """Initialize the database with required tables using SQLAlchemy to support Postgres & SQLite."""
    # Create data directory if it's a local sqlite file
    if not db_path.startswith("postgresql://"):
        try:
            os.makedirs(os.path.dirname(db_path), exist_ok=True)
        except OSError as e:
            print(f"Skipping directory creation: {e}")
    
    engine = get_engine(db_path)
    
    with engine.connect() as conn:
        with conn.begin(): # Transaction
            # Create workspaces table
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS workspaces (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    created_at VARCHAR(255) NOT NULL,
                    updated_at VARCHAR(255) NOT NULL
                )
            '''))
            
            # Create jobs table
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS jobs (
                    id VARCHAR(255) PRIMARY KEY,
                    workspace_id VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    canvas_state TEXT,
                    schedule VARCHAR(255),
                    dependencies TEXT,
                    created_at VARCHAR(255) NOT NULL,
                    updated_at VARCHAR(255) NOT NULL,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
                )
            '''))
            
            # Create executions table
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS executions (
                    id VARCHAR(255) PRIMARY KEY,
                    job_id VARCHAR(255) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    trigger_type VARCHAR(50) DEFAULT 'MANUAL',
                    message TEXT,
                    logs TEXT,
                    start_time VARCHAR(255) NOT NULL,
                    end_time VARCHAR(255),
                    FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE
                )
            '''))
            
            # Create workspace_variables table
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS workspace_variables (
                    id VARCHAR(255) PRIMARY KEY,
                    workspace_id VARCHAR(255) NOT NULL,
                    key VARCHAR(255) NOT NULL,
                    value TEXT NOT NULL,
                    created_at VARCHAR(255) NOT NULL,
                    updated_at VARCHAR(255) NOT NULL,
                    is_secret INTEGER DEFAULT 0,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE,
                    UNIQUE(workspace_id, key)
                )
            '''))
            
            # Migrations
            try:
                conn.execute(text("SELECT trigger_type FROM executions LIMIT 1"))
            except Exception:
                print("Migrating executions table: adding trigger_type column")
                try:
                    conn.execute(text("ALTER TABLE executions ADD COLUMN trigger_type VARCHAR(50) DEFAULT 'MANUAL'"))
                except Exception as e:
                    print(f"Migration error: {e}")

            try:
                conn.execute(text("SELECT is_secret FROM workspace_variables LIMIT 1"))
            except Exception:
                print("Migrating workspace_variables table: adding is_secret column")
                try:
                    conn.execute(text("ALTER TABLE workspace_variables ADD COLUMN is_secret INTEGER DEFAULT 0"))
                except Exception as e:
                    print(f"Migration error: {e}")

            # Create indexes for better performance
            try:
                conn.execute(text('CREATE INDEX IF NOT EXISTS idx_jobs_workspace ON jobs(workspace_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS idx_executions_job ON executions(job_id)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS idx_executions_start ON executions(start_time DESC)'))
                conn.execute(text('CREATE INDEX IF NOT EXISTS idx_variables_workspace ON workspace_variables(workspace_id)'))
            except Exception as e:
                print(f"Error creating indexes: {e}")

    print(f"Database initialized at {db_path.split('@')[-1] if '@' in db_path else db_path}")
