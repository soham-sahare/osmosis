import uuid
from datetime import datetime
from app.utils.db import Database

class WorkspaceService:
    def __init__(self, db_path):
        self.db = Database(db_path)
        from app.services.connection_service import ConnectionService
        self.connection_service = ConnectionService()
        from app.services.job_service import JobService
        self.job_service = JobService(db_path)
    
    def get_all(self):
        """Get all workspaces."""
        rows = self.db.fetch_all('SELECT * FROM workspaces ORDER BY created_at DESC')
        
        return [{
            'id': row['id'],
            'name': row['name'],
            'description': row['description'],
            'createdAt': row['created_at'],
            'updatedAt': row['updated_at'],
            'createdAt': row['created_at'],
            'updatedAt': row['updated_at']
        } for row in rows]
    
    def export_workspace(self, workspace_id):
        """Export workspace and all related assets."""
        workspace = self.get_by_id(workspace_id)
        if not workspace:
            return None
            
        variables = self.get_variables(workspace_id)
        connections = self.connection_service.get_all_connections(workspace_id)
        jobs = self.job_service.get_by_workspace(workspace_id) # Needs to be full jobs, not summaries
        
        return {
            "type": "workspace_export",
            "version": "1.0",
            "workspace": workspace,
            "variables": variables,
            "connections": connections,
            "jobs": jobs,
            "exported_at": datetime.utcnow().isoformat()
        }
    
    def get_by_id(self, workspace_id):
        """Get workspace by ID."""
        row = self.db.fetch_one('SELECT * FROM workspaces WHERE id = :id', {'id': workspace_id})
        
        if not row:
            return None
            
        return {
            'id': row['id'],
            'name': row['name'],
            'description': row['description'],
            'createdAt': row['created_at'],
            'updatedAt': row['updated_at']
        }
    
    def create(self, name, description=''):
        """Create a new workspace."""
        workspace_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        self.db.execute('''
            INSERT INTO workspaces (id, name, description, created_at, updated_at)
            VALUES (:id, :name, :description, :created_at, :updated_at)
        ''', {'id': workspace_id, 'name': name, 'description': description, 'created_at': now, 'updated_at': now})
        
        return {
            'id': workspace_id,
            'name': name,
            'description': description,
            'createdAt': now,
            'updatedAt': now
        }
    
    def update(self, workspace_id, name=None, description=None):
        """Update workspace."""
        current = self.db.fetch_one('SELECT * FROM workspaces WHERE id = ?', (workspace_id,))
        if not current:
            return None
        
        updated_name = name if name is not None else current['name']
        updated_desc = description if description is not None else current['description']
        now = datetime.utcnow().isoformat()
        
        self.db.execute('''
            UPDATE workspaces
            SET name = :name, description = :description, updated_at = :updated_at
            WHERE id = :id
        ''', {'name': updated_name, 'description': updated_desc, 'updated_at': now, 'id': workspace_id})
        
        return {
            'id': workspace_id,
            'name': updated_name,
            'description': updated_desc,
            'createdAt': current['created_at'],
            'updatedAt': now
        }
    
    def delete(self, workspace_id):
        """Delete workspace."""
        cursor = self.db.execute('DELETE FROM workspaces WHERE id = :id', {'id': workspace_id})
        return cursor.rowcount > 0

    def bulk_delete(self, workspace_ids):
        """Bulk delete workspaces."""
        if not workspace_ids:
            return 0
        
        count = 0
        # Determine if we can do a single query or need loop. 
        # For safety with the unknown db wrapper implementation details regarding lists, loop is safest.
        for wid in workspace_ids:
            if self.delete(wid):
                count += 1
        return count

    def get_variables(self, workspace_id):
        """Get all variables for a workspace."""
        rows = self.db.fetch_all('SELECT * FROM workspace_variables WHERE workspace_id = :workspace_id ORDER BY key ASC', {'workspace_id': workspace_id})
        return [{
            'id': row['id'],
            'key': row['key'],
            'value': row['value'],
            'isSecret': bool(row.get('is_secret', 0)),
            'createdAt': row['created_at'],
            'updatedAt': row['updated_at']
        } for row in rows]

    def create_variable(self, workspace_id, key, value, is_secret=False):
        """Create a new variable."""
        var_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Check if exists
        existing = self.db.fetch_one('SELECT * FROM workspace_variables WHERE workspace_id = :id AND key = :key', {'id': workspace_id, 'key': key})
        if existing:
            raise Exception(f"Variable '{key}' already exists in this workspace")
            
        self.db.execute('''
            INSERT INTO workspace_variables (id, workspace_id, key, value, is_secret, created_at, updated_at)
            VALUES (:id, :workspace_id, :key, :value, :is_secret, :created_at, :updated_at)
        ''', {'id': var_id, 'workspace_id': workspace_id, 'key': key, 'value': value, 'is_secret': 1 if is_secret else 0, 'created_at': now, 'updated_at': now})
        
        return {
            'id': var_id,
            'workspaceId': workspace_id,
            'key': key,
            'value': value,
            'isSecret': is_secret,
            'createdAt': now,
            'updatedAt': now
        }

    def update_variable(self, workspace_id, key, value=None, is_secret=None):
        """Update a variable."""
        # Check if exists
        existing = self.db.fetch_one('SELECT * FROM workspace_variables WHERE workspace_id = :id AND key = :key', {'id': workspace_id, 'key': key})
        if not existing:
             return None
             
        now = datetime.utcnow().isoformat()
        
        current_val = value if value is not None else existing['value']
        current_secret = is_secret if is_secret is not None else existing.get('is_secret', 0)
        
        self.db.execute('''
            UPDATE workspace_variables
            SET value = :value, is_secret = :is_secret, updated_at = :updated_at
            WHERE workspace_id = :workspace_id AND key = :key
        ''', {'value': current_val, 'is_secret': 1 if current_secret else 0, 'updated_at': now, 'workspace_id': workspace_id, 'key': key})
        
        return {
            'id': existing['id'],
            'workspaceId': workspace_id,
            'key': key,
            'value': current_val,
            'isSecret': bool(current_secret),
            'createdAt': existing['created_at'],
            'updatedAt': now
        }
    
    def delete_variable(self, workspace_id, key):
        """Delete a variable."""
        cursor = self.db.execute('DELETE FROM workspace_variables WHERE workspace_id = :id AND key = :key', {'id': workspace_id, 'key': key})
        return cursor.rowcount > 0
