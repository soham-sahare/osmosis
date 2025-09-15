"""
Database routes
"""
from flask import Blueprint, request, jsonify
from app.services.db_connection_service import db_connection_service
import os

database_bp = Blueprint('database', __name__)

@database_bp.route('/preview-database', methods=['POST'])
def preview_database():
    """
    Preview database query with sample data and schema
    
    Request body:
    {
        "dbType": "mysql|postgresql|oracle|impala|mongodb",
        "connectionMethod": "native|jdbc|mongo|auto",
        "config": {
            // Native connection
            "host": "localhost",
            "port": 3306,
            "database": "mydb",
            "username": "user",
            "password": "pass",
            
            // JDBC connection
            "jdbcDriver": "com.cloudera.impala.jdbc.Driver",
            "jdbcUrl": "jdbc:impala://host:21050/default",
            "jdbcJarPath": "ImpalaJDBC42.jar",
            
            // Kerberos
            "useKerberos": true,
            "kerberosPrincipal": "user@REALM",
            "kerberosKeytab": "/path/to/keytab"
        },
        "query": "SELECT * FROM users"
    }
    
    Response:
    {
        "data": [...],
        "schema": [...],
        "totalRows": 5
    }
    """
    try:
        data = request.get_json()
        config = data.get('config', {})
        config['dbType'] = data.get('dbType', 'mysql')
        config['connectionMethod'] = data.get('connectionMethod', 'auto')
        
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        # Execute preview query
        result = db_connection_service.preview_database(config, query, limit=5)
        
        return jsonify(result), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@database_bp.route('/upload-jdbc-driver', methods=['POST'])
def upload_jdbc_driver():
    """
    Upload JDBC driver JAR file
    
    Request: multipart/form-data
    - file: JAR file
    
    Response:
    {
        "filename": "driver.jar",
        "path": "jdbc_drivers/driver.jar"
    }
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.jar'):
            return jsonify({'error': 'File must be a JAR file'}), 400
        
        # Save to jdbc_drivers directory
        jdbc_drivers_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'jdbc_drivers'
        )
        os.makedirs(jdbc_drivers_dir, exist_ok=True)
        
        filepath = os.path.join(jdbc_drivers_dir, file.filename)
        file.save(filepath)
        
        return jsonify({
            'filename': file.filename,
            'path': f'jdbc_drivers/{file.filename}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
