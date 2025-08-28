"""
Connection Management Routes
API endpoints for managing database connections
"""
from flask import Blueprint, request, jsonify
from app.services.connection_service import connection_service

connection_bp = Blueprint('connections', __name__)

@connection_bp.route('/api/workspaces/<workspace_id>/connections', methods=['GET'])
def get_connections(workspace_id):
    """Get all connections for a workspace"""
    try:
        connections = connection_service.get_all_connections(workspace_id)
        return jsonify(connections), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@connection_bp.route('/api/workspaces/<workspace_id>/connections/<connection_id>', methods=['GET'])
def get_connection(workspace_id, connection_id):
    """Get a specific connection"""
    try:
        connection = connection_service.get_connection(workspace_id, connection_id)
        if connection:
            return jsonify(connection), 200
        else:
            return jsonify({'error': 'Connection not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@connection_bp.route('/api/workspaces/<workspace_id>/connections', methods=['POST'])
def create_connection(workspace_id):
    """Create a new connection"""
    try:
        connection_data = request.json
        saved_connection = connection_service.save_connection(workspace_id, connection_data)
        return jsonify(saved_connection), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@connection_bp.route('/api/workspaces/<workspace_id>/connections/<connection_id>', methods=['PUT'])
def update_connection(workspace_id, connection_id):
    """Update an existing connection"""
    try:
        connection_data = request.json
        connection_data['id'] = connection_id
        updated_connection = connection_service.save_connection(workspace_id, connection_data)
        return jsonify(updated_connection), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@connection_bp.route('/api/workspaces/<workspace_id>/connections/<connection_id>', methods=['DELETE'])
def delete_connection(workspace_id, connection_id):
    """Delete a connection"""
    try:
        success = connection_service.delete_connection(workspace_id, connection_id)
        if success:
            return jsonify({'message': 'Connection deleted'}), 200
        else:
            return jsonify({'error': 'Connection not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@connection_bp.route('/api/connections/test', methods=['POST'])
def test_connection():
    """Test a database connection"""
    try:
        connection_data = request.json
        result = connection_service.test_connection(connection_data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
