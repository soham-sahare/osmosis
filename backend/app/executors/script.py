from .base import BaseExecutor
import requests

class JavaRowExecutor(BaseExecutor):
    """Executes Python script per row (misnamed as JavaRow in Talend tradition)."""
    def execute(self, config, input_data=None, context=None):
        code = config.get('code')
        if not code: return input_data or []
        
        # Security Warning: exec is dangerous.
        # Minimal sandbox
        allowed_globals = {'__builtins__': None, 'print': print, 'len': len, 'str': str, 'int': int, 'float': float}
        
        output_data = []
        if input_data:
            for row in input_data:
                # User code expects 'input_row' and can produce 'output_row'
                local_scope = {'input_row': row, 'output_row': {}}
                try:
                    exec(code, allowed_globals, local_scope)
                    output_data.append(local_scope.get('output_row', row))
                except Exception as e:
                    print(f"Script execution error: {e}")
        else:
             pass
             
        return output_data

class RunJobExecutor(BaseExecutor):
    """Triggers another job."""
    def execute(self, config, input_data=None, context=None):
        job_id = config.get('jobId') or config.get('jobPath')
        if not job_id: return input_data
        
        print(f"Executing sub-job: {job_id}")
        
        # Use context to execute job recursively if provided
        if context and hasattr(context, 'execute_job'):
             try:
                 # CAUTION: Infinite recursion protection needed?
                 context.execute_job(job_id, trigger_type='SUBJOB')
             except Exception as e:
                 print(f"Sub-job execution failed: {e}")
        
        return input_data # Pass through trigger data
