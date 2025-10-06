import os
from sqlalchemy import create_engine, text

from config.settings import config

def get_db_path():
    return config.DATABASE_PATH

class Database:
    def __init__(self, db_path):
        self.db_path = db_path
        # Use simple sqlite prefix. For absolute paths in sqlite with sqlalchemy, 3 slashes are needed for relative, 4 for absolute.
        # But here 'db_path' might be relative './data/...'. 
        # SQLAlchemy sqlite:////absolute/path or sqlite:///relative/path
        if os.path.isabs(db_path):
             self.engine = create_engine(f'sqlite:///{db_path}')
        else:
             self.engine = create_engine(f'sqlite:///{db_path}')

    def get_connection(self):
        return self.engine.connect()

    def fetch_all(self, query, params={}):
        with self.get_connection() as conn:
            result = conn.execute(text(query), params)
            # Row mapping to dict
            return [dict(row._mapping) for row in result]

    def fetch_one(self, query, params={}):
        with self.get_connection() as conn:
            result = conn.execute(text(query), params)
            row = result.fetchone()
            return dict(row._mapping) if row else None

    def execute(self, query, params={}):
        with self.get_connection() as conn:
            result = conn.execute(text(query), params)
            conn.commit()
            return result
