import uuid
import json
from datetime import datetime
from app.utils.db import Database

class JobService:
    def __init__(self, db_path):
        self.db = Database(db_path)
    
    def _parse_job(self, row):
        """Helper to parse parsing job row."""
        job = dict(row)
        if job['canvas_state']:
            job['canvasState'] = json.loads(job['canvas_state'])
        else:
            job['canvasState'] = {'nodes': [], 'edges': [], 'viewport': {'x': 0, 'y': 0, 'zoom': 1}}
        
        # Parse dependencies
        if job['dependencies']:
            try:
                job['dependencies'] = json.loads(job['dependencies'])
            except:
                job['dependencies'] = []
        else:
            job['dependencies'] = []
            
        del job['canvas_state']
        # Don't delete dependencies key, just reassign
        
        job['workspaceId'] = job.pop('workspace_id')
        job['createdAt'] = job.pop('created_at')
        job['updatedAt'] = job.pop('updated_at')
        return job

    def get_all(self):
        """Get all jobs."""
        rows = self.db.fetch_all('SELECT * FROM jobs ORDER BY updated_at DESC')
        return [self._parse_job(row) for row in rows]
    
    def get_by_workspace(self, workspace_id):
        """Get jobs by workspace."""
        rows = self.db.fetch_all('SELECT * FROM jobs WHERE workspace_id = :workspace_id ORDER BY updated_at DESC', {'workspace_id': workspace_id})
        return [self._parse_job(row) for row in rows]

    def get_summaries_by_workspace(self, workspace_id):
        """Get job summaries by workspace (excludes canvas_state for performance)."""
        # Select explicit columns, excluding canvas_state
        query = '''
            SELECT id, workspace_id, name, description, created_at, updated_at, schedule, dependencies
            FROM jobs 
            WHERE workspace_id = :workspace_id 
            ORDER BY updated_at DESC
        '''
        rows = self.db.fetch_all(query, {'workspace_id': workspace_id})
        
        jobs = []
        for row in rows:
            job = dict(row)
            # Reconstruct minimal object structure expected by frontend list view
            job['workspaceId'] = job.pop('workspace_id')
            job['createdAt'] = job.pop('created_at')
            job['updatedAt'] = job.pop('updated_at')
            
            # Handle dependencies similar to _parse_job but lighter if needed
            if job['dependencies']:
                try:
                    job['dependencies'] = json.loads(job['dependencies'])
                except:
                    job['dependencies'] = []
            else:
                job['dependencies'] = []
                
            # Default empty canvas state for type compatibility if strictly needed, 
            # but ideally the frontend shouldn't need it for the list.
            # providing a stub to avoid frontend crashes if it checks for existence
            job['canvasState'] = None 
            
            jobs.append(job)
            
        return jobs
    
    def get_by_id(self, job_id):
        """Get job by ID."""
        row = self.db.fetch_one('SELECT * FROM jobs WHERE id = :job_id', {'job_id': job_id})
        if not row:
            return None
        return self._parse_job(row)
    
    def create(self, workspace_id, name, description=''):
        """Create a new job."""
        job_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        canvas_state = json.dumps({'nodes': [], 'edges': [], 'viewport': {'x': 0, 'y': 0, 'zoom': 1}})
        
        self.db.execute('''
            INSERT INTO jobs (id, workspace_id, name, description, canvas_state, created_at, updated_at, schedule, dependencies)
            VALUES (:id, :workspace_id, :name, :description, :canvas_state, :created_at, :updated_at, :schedule, :dependencies)
        ''', {
            'id': job_id, 
            'workspace_id': workspace_id, 
            'name': name, 
            'description': description, 
            'canvas_state': canvas_state, 
            'created_at': now, 
            'updated_at': now, 
            'schedule': None, 
            'dependencies': '[]'
        })
        
        return {
            'id': job_id,
            'workspaceId': workspace_id,
            'name': name,
            'description': description,
            'canvasState': {'nodes': [], 'edges': [], 'viewport': {'x': 0, 'y': 0, 'zoom': 1}},
            'schedule': None,
            'dependencies': [],
            'createdAt': now,
            'updatedAt': now
        }
    
    def update(self, job_id, **kwargs):
        """Update job."""
        current_row = self.db.fetch_one('SELECT * FROM jobs WHERE id = :id', {'id': job_id})
        if not current_row:
            return None
        
        current = dict(current_row)
        
        # Determine values to update
        # If key is in kwargs, use it (even if None), otherwise use current
        updated_name = kwargs.get('name', current['name'])
        updated_desc = kwargs.get('description', current['description'])
        
        if 'canvas_state' in kwargs:
             updated_canvas = json.dumps(kwargs['canvas_state'])
        else:
             updated_canvas = current['canvas_state']

        if 'schedule' in kwargs:
             updated_schedule = kwargs['schedule']
        else:
             updated_schedule = current['schedule']
        
        # Handle dependencies update
        if 'dependencies' in kwargs:
             updated_dependencies = json.dumps(kwargs['dependencies'])
        else:
             updated_dependencies = current['dependencies'] if current['dependencies'] else '[]'

        now = datetime.utcnow().isoformat()
        
        self.db.execute('''
            UPDATE jobs
            SET name = :name, description = :description, canvas_state = :canvas_state, schedule = :schedule, dependencies = :dependencies, updated_at = :updated_at
            WHERE id = :id
        ''', {
            'name': updated_name, 
            'description': updated_desc, 
            'canvas_state': updated_canvas, 
            'schedule': updated_schedule, 
            'dependencies': updated_dependencies, 
            'updated_at': now, 
            'id': job_id
        })
        
        # Return updated object
        return {
            'id': job_id,
            'workspaceId': current['workspace_id'],
            'name': updated_name,
            'description': updated_desc,
            'canvasState': json.loads(updated_canvas) if updated_canvas else {'nodes': [], 'edges': [], 'viewport': {'x': 0, 'y': 0, 'zoom': 1}},
            'schedule': updated_schedule,
            'dependencies': json.loads(updated_dependencies) if updated_dependencies else [],
            'createdAt': current['created_at'],
            'updatedAt': now
        }
    
    def delete(self, job_id):
        """Delete job."""
        cursor = self.db.execute('DELETE FROM jobs WHERE id = :id', {'id': job_id})
        return cursor.rowcount > 0
    
    def export_job(self, job_id):
        """Export job as JSON."""
        job = self.get_by_id(job_id)
        if not job: return None
        
        # Enrich with dependency names
        dep_ids = job.get('dependencies', [])
        if dep_ids:
            names = []
            for dep_id in dep_ids:
                row = self.db.fetch_one('SELECT name FROM jobs WHERE id = :id', {'id': dep_id})
                if row:
                    names.append(row['name'])
            job['dependencyNames'] = names
            
        return job
    
    def export_job_recursive(self, job_id):
        """Export job and all dependencies as a single JSON bundle."""
        seen = set()
        queue = [job_id]
        jobs = []
        
        while queue:
            current_id = queue.pop(0)
            if current_id in seen:
                continue
            seen.add(current_id)
            
            job_data = self.export_job(current_id)
            if job_data:
                jobs.append(job_data)
                for dep_id in job_data.get('dependencies', []):
                    if dep_id not in seen:
                        queue.append(dep_id)
        
        return {
            "type": "recursive_job_export",
            "root_id": job_id,
            "jobs": jobs,
            "exported_at": datetime.now().isoformat()
        }

    def bulk_export(self, job_ids):
        """Export multiple jobs as a bundle."""
        jobs = []
        for job_id in job_ids:
            # We simply fetch single export for each.
            # Could leverage recursive logic if needed, but 'Bulk Export' usually means 'these specific jobs'.
            # However, for portability, maybe we should recursively export dependencies too? 
            # Let's start with shallow export of selected jobs for simplicity, or 
            # maybe just a list of independent job objects.
            job = self.export_job(job_id)
            if job:
                jobs.append(job)
        
        return {
            "type": "bulk_job_export",
            "count": len(jobs),
            "jobs": jobs,
            "exported_at": datetime.now().isoformat()
        }
    
    def bulk_delete(self, job_ids):
        """Delete multiple jobs."""
        deleted_count = 0
        for job_id in job_ids:
             if self.delete(job_id):
                 deleted_count += 1
                 # Also remove from scheduler
                 from app.services.scheduler_service import scheduler_service
                 scheduler_service.remove_job(job_id)
        return deleted_count

    def import_job(self, workspace_id, job_data, preserve_ids=False):
        """Import job from JSON."""
        # Check for recursive bundle
        if job_data.get('type') == 'recursive_job_export' and 'jobs' in job_data:
            id_map = {} # old_id -> new_id
            created_jobs = [] 
            
            # Pass 1: Create all jobs
            for j_data in job_data['jobs']:
                old_id = j_data.get('id')
                
                # Import as single
                new_job = self._import_single_job_logic(workspace_id, j_data, preserve_ids=preserve_ids)
                new_id = new_job['id']
                if old_id:
                    id_map[old_id] = new_id
                created_jobs.append((new_id, j_data.get('dependencies', [])))
            
            # Pass 2: Update dependencies based on ID map
            # If preserving IDs, id_map[old] == old, so this logic is still valid
            for new_id, old_deps in created_jobs:
                new_deps = []
                for old_dep in old_deps:
                    if old_dep in id_map:
                        new_deps.append(id_map[old_dep])
                    # If preserving IDs, we might want to keep external dependencies too?
                    # But for now, assuming self-contained bundle behavior is desired.
                    # If duplicate deps check is needed?
                
                if new_deps:
                    self.db.execute('UPDATE jobs SET dependencies = :deps WHERE id = :id', 
                                  {'deps': json.dumps(new_deps), 'id': new_id})

            # Return the root job
            root_old = job_data.get('root_id')
            if root_old and root_old in id_map:
                return self.get_by_id(id_map[root_old])
            return self.get_by_id(created_jobs[0][0]) if created_jobs else None
            
        else:
            return self._import_single_job_logic(workspace_id, job_data, preserve_ids=preserve_ids)

    def _import_single_job_logic(self, workspace_id, job_data, preserve_ids=False):
        """Internal helper for single job import."""
        now = datetime.utcnow().isoformat()
        
        job_id = None
        is_update = False
        
        if preserve_ids and job_data.get('id'):
            target_id = job_data.get('id')
            # Check if exists
            existing = self.db.fetch_one('SELECT * FROM jobs WHERE id = :id', {'id': target_id})
            if existing:
                job_id = target_id
                is_update = True
                # Use existing name if not specified? No, overwrite with imported name.
            else:
                job_id = target_id
                is_update = False
        
        if not job_id:
            job_id = str(uuid.uuid4())
        
        name = job_data.get('name', 'Imported Job')
        
        # Ensure unique name ONLY if creating new, OR if updating and name changed causing collision?
        # If preserving IDs (production sync), we probably trust the file's name and want to enforce it, 
        # even if it collides (though ID collision is main concern). 
        # But if another job has the same name but diff ID, we might have issue.
        # For simplify: If preserve_ids is True, we skip unique name generation and just overwrite/insert.
        if not preserve_ids:
            base_name = name
            counter = 1
            while self.db.fetch_one('SELECT 1 FROM jobs WHERE workspace_id = :w AND name = :n', {'w': workspace_id, 'n': name}):
                name = f"{base_name} ({counter})"
                counter += 1

        description = job_data.get('description', '')
        canvas_state = json.dumps(job_data.get('canvasState', {'nodes': [], 'edges': [], 'viewport': {'x': 0, 'y': 0, 'zoom': 1}}))
        schedule = job_data.get('schedule', None)
        
        # Handle Dependencies
        dep_names = job_data.get('dependencyNames', [])
        dependencies = job_data.get('dependencies', [])
        
        resolved_deps = []
        missing_names = []
        
        # Priority 1: Resolve by Name (if provided)
        # Note: If preserving IDs, we might prefer using the IDs directly if we trust the bundle.
        # But name resolution is good robustness.
        if dep_names:
            for dep_name in dep_names:
                row = self.db.fetch_one('SELECT id FROM jobs WHERE workspace_id = :ws_id AND name = :name', 
                                      {'ws_id': workspace_id, 'name': dep_name})
                if row:
                    resolved_deps.append(row['id'])
                else:
                    missing_names.append(dep_name)
            
            if resolved_deps:
                dependencies_json = json.dumps(resolved_deps)
            else:
                dependencies_json = json.dumps(dependencies) # Fallback
        else:
            dependencies_json = json.dumps(dependencies)
            
        if is_update:
            self.db.execute('''
                UPDATE jobs
                SET workspace_id = :workspace_id, name = :name, description = :description, 
                    canvas_state = :canvas_state, schedule = :schedule, dependencies = :dependencies, 
                    updated_at = :updated_at
                WHERE id = :id
            ''', {
                'workspace_id': workspace_id,
                'name': name,
                'description': description,
                'canvas_state': canvas_state,
                'schedule': schedule,
                'dependencies': dependencies_json,
                'updated_at': now,
                'id': job_id
            })
        else:
            self.db.execute('''
                INSERT INTO jobs (id, workspace_id, name, description, canvas_state, created_at, updated_at, schedule, dependencies)
                VALUES (:id, :workspace_id, :name, :description, :canvas_state, :created_at, :updated_at, :schedule, :dependencies)
            ''', {
                'id': job_id, 
                'workspace_id': workspace_id, 
                'name': name, 
                'description': description, 
                'canvas_state': canvas_state, 
                'created_at': now, 
                'updated_at': now, 
                'schedule': schedule, 
                'dependencies': dependencies_json
            })
        
        return {
            'id': job_id,
            'workspaceId': workspace_id,
            'name': name,
            'description': description,
            'canvasState': json.loads(canvas_state),
            'schedule': schedule,
            'dependencies': json.loads(dependencies_json),
            'dependencyNames': dep_names,
            'missingDependencies': missing_names, 
            'createdAt': now,
            'updatedAt': now
        }
    
    def save_execution(self, result):
        """Save execution result."""
        logs_json = json.dumps(result.get('logs', []))
        
        self.db.execute('''
            INSERT INTO executions (id, job_id, status, trigger_type, message, logs, start_time, end_time)
            VALUES (:id, :jobId, :status, :triggerType, :message, :logs, :startTime, :endTime)
        ''', {
            'id': result['id'],
            'jobId': result['jobId'],
            'status': result['status'],
            'triggerType': result.get('triggerType', 'MANUAL'),
            'message': result.get('message', ''),
            'logs': logs_json,
            'startTime': result['startTime'],
            'endTime': result.get('endTime')
        })
        
    def get_executions(self, job_id, limit=50):
        """Get executions for a job."""
        rows = self.db.fetch_all('''
            SELECT * FROM executions 
            WHERE job_id = :job_id 
            ORDER BY start_time DESC 
            LIMIT :limit
        ''', {'job_id': job_id, 'limit': limit})
        
        executions = []
        for row in rows:
            ex = dict(row)
            try:
                ex['logs'] = json.loads(ex['logs'])
            except:
                ex['logs'] = []
            
            ex['jobId'] = ex.pop('job_id')
            ex['startTime'] = ex.pop('start_time')
            ex['endTime'] = ex.pop('end_time')
            ex['triggerType'] = ex.pop('trigger_type', 'MANUAL')
            executions.append(ex)
            
        return executions

    def get_execution(self, execution_id):
        """Get single execution."""
        row = self.db.fetch_one('''
            SELECT e.*, j.name as job_name
            FROM executions e
            JOIN jobs j ON e.job_id = j.id
            WHERE e.id = :id
        ''', {'id': execution_id})
        if not row: return None
        
        ex = dict(row)
        try:
            ex['logs'] = json.loads(ex['logs'])
        except:
            ex['logs'] = []
            
        ex['jobId'] = ex.pop('job_id')
        ex['jobName'] = ex.pop('job_name', 'Unknown')
        ex['startTime'] = ex.pop('start_time')
        ex['endTime'] = ex.pop('end_time')
        ex['triggerType'] = ex.pop('trigger_type', 'MANUAL')
        return ex

    def get_executions_by_workspace(self, workspace_id, limit=50):
        """Get all executions for a workspace (via jobs)."""
        rows = self.db.fetch_all('''
            SELECT e.*, j.name as job_name
            FROM executions e
            JOIN jobs j ON e.job_id = j.id
            WHERE j.workspace_id = :workspace_id
            ORDER BY e.start_time DESC
            LIMIT :limit
        ''', {'workspace_id': workspace_id, 'limit': limit})
        
        executions = []
        for row in rows:
            ex = dict(row)
            try:
                ex['logs'] = json.loads(ex['logs'])
            except:
                ex['logs'] = []
            
            ex['jobId'] = ex.pop('job_id')
            ex['jobName'] = ex.pop('job_name', 'Unknown')
            ex['startTime'] = ex.pop('start_time')
            ex['endTime'] = ex.pop('end_time')
            ex['triggerType'] = ex.pop('trigger_type', 'MANUAL')
            executions.append(ex)
            
        return executions
