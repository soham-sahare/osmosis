from flask import Blueprint, request, jsonify
from app.services.execution_service import ExecutionService
import os

execution_bp = Blueprint('execution', __name__)
from config.settings import config
execution_service = ExecutionService(config.DATABASE_PATH)

@execution_bp.route('/jobs/<job_id>/execute', methods=['POST'])
def execute_job(job_id):
    """Execute a job pipeline."""
    try:
        # Default to MANUAL for API triggers
        result = execution_service.execute_job(job_id, trigger_type='MANUAL')
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@execution_bp.route('/jobs/<job_id>/executions', methods=['GET'])
def get_job_executions(job_id):
    """Get executions for a specific job."""
    try:
        limit = request.args.get('limit', 10, type=int)
        executions = execution_service.get_by_job(job_id, limit=limit)
        return jsonify(executions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@execution_bp.route('/workspaces/<workspace_id>/executions', methods=['GET'])
def get_workspace_executions(workspace_id):
    """Get all executions for a workspace."""
    try:
        executions = execution_service.get_by_workspace(workspace_id)
        return jsonify(executions), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@execution_bp.route('/executions/<execution_id>', methods=['GET'])
def get_execution(execution_id):
    """Get a single execution."""
    try:
        execution = execution_service.get_by_id(execution_id)
        if not execution:
            return jsonify({'error': 'Execution not found'}), 404
        return jsonify(execution), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
