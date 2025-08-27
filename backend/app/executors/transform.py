from .base import BaseExecutor
import pandas as pd
import numpy as np

class MapExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        """
        Execute Map component (Join).
        Args:
            input_data: List of inputs from upstream. Each input is {'sourceId': ..., 'data': ...} OR just a list?
            Warning: The BaseExecutor signature expects `input_data` to be data. 
            ExecutionService passes `inputs` (list of dicts with sourceId and data) when calling MapExecutor.
        """
        inputs = input_data or []
        if not inputs: return []
        
        # 1. Load inputs into DataFrames
        dfs = []
        for idx, inp in enumerate(inputs):
            # Ensure data is list of dicts
            raw_data = inp.get('data', [])
            if not isinstance(raw_data, list): raw_data = [raw_data] if raw_data else []
            
            df = pd.DataFrame(raw_data)
            # Rename columns to rowX.colname to avoid collision
            prefix = f"row{idx+1}."
            df = df.rename(columns={col: f"{prefix}{col}" for col in df.columns})
            dfs.append(df)

        if not dfs: return []
        
        # 2. Advanced Join Logic
        joined_df = dfs[0]
        input_join_configs = config.get('inputJoinConfigs', {})
        
        for i in range(1, len(dfs)):
            lookup_df = dfs[i]
            lookup_node_id = inputs[i]['sourceId']
            
            join_cfg = input_join_configs.get(lookup_node_id)
            
            if join_cfg and join_cfg.get('keys'):
                # Use configured keys
                left_on = [k['leftColumn'] for k in join_cfg['keys']]
                # Right column needs prefix 'rowN.'
                right_prefix = f"row{i+1}."
                right_on = [f"{right_prefix}{k['rightColumn']}" for k in join_cfg['keys']]
                
                how = join_cfg.get('type', 'left')
                
                try:
                    joined_df = pd.merge(
                        joined_df, 
                        lookup_df, 
                        left_on=left_on, 
                        right_on=right_on, 
                        how=how,
                        suffixes=('', f'_dup_{i}') 
                    )
                except Exception as e:
                    print(f"Join failed: {e}")
                    # Fallback or empty?
            else:
                # Default to Index Match (Left Join) or Cross?
                # Using 'left' on index usually implies row-by-row matching if sorted?
                # Actually if no keys, maybe it's a cross join? Or row-number match?
                # Standard pandas merge on index:
                joined_df = pd.merge(
                    joined_df, 
                    lookup_df, 
                    left_index=True, 
                    right_index=True, 
                    how='left'
                )

        # 3. Apply Mappings & Generate Outputs
        outputs_config = config.get('outputs', {})
        joined_records = joined_df.replace({np.nan: None}).to_dict('records')

        def apply_mappings(records, mappings):
            if not mappings: return records
            rows = []
            for row in records:
                new_row = {}
                for m in mappings:
                    target = m['targetColumn']
                    expr = m.get('expression', '')
                    # Simple expression resolution: column name check
                    if expr in row:
                        new_row[target] = row[expr]
                    else:
                        new_row[target] = expr # Constant
                rows.append(new_row)
            return rows

        # MapExecutor returns either a dict of outputs (for multi-output) OR a list (if single)
        # ExecutionService expects dict for Map if multiple outputs?
        # But BaseExecutor signature returns generic structure.
        
        if outputs_config:
            final_results = {}
            for out_name, out_cfg in outputs_config.items():
                out_mappings = out_cfg.get('mappings', [])
                final_results[out_name] = apply_mappings(joined_records, out_mappings)
            return final_results
        else:
            mappings = config.get('mappings', [])
            return apply_mappings(joined_records, mappings)

class SortRowExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        if not input_data: return []
        df = pd.DataFrame(input_data)
        
        sort_cols = []
        ascending = []
        
        # Determine sort columns
        if config.get('columns'):
             for col in config.get('columns'):
                 sort_cols.append(col['name'])
                 ascending.append(col['order'] == 'asc')
        elif config.get('column'):
             # Legacy single column
             sort_cols.append(config.get('column'))
             ascending.append(config.get('order', 'asc') == 'asc')
             
        if sort_cols:
            df = df.sort_values(by=sort_cols, ascending=ascending)
            
        return df.to_dict('records')

class AggregateRowExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        if not input_data: return []
        df = pd.DataFrame(input_data)
        
        group_by = config.get('groupByColumns', [])
        aggs = config.get('aggregations', [])
        
        if not group_by or not aggs:
             return input_data # Pass through if not configured
             
        agg_dict = {}
        for agg in aggs:
            col = agg['column']
            op = agg['operation']
            # Pandas aggregation mapping
            if op == 'avg': op = 'mean'
            
            if col not in agg_dict:
                agg_dict[col] = []
            agg_dict[col].append(op)
            
        # Group and Aggregate
        grouped = df.groupby(group_by).agg(agg_dict)
        
        # Flatten MultiIndex columns
        grouped.columns = ['_'.join(col).strip() for col in grouped.columns.values]
        grouped = grouped.reset_index()
        
        return grouped.to_dict('records')

class UniqRowExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        if not input_data: return []
        df = pd.DataFrame(input_data)
        
        subset = config.get('uniqueKey') # List of columns
        if subset:
            df = df.drop_duplicates(subset=subset)
        else:
            df = df.drop_duplicates()
            
        return df.to_dict('records')

class NormalizeExecutor(BaseExecutor):
    """Unpivot / Melt"""
    def execute(self, config, input_data=None, context=None):
        if not input_data: return []
        df = pd.DataFrame(input_data)
        
        id_vars = config.get('idColumns', [])
        val_vars = config.get('valueColumns')
        var_name = config.get('varName', 'variable')
        value_name = config.get('valueName', 'value')
        
        melted = df.melt(id_vars=id_vars, value_vars=val_vars, var_name=var_name, value_name=value_name)
        return melted.to_dict('records')

class DenormalizeExecutor(BaseExecutor):
    """Pivot"""
    def execute(self, config, input_data=None, context=None):
        if not input_data: return []
        df = pd.DataFrame(input_data)
        
        index = config.get('indexColumns', [])
        columns = config.get('pivotColumn')
        values = config.get('valueColumn')
        agg_func = config.get('aggFunc', 'first')
        
        if not index or not columns or not values:
            return input_data
            
        pivoted = df.pivot_table(index=index, columns=columns, values=values, aggfunc=agg_func).reset_index()
        return pivoted.to_dict('records')

class SplitRowExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        if not input_data: return []
        df = pd.DataFrame(input_data)
        
        col = config.get('column')
        separator = config.get('separator', ',')
        
        if col and col in df.columns:
            # Split and Explode
            df[col] = df[col].astype(str).str.split(separator)
            df = df.explode(col)
            
        return df.to_dict('records')

class ConvertTypeExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        if not input_data: return []
        df = pd.DataFrame(input_data)
        
        conversions = config.get('conversions', [])
        for conv in conversions:
            col = conv['column']
            dtype = conv['type']
            
            if col in df.columns:
                try:
                    if dtype == 'integer':
                        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
                    elif dtype == 'double' or dtype == 'float':
                         df[col] = pd.to_numeric(df[col], errors='coerce')
                    elif dtype == 'string':
                         df[col] = df[col].astype(str)
                    elif dtype == 'boolean':
                         df[col] = df[col].astype(bool)
                    elif dtype == 'date':
                         df[col] = pd.to_datetime(df[col], errors='coerce')
                except Exception as e:
                    print(f"Conversion error for {col}: {e}")
                    
        return df.to_dict('records')

class RowGeneratorExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        # Generates data from scratch
        try:
           count = int(config.get('rowCount', 10))
        except:
           count = 10
           
        fields = config.get('fields', [])
        
        data = []
        for i in range(count):
            row = {}
            for f in fields:
                name = f['name']
                ftype = f.get('type', 'string')
                # Basic mock data generation
                if ftype == 'integer': row[name] = i
                elif ftype == 'string': row[name] = f"val_{i}"
                elif ftype == 'date': row[name] = "2023-01-01"
                elif ftype == 'boolean': row[name] = (i % 2 == 0)
                else: row[name] = f"data_{i}"
            data.append(row)
            
        return data

class FilterRowExecutor(BaseExecutor):
    def execute(self, config, input_data=None, context=None):
        """Filter rows based on conditions."""
        if not input_data: return []
        
        # Simple logical condition: column operator value
        # Or advanced python expression
        
        condition = config.get('condition', '') # Python expression e.g. "row['amount'] > 100"
        
        if not condition:
             # Legacy support or No-Op
             return input_data
             
        rows = []
        for row in input_data:
            try:
                # Safe-ish eval? Or just eval?
                # User provided code execution is a feature here (JavaRow equivalent)
                # Available context: row, math, etc.
                if eval(condition, {"__builtins__": None}, {'row': row, 'int': int, 'float': float, 'str': str}):
                    rows.append(row)
            except Exception as e:
                # Log error or skip? Skip for now, maybe log 1 error
                pass
                
        return rows
