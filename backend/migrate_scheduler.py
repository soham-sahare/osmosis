import sqlite3
import os

DB_PATH = os.getenv('DATABASE_PATH', './data/osmosis.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    print("Migrating database...")
    
    # Check if columns exist
    cursor.execute("PRAGMA table_info(jobs)")
    columns = [info[1] for info in cursor.fetchall()]
    
    if 'schedule' not in columns:
        print("Adding 'schedule' column...")
        cursor.execute("ALTER TABLE jobs ADD COLUMN schedule TEXT")
        
    if 'dependencies' not in columns:
        print("Adding 'dependencies' column...")
        cursor.execute("ALTER TABLE jobs ADD COLUMN dependencies TEXT")
        
    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == '__main__':
    migrate()
