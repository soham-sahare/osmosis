import uuid
import json
from datetime import datetime
from app.utils.db import Database
from app.services.job_service import JobService
from app.services.workspace_service import WorkspaceService
from app.services.connection_service import ConnectionService
from app.services.file_system_service import FileSystemService
import pandas as pd
import numpy as np

# Import Executors
from app.executors.io import FileReaderExecutor, FileWriterExecutor, DatabaseReaderExecutor, DatabaseWriterExecutor
from app.executors.messaging import KafkaInputExecutor, KafkaOutputExecutor
from app.executors.transform import (
    SortRowExecutor, AggregateRowExecutor, UniqRowExecutor, 
    NormalizeExecutor, DenormalizeExecutor, SplitRowExecutor, 
    ConvertTypeExecutor, RowGeneratorExecutor, MapExecutor, FilterRowExecutor
)
from app.executors.script import JavaRowExecutor, RunJobExecutor
from app.executors.network import RestClientExecutor
from app.executors.base import BaseExecutor

class ExecutionService:
    def __init__(self, db_path):
        self.db_path = db_path
        self.db = Database(db_path)
        self.job_service = JobService(db_path)
        self.workspace_service = WorkspaceService(db_path)
        self.connection_service = ConnectionService(db_path)
        self.file_system_service = FileSystemService()
        
        # Executor Registry
        self.executors = {
            # IO
            'file-reader': FileReaderExecutor(),
            'file-writer': FileWriterExecutor(),
            'database-reader': DatabaseReaderExecutor(),
            'database-writer': DatabaseWriterExecutor(),
            
            # Messaging
            'kafka-input': KafkaInputExecutor(),
            'kafka-output': KafkaOutputExecutor(),
            
            # Transform
            'sort': SortRowExecutor(),
            'aggregate': AggregateRowExecutor(),
            'uniq-row': UniqRowExecutor(),
            'normalize': NormalizeExecutor(),
            'denormalize': DenormalizeExecutor(),
            'split-row': SplitRowExecutor(),
            'convert-type': ConvertTypeExecutor(),
            'row-generator': RowGeneratorExecutor(),
            'map': MapExecutor(),
            'filter': FilterRowExecutor(),
            
            # Script / Network
            'java-row': JavaRowExecutor(),
            'run-job': RunJobExecutor(),
            'rest-client': RestClientExecutor(),
            
            # Logs (Special validation logic kept separate or handled by BaseExecutor?)
            # Actually Log component is just a PassThrough with print?
            # Let's map it to a simple inline executor or generic
        }
        
        # Add a Log Executor inline class for now
        class LogExecutor(BaseExecutor):
            def execute(self, config, input_data=None, context=None):
                msg = config.get('message', 'Logging data...')
                # We can't easily append to logs list from here unless we pass logs list in context
                # Context is 'self' (ExecutionService), but 'logs' is local to execute_job.
                # Solution: context.log(msg)
                if context and hasattr(context, 'log_message'):
                    context.log_message(msg, level='info')
                return input_data or []
        
        self.executors['log'] = LogExecutor()

    # Context Helper to allow executors to log back to the service
    def log_message(self, message, level='info', component_id=None):
        # This is tricky because execute_job is stateless regarding instance variables usually?
        # Typically logs are accumulated in a list inside execute_job.
        # If we want to support this, we need 'execute_job' to attach a logger to the context.
        # We can pass a lightweight 'JobContext' object instead of 'self'.
        pass 

    def _resolve_inputs(self, node_id, execution_results, edges):
        """Resolve inputs for a node from execution results."""
        input_edges = [e for e in edges if e['target'] == node_id]
        if not input_edges:
            return []
        
        inputs = []
        for edge in input_edges:
            source_id = edge['source']
            if source_id in execution_results:
                data = execution_results[source_id]
                
                # Check for named handle routing (Multi-output nodes)
                if isinstance(data, dict) and node_id in data:
                    data = data[node_id]
                elif isinstance(data, dict):
                    # Fallback Logic
                    source_handle = edge.get('sourceHandle')
                    if source_handle and source_handle in data:
                        data = data[source_handle]
                    else:
                        if 'out1' in data:
                            data = data['out1']
                        elif len(data) > 0:
                            first_key = next(iter(data))
                            data = data[first_key]

                inputs.append({
                    'sourceId': source_id,
                    'data': data
                })
        return inputs

    def get_executions_by_workspace(self, workspace_id, limit=50):
        """Get all executions for a workspace (via jobs)."""
        rows = self.db.fetch_all('''
            SELECT e.id, e.job_id, e.status, e.trigger_type, e.message, e.start_time, e.end_time, j.name as job_name
            FROM executions e
            JOIN jobs j ON e.job_id = j.id
            WHERE j.workspace_id = :workspace_id
            ORDER BY e.start_time DESC
            LIMIT :limit
        ''', {'workspace_id': workspace_id, 'limit': limit})
        
        executions = []
        for row in rows:
            ex = dict(row)
            # Logs are excluded for performance in list view
            ex['logs'] = []
            
            ex['jobId'] = ex.pop('job_id')
            ex['jobName'] = ex.pop('job_name', 'Unknown')
            ex['startTime'] = ex.pop('start_time')
            ex['endTime'] = ex.pop('end_time')
            ex['triggerType'] = ex.pop('trigger_type', 'MANUAL')
            executions.append(ex)
            
        return executions

    def get_executions(self, job_id, limit=50):
        """Get executions for a job."""
        rows = self.db.fetch_all('''
            SELECT id, job_id, status, trigger_type, message, start_time, end_time 
            FROM executions 
            WHERE job_id = :job_id 
            ORDER BY start_time DESC 
            LIMIT :limit
        ''', {'job_id': job_id, 'limit': limit})
        
        executions = []
        for row in rows:
            ex = dict(row)
            # Logs are excluded for performance in list view
            ex['logs'] = []
            
            ex['jobId'] = ex.pop('job_id')
            ex['startTime'] = ex.pop('start_time')
            ex['endTime'] = ex.pop('end_time')
            ex['triggerType'] = ex.pop('trigger_type', 'MANUAL')
            executions.append(ex)
            
        return executions

    def _substitute_variables(self, config, variables_map):
        """Recursively substitute variables in config dictionary."""
        if not variables_map:
            return config
            
        if isinstance(config, dict):
            new_config = {}
            for k, v in config.items():
                new_config[k] = self._substitute_variables(v, variables_map)
            return new_config
        elif isinstance(config, list):
            return [self._substitute_variables(item, variables_map) for item in config]
        elif isinstance(config, str):
            val = config
            for key, value in variables_map.items():
                placeholder = f"{{{{{key}}}}}"
                if placeholder in val:
                    val = val.replace(placeholder, str(value))
            return val
        else:
            return config

    def execute_job(self, job_id, trigger_type='MANUAL'):
        """Execute a job pipeline."""
        execution_id = str(uuid.uuid4())
        start_time = datetime.utcnow().isoformat()
        logs = []
        
        # Context object passed to executors
        class JobContext:
            def __init__(self, service, current_workspace_id, logs_list, component_id=None):
                self.service = service
                self.connection_service = service.connection_service
                self.file_system_service = service.file_system_service
                self.db_path = service.db_path
                self.current_workspace_id = current_workspace_id
                self.logs_list = logs_list
                self.component_id = component_id
            
            def log_message(self, message, level='info'):
                self.logs_list.append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'level': level,
                    'message': message,
                    'componentId': self.component_id
                })
                
            def execute_job(self, sub_job_id, trigger_type='SUBJOB'):
                # Recursive call
                return self.service.execute_job(sub_job_id, trigger_type)

        try:
            job = self.job_service.get_by_id(job_id)
            if not job:
                raise Exception(f"Job not found: {job_id}")

            nodes = job.get('canvasState', {}).get('nodes', [])
            edges = job.get('canvasState', {}).get('edges', [])
            
            # --- VARIABLE SUBSTITUTION ---
            try:
                variables = self.workspace_service.get_variables(job['workspaceId'])
                if variables:
                     var_map = {v['key']: v['value'] for v in variables}
                     nodes = self._substitute_variables(nodes, var_map)
                     logs.append({
                        'timestamp': datetime.utcnow().isoformat(),
                        'level': 'info',
                        'message': f'Substituted {len(variables)} workspace variables'
                    })
            except Exception as e:
                 logs.append({
                    'timestamp': datetime.utcnow().isoformat(),
                    'level': 'warning',
                    'message': f'Failed to substitute variables: {str(e)}'
                })
            # -----------------------------
            
            if not nodes:
                return self._create_execution_result(
                    execution_id, job_id, 'success', 'Pipeline is empty', logs, start_time, trigger_type
                )
            
            # Topological sort
            sorted_nodes = self._topological_sort(nodes, edges)
            
            execution_results = {} # Store output data for each node
            
            # Execute each component
            for node in sorted_nodes:
                component_type = node['data']['type']
                config = node['data']['config']
                
                # Context for this node
                node_context = JobContext(self, job['workspaceId'], logs, node['id'])
                
                # Resolve inputs
                inputs = self._resolve_inputs(node['id'], execution_results, edges)
                
                # Default data behavior for single-input components
                # Most executors now handle input_data list manually, but for compatibility 
                # let's assume most take a raw list of records.
                # If multiple inputs (Map/Union), we pass ALL inputs.
                
                input_data = []
                if component_type == 'union':
                     # Special case: Union needs all inputs logic is inside Union logic potentially?
                     # Actually UnionExecutor logic I wrote expects `input_data` to be a list of records?
                     # No, I passed `input_data` which implies a single list.
                     # `input_data` argument name is ambiguous.
                     # List of dicts? Or List of Inputs?
                     
                     # My BaseExecutor docstring says: "input_data (list, optional): The input data from upstream (list of dicts)."
                     # This implies ONLY a single stream.
                     
                     # Map and Join need access to MULTIPLE separate streams.
                     # So passing a single merged list is BAD for Map/Join.
                     pass

                # Pre-processing inputs for Executor
                # Strategy:
                # 1. If single input, pass `inputs[0]['data']`.
                # 2. If multiple inputs, pass `[inp['data'] for inp in inputs]`? 
                #    But generic executors expact a list of dicts (rows).
                #    If I pass `[ [row1, row2], [row3, row4] ]`, Pandas DataFrame(input_data) handles it weirdly.
                
                # We need a Standard:
                # `input_data` passed to `execute` should be:
                # - For Single Stream components (Filter, Sort, etc): `List[Dict]` (rows).
                # - For Multi Stream components (Map, Join): `List[List[Dict]]`? Or `Dict[SourceID, List[Dict]]`?
                
                current_input = None
                if inputs:
                    if len(inputs) == 1:
                        current_input = inputs[0]['data']
                    else:
                         # Merge? Or Pass Raw?
                         # Only Map/Union handle multiple.
                         if component_type == 'union':
                             # Flatten
                             current_input = []
                             for inp in inputs:
                                 if isinstance(inp['data'], list): current_input.extend(inp['data'])
                                 elif inp['data']: current_input.append(inp['data'])
                         elif component_type == 'map':
                             # Map needs structured inputs
                             # We can pass `inputs` directly if we change Executor signature?
                             # Or we just assume `current_input` is `inputs` list for Map?
                             # Let's handle Map specially.
                             # Actually, Map needs to join. My `transform.py` doesn't have Map logic yet!
                             # I MISSED MAP EXECUTOR!
                             pass
                
                # Handle Map Logic separately or implement MapExecutor
                # The generic `execute` call:
                
                executor = self.executors.get(component_type)
                
                if component_type == 'map':
                     # I haven't implemented MapExecutor yet.
                     # Let's keep Map logic INLINE for now or create MapExecutor.
                     # Map Logic is complex (Joins).
                     # I'll create `MapExecutor` in `transform.py` now (dynamically).
                     pass
                
                if executor:
                    try:
                        # For Map/Join, we probably want to pass the raw `inputs` list so it can distinguish sources.
                        # But `BaseExecutor.execute` expects `input_data`.
                        # Let's overload `input_data`.
                        
                        # Special handling for Map and Union in the service loop?
                        if component_type == 'map':
                            # Pass RAW inputs array to executor
                            output_data = executor.execute(config, inputs, context=node_context)
                        else:
                            # Standard behavior (single input preferred)
                            output_data = executor.execute(config, current_input, context=node_context)
                            
                        execution_results[node['id']] = output_data
                        
                    except Exception as exec_err:
                        node_context.log_message(f"Execution failed: {str(exec_err)}", level='error')
                        # Rethrow or continue?
                        raise exec_err
                else:
                    if component_type == 'map':
                         # If I failed to add MapExecutor, fall back to inline?
                         # I will add MapExecutor to `transform.py` in next step.
                         pass
                    else:
                        node_context.log_message(f"Unknown component type: {component_type}", level='warning')

            return self._create_execution_result(
                execution_id, job_id, 'success', 'Job completed successfully', logs, start_time, trigger_type
            )

        except Exception as e:
            return self._create_execution_result(
                execution_id, job_id, 'error', str(e), logs, start_time, trigger_type
            )

    def _topological_sort(self, nodes, edges):
         # ... reuse existing logic ...
         adj_list = {node['id']: [] for node in nodes}
         in_degree = {node['id']: 0 for node in nodes}
         node_map = {node['id']: node for node in nodes}
         
         for edge in edges:
             source = edge['source']
             target = edge['target']
             if source in adj_list and target in adj_list:
                 adj_list[source].append(target)
                 in_degree[target] += 1
         
         queue = [nid for nid, d in in_degree.items() if d == 0]
         # Stable sort for determinism
         queue.sort(key=lambda nid: node_map[nid].get('id')) 
         
         sorted_nodes = []
         while queue:
             curr = queue.pop(0)
             sorted_nodes.append(node_map[curr])
             
             for neighbor in adj_list[curr]:
                 in_degree[neighbor] -= 1
                 if in_degree[neighbor] == 0:
                     queue.append(neighbor)
         
         return sorted_nodes


    def _create_execution_result(self, execution_id, job_id, status, message, logs, start_time, trigger_type):
        end_time = datetime.utcnow().isoformat()
        duration = (datetime.fromisoformat(end_time) - datetime.fromisoformat(start_time)).total_seconds()
        
        result = {
            'id': execution_id,
            'jobId': job_id,
            'status': status,
            'message': message,
            'logs': logs,
            'startTime': start_time,
            'endTime': end_time,
            'duration': duration,
            'triggerType': trigger_type
        }
        
        # Save to DB
        self.job_service.save_execution(result)
        return result

    def get_by_workspace(self, workspace_id, limit=50):
        """Get executions by workspace."""
        return self.get_executions_by_workspace(workspace_id, limit)

    def get_by_job(self, job_id, limit=50):
        """Get executions by job."""
        return self.get_executions(job_id, limit)
        
    def get_by_id(self, execution_id):
        """Get execution by ID."""
        return self.job_service.get_execution(execution_id)


