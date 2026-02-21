from flask import Blueprint, request
from app.services.workspace_service import WorkspaceService
from app.utils.api_helpers import api_response
import os

workspace_bp = Blueprint('workspace', __name__)
from config.settings import config
workspace_service = WorkspaceService(config.DATABASE_PATH)

@workspace_bp.route('/workspaces', methods=['GET'])
@api_response
def get_workspaces():
    """Get all workspaces."""
    return workspace_service.get_all()

@workspace_bp.route('/workspaces/<workspace_id>', methods=['GET'])
@api_response
def get_workspace(workspace_id):
    """Get workspace by ID."""
    workspace = workspace_service.get_by_id(workspace_id)
    if workspace:
        return workspace
    return {'error': 'Workspace not found'}, 404

@workspace_bp.route('/workspaces/<workspace_id>/export', methods=['GET'])
@api_response
def export_workspace(workspace_id):
    """Export workspace and all assets."""
    data = workspace_service.export_workspace(workspace_id)
    if data:
        return data
    return {'error': 'Workspace not found'}, 404

@workspace_bp.route('/workspaces', methods=['POST'])
@api_response
def create_workspace():
    """Create a new workspace."""
    data = request.get_json()
    workspace = workspace_service.create(data['name'], data.get('description', ''))
    return workspace, 201

@workspace_bp.route('/workspaces/<workspace_id>', methods=['PUT'])
@api_response
def update_workspace(workspace_id):
    """Update workspace."""
    data = request.get_json()
    workspace = workspace_service.update(
        workspace_id,
        data.get('name'),
        data.get('description')
    )
    if workspace:
        return workspace
    return {'error': 'Workspace not found'}, 404

@workspace_bp.route('/workspaces/<workspace_id>', methods=['DELETE'])
@api_response
def delete_workspace(workspace_id):
    """Delete workspace."""
    success = workspace_service.delete(workspace_id)
    if success:
        return {'message': 'Workspace deleted'}
    return {'error': 'Workspace not found'}, 404

@workspace_bp.route('/workspaces/bulk/delete', methods=['POST'])
@api_response
def bulk_delete_workspaces():
    """Bulk delete workspaces."""
    data = request.get_json()
    ids = data.get('workspaceIds', [])
    if not ids:
        return {'error': 'No IDs provided'}, 400
        
    count = workspace_service.bulk_delete(ids)
    return {'message': f'Deleted {count} workspaces', 'deletedCount': count}

@workspace_bp.route('/workspaces/<workspace_id>/variables', methods=['GET'])
@api_response
def get_variables(workspace_id):
    """Get workspace variables."""
    return workspace_service.get_variables(workspace_id)

@workspace_bp.route('/workspaces/<workspace_id>/variables', methods=['POST'])
@api_response
def create_variable(workspace_id):
    """Create workspace variable."""
    data = request.get_json()
    if 'key' not in data or 'value' not in data:
         return {'error': 'Key and Value are required'}, 400
         
    try:
        var = workspace_service.create_variable(workspace_id, data['key'], data['value'], data.get('isSecret', False))
        return var, 201
    except Exception as e:
        return {'error': str(e)}, 400

@workspace_bp.route('/workspaces/<workspace_id>/variables/<key>', methods=['PUT'])
@api_response
def update_variable(workspace_id, key):
    """Update workspace variable."""
    data = request.get_json()
    # allow partial updates? validation says value required.
    # Frontend sends value.
    if 'value' not in data:
         return {'error': 'Value is required'}, 400
         
    var = workspace_service.update_variable(workspace_id, key, data['value'], data.get('isSecret'))
    if var:
        return var
    return {'error': 'Variable not found'}, 404

@workspace_bp.route('/workspaces/<workspace_id>/variables/<key>', methods=['DELETE'])
@api_response
def delete_variable(workspace_id, key):
    """Delete workspace variable."""
    success = workspace_service.delete_variable(workspace_id, key)
    if success:
        return {'message': 'Variable deleted'}
    return {'error': 'Variable not found'}, 404
