from flask import Blueprint, request, jsonify
from app.services.job_service import JobService
from app.utils.api_helpers import api_response
import os
import json

job_bp = Blueprint('job', __name__)
from config.settings import config
job_service = JobService(config.DATABASE_PATH)

@job_bp.route('/jobs', methods=['GET'])
@api_response
def get_jobs():
    """Get all jobs."""
    return job_service.get_all()

@job_bp.route('/workspaces/<workspace_id>/jobs', methods=['GET'])
@api_response
def get_jobs_by_workspace(workspace_id):
    """Get jobs by workspace."""
    # Optimized to return summaries only (excludes canvas_state)
    return job_service.get_summaries_by_workspace(workspace_id)

@job_bp.route('/jobs/<job_id>', methods=['GET'])
@api_response
def get_job(job_id):
    """Get job by ID."""
    job = job_service.get_by_id(job_id)
    if job:
        return job
    return {'error': 'Job not found'}, 404

@job_bp.route('/jobs', methods=['POST'])
@api_response
def create_job():
    """Create a new job."""
    data = request.get_json()
    job = job_service.create(
        data['workspaceId'],
        data['name'],
        data.get('description', '')
    )
    return job, 201

from app.services.scheduler_service import scheduler_service
from app.services.execution_service import ExecutionService

execution_service = ExecutionService(config.DATABASE_PATH)

def execute_job_task(job_id):
    """Wrapper function for scheduled job execution."""
    print(f"Scheduled Execution triggering for Job {job_id}")
    with scheduler_service.app.app_context():
        try:
             execution_service.execute_job(job_id, trigger_type='SCHEDULED')
        except Exception as e:
            print(f"Failed to execute scheduled job {job_id}: {e}")

@job_bp.route('/jobs/<job_id>', methods=['PUT'])
@api_response
def update_job(job_id):
    """Update job."""
    data = request.get_json()
    
    valid_keys = ['name', 'description', 'canvasState', 'schedule', 'dependencies']
    update_data = {k: v for k, v in data.items() if k in valid_keys}
    
    # Convert camelCase to snake_case for backend
    if 'canvasState' in update_data:
        update_data['canvas_state'] = update_data.pop('canvasState')
    
    job = job_service.update(job_id, **update_data)
    
    if job:
        # Update Scheduler
        if data.get('schedule'):
             scheduler_service.add_job(job_id, data['schedule'], execute_job_task, args=[job_id])
        elif 'schedule' in data and not data['schedule']:
             # If schedule key is present but empty/null, remove it
             scheduler_service.remove_job(job_id)
             
        return job
    return {'error': 'Job not found'}, 404

@job_bp.route('/jobs/<job_id>', methods=['DELETE'])
@api_response
def delete_job(job_id):
    """Delete job."""
    scheduler_service.remove_job(job_id)
    success = job_service.delete(job_id)
    if success:
        return {'message': 'Job deleted'}
    return {'error': 'Job not found'}, 404

@job_bp.route('/jobs/<job_id>/export', methods=['GET'])
@api_response
def export_job(job_id):
    """Export job as JSON."""
    job_data = job_service.export_job(job_id)
    if job_data:
        return job_data
    return {'error': 'Job not found'}, 404

@job_bp.route('/jobs/<job_id>/export/recursive', methods=['GET'])
@api_response
def export_job_recursive(job_id):
    """Export job and dependencies as recursive JSON bundle."""
    bundle = job_service.export_job_recursive(job_id)
    if bundle:
        return bundle
    return {'error': 'Job not found'}, 404

@job_bp.route('/jobs/import', methods=['POST'])
@api_response
def import_job():
    """Import job from JSON file."""
    if 'file' not in request.files:
        return {'error': 'No file part'}, 400
        
    file = request.files['file']
    if file.filename == '':
        return {'error': 'No selected file'}, 400
        
    job_data = json.load(file)
    
    workspace_id = request.form.get('workspaceId')
    if not workspace_id:
        return {'error': 'Workspace ID is required'}, 400
    
    job = job_service.import_job(workspace_id, job_data)
    return job, 201

@job_bp.route('/jobs/trigger-auto-import', methods=['POST'])
@api_response
def trigger_auto_import():
    """Manually trigger the auto-import process."""
    try:
        from app.utils.auto_importer import AutoImporter
        from flask import current_app
        
        importer = AutoImporter(current_app)
        importer.run()
        return {'message': 'Auto-import process completed successfully'}, 200
    except Exception as e:
        return {'error': str(e)}, 500

@job_bp.route('/jobs/bulk/export', methods=['POST'])
@api_response
def bulk_export_jobs():
    """Bulk export jobs."""
    data = request.get_json()
    job_ids = data.get('jobIds', [])
    if not job_ids:
        return {'error': 'No job IDs provided'}, 400
        
    result = job_service.bulk_export(job_ids)
    return result

@job_bp.route('/jobs/bulk/delete', methods=['POST'])
@api_response
def bulk_delete_jobs():
    """Bulk delete jobs."""
    data = request.get_json()
    job_ids = data.get('jobIds', [])
    if not job_ids:
        return {'error': 'No job IDs provided'}, 400
        
    count = job_service.bulk_delete(job_ids)
    return {'message': f'Deleted {count} jobs', 'deletedCount': count}

@job_bp.route('/schedule/preview', methods=['POST'])
def preview_schedule():
    """Preview future run times for a cron expression."""
    data = request.json
    cron = data.get('cron')
    if not cron:
        return jsonify({'error': 'Cron expression required'}), 400
        
    runs = scheduler_service.get_future_runs(cron)
    return jsonify(runs), 200

@job_bp.route('/workspaces/<workspace_id>/schedules/upcoming', methods=['GET'])
def get_upcoming_schedules(workspace_id):
    """Get all upcoming job runs for a workspace in a given date range."""
    try:
        start_date = request.args.get('start')
        end_date = request.args.get('end')
        
        if not start_date or not end_date:
            return jsonify({'error': 'Start and End dates are required'}), 400
            
        # Optimization: Fetch only jobs for this workspace, and only summaries
        workspace_jobs = job_service.get_summaries_by_workspace(workspace_id)
        
        events = []
        for job in workspace_jobs:
            schedule = job.get('schedule')
            if schedule:
                timestamps = scheduler_service.get_runs_in_range(schedule, start_date, end_date)
                for ts in timestamps:
                    events.append({
                        'jobId': job['id'],
                        'jobName': job['name'],
                        'timestamp': ts,
                        'cron': schedule
                    })
                    
        # Sort by timestamp
        events.sort(key=lambda x: x['timestamp'])
        
        return jsonify(events), 200
    except Exception as e:
        print(f"Error fetching upcoming schedules: {e}")
        return jsonify({'error': str(e)}), 500
