import fsspec
import os

class FileSystemService:
    """Service to handle filesystem abstraction using fsspec."""
    
    def get_filesystem(self, connection_config):
        """
        Get an initialized fsspec filesystem object based on connection config.
        
        Args:
            connection_config: Dictionary containing connection details
            
        Returns:
            fsspec.AbstractFileSystem: Initialized filesystem object
        """
        if not connection_config:
            # Default to local filesystem
            return fsspec.filesystem('file')
            
        method = connection_config.get('connectionMethod', 'native')
        # Handle case where method might be stored as 'ssh' or 'sftp' directly in some contexts
        # but our standardized 'connectionMethod' might be different. 
        # Based on previous design, we should add 'ssh', 's3', 'hdfs' to valid methods.
        
        if method == 'ssh' or method == 'sftp':
            # SSH / SFTP Connection
            # Requires 'paramiko' to be installed
            
            # Map simplified config keys to fsspec sftp options
            # connection_config should have: host, port, username, password/key
            
            client_kwargs = {}
            
            # Handle key-based auth if provided (simplified for now)
            # In a real app, we might need to write the key to a temp file or use StringIO
            # paramiko supports 'pkey' object or 'key_filename'
            
            return fsspec.filesystem(
                'sftp',
                host=connection_config.get('host'),
                port=int(connection_config.get('port', 22)),
                username=connection_config.get('username'),
                password=connection_config.get('password')
                # TODO: Support SSH keys via 'key_filename' or 'pkey'
            )
            
        elif method == 's3':
            # S3 Connection
            # Requires 's3fs' to be installed
            
            s3_kwargs = {
                'key': connection_config.get('accessKey'),
                'secret': connection_config.get('secretKey'),
            }
            
            region = connection_config.get('region')
            if region:
                s3_kwargs['client_kwargs'] = {'region_name': region}
                
            endpoint = connection_config.get('endpoint') # For MinIO or S3 compatible
            if endpoint:
                s3_kwargs['endpoint_url'] = endpoint
            
            return fsspec.filesystem('s3', **s3_kwargs)
            
        elif method == 'hdfs':
            # HDFS Connection
            # Requires 'pyarrow' usually
            return fsspec.filesystem(
                'hdfs',
                host=connection_config.get('host'),
                port=int(connection_config.get('port', 8020)),
                user=connection_config.get('username')
            )
            
        else:
            # Default / Local
            return fsspec.filesystem('file') 

    def open_file(self, connection_config, file_path, mode='rb'):
        """
        Open a file from the configured filesystem.
        
        Args:
            connection_config: Connection details
            file_path: Path to the file (relative to FS root or absolute)
            mode: Mode to open file in
            
        Returns:
            File-like object
        """
        fs = self.get_filesystem(connection_config)
        return fs.open(file_path, mode)

    def test_connection(self, connection_config):
        """
        Test validity of a filesystem connection.
        """
        try:
            fs = self.get_filesystem(connection_config)
            
            # Perform a lightweight operation to verify connectivity
            method = connection_config.get('connectionMethod')
            
            if method == 's3':
               bucket = connection_config.get('bucket', '')
               if bucket:
                   fs.ls(bucket) # List bucket root
               else:
                   # If no bucket specific, might fail strict permissions but try listing
                   pass 
            elif method == 'ssh' or method == 'sftp':
                 # List default directory (usually user home)
                 fs.ls('.') 
            else:
                 # Local or HDFS
                 fs.ls('/')
                 
            return {'success': True, 'message': 'Connection successful'}
        except Exception as e:
            return {'success': False, 'message': f'Connection failed: {str(e)}'}
