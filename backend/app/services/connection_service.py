"""
Database Connection Storage Service
Manages saved database connections for reuse across jobs
"""
import json
import os
from typing import Dict, List, Any, Optional
from pathlib import Path

class ConnectionService:
    """Service for managing saved database connections"""
    
    def __init__(self, workspace_dir: str = "workspaces"):
        self.workspace_dir = workspace_dir
    
    def _get_connections_file(self, workspace_id: str) -> Path:
        """Get the path to the connections file for a workspace"""
        workspace_path = Path(self.workspace_dir) / workspace_id
        workspace_path.mkdir(parents=True, exist_ok=True)
        return workspace_path / "connections.json"
    
    def get_all_connections(self, workspace_id: str) -> List[Dict[str, Any]]:
        """Get all saved connections for a workspace"""
        connections_file = self._get_connections_file(workspace_id)
        
        if not connections_file.exists():
            return []
        
        try:
            with open(connections_file, 'r') as f:
                data = json.load(f)
                return data.get('connections', [])
        except Exception as e:
            print(f"Error reading connections: {e}")
            return []
    
    def get_connection(self, workspace_id: str, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific connection by ID"""
        connections = self.get_all_connections(workspace_id)
        for conn in connections:
            if conn.get('id') == connection_id:
                return conn
        return None
    
    def save_connection(self, workspace_id: str, connection_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a new connection or update existing one"""
        connections = self.get_all_connections(workspace_id)
        
        # Generate ID if not provided
        if 'id' not in connection_data:
            connection_data['id'] = f"conn_{len(connections) + 1}_{os.urandom(4).hex()}"
        
        # Check if updating existing connection
        existing_index = None
        for i, conn in enumerate(connections):
            if conn.get('id') == connection_data['id']:
                existing_index = i
                break
        
        if existing_index is not None:
            connections[existing_index] = connection_data
        else:
            connections.append(connection_data)
        
        # Save to file
        connections_file = self._get_connections_file(workspace_id)
        with open(connections_file, 'w') as f:
            json.dump({'connections': connections}, f, indent=2)
        
        return connection_data
    
    def delete_connection(self, workspace_id: str, connection_id: str) -> bool:
        """Delete a connection"""
        connections = self.get_all_connections(workspace_id)
        
        # Filter out the connection to delete
        new_connections = [conn for conn in connections if conn.get('id') != connection_id]
        
        if len(new_connections) == len(connections):
            return False  # Connection not found
        
        # Save updated list
        connections_file = self._get_connections_file(workspace_id)
        with open(connections_file, 'w') as f:
            json.dump({'connections': new_connections}, f, indent=2)
        
        return True
    
    def test_connection(self, connection_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test a database or file system connection"""
        from app.services.db_connection_service import db_connection_service
        from app.services.file_system_service import FileSystemService
        
        try:
            method = connection_data.get('connectionMethod', '').lower()
            
            # Route to FileSystemService if it's a file mount
            if method in ['ssh', 'sftp', 's3', 'hdfs']:
                fs_service = FileSystemService()
                
                # Resolve passwords before testing
                from app.utils.password_resolver import PasswordResolver, resolve_password
                # Note: We need workspace_id to resolve context variables. 
                # If not passed in connection_data (it usually isn't during creation test), 
                # we might be limited to non-variable passwords or need to pass workspace_id from UI
                
                # Check if workspaceId is in metadata or we extract from context if added later
                workspace_id = connection_data.get('workspaceId')
                
                resolver = PasswordResolver(None) # TODO: Pass variables if we have workspace_id
                if workspace_id:
                     from app.utils.context_variables import load_context_variables
                     vars = load_context_variables(workspace_id)
                     resolver = PasswordResolver(vars)
                
                resolved_config = resolver.resolve_connection_config(connection_data)
                
                return fs_service.test_connection(resolved_config)
            
            # Default to Database test
            # Try a simple query to test connection
            result = db_connection_service.preview_database(
                connection_data,
                connection_data.get('testQuery', 'SELECT 1'),
                limit=1
            )
            return {
                'success': True,
                'message': 'Connection successful'
            }
        except Exception as e:
            return {
                'success': False,
                'message': str(e)
            }

# Global instance
connection_service = ConnectionService()
