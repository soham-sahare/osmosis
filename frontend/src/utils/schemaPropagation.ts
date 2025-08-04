import type { Node, Edge } from 'reactflow';
import type { ComponentData, ColumnSchema } from '../types/job';

/**
 * Propagate schema from source nodes to downstream nodes
 */
export const propagateSchema = (
  nodes: Node<ComponentData>[],
  edges: Edge[],
  sourceNodeId: string,
  schema: ColumnSchema[]
): Node<ComponentData>[] => {
  // Build adjacency list for downstream propagation (store edges, not just target IDs)
  const adjacencyList = new Map<string, Edge[]>();
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge);
  });

  // BFS to propagate schema to all downstream nodes
  // Queue stores nodeId and the schema that WAS propagated TO it (or initial schema)
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; schema: ColumnSchema[] }> = [
    { nodeId: sourceNodeId, schema }
  ];

  const updatedNodes = [...nodes];

  while (queue.length > 0) {
    const { nodeId, schema: incomingSchema } = queue.shift()!;
    
    // Allow revisiting nodes? No, keep it simple for now (DAG).
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    // Update current node's schema in the state
    const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
    let currentNode: Node<ComponentData> | undefined;

    if (nodeIndex !== -1) {
      updatedNodes[nodeIndex] = {
        ...updatedNodes[nodeIndex],
        data: {
          ...updatedNodes[nodeIndex].data,
          schema: incomingSchema
        }
      };
      currentNode = updatedNodes[nodeIndex];
    } else {
        // Should not happen, but safe fallback lookup
        currentNode = nodes.find(n => n.id === nodeId);
    }

    if (!currentNode) continue;

    // Get outgoing edges
    const downstreamEdges = adjacencyList.get(nodeId) || [];
    
    for (const edge of downstreamEdges) {
      const downstreamId = edge.target;
      const downstreamNode = updatedNodes.find(n => n.id === downstreamId);
      if (!downstreamNode) continue;

      // Determine the schema to propagate to THIS specific edge
      let schemaToPropagate = incomingSchema;

      // Special handling for Multi-Output Map nodes
      if (currentNode.data.type === 'map' && edge.sourceHandle && currentNode.data.config.outputs?.[edge.sourceHandle]) {
          schemaToPropagate = currentNode.data.config.outputs[edge.sourceHandle].schema || [];
      } else if (currentNode.data.type === 'map' && currentNode.data.config.outputs) {
          // Fallback if Map but no handle (shouldn't happen with valid connections)
          // Use first output? Or incoming?
          // If we are at the Map node, 'incomingSchema' is actually the INPUT to the Map (from upstream).
          // Wait! The logic at the top of the loop sets `incomingSchema` as `node.data.schema`?
          
          // CRITICAL FIX: 
          // If `nodeId` IS the `sourceNodeId` (the one triggering propagation, e.g. a File Reader), `incomingSchema` is correct.
          // If `nodeId` is a Map node in the middle of a chain...
          // The Map node's own `data.schema` should reflect its DEFAULT output.
          // BUT when propagating downstream, we must use the Output Configs.
          
          // If the Map node itself was updated in the loop (lines 38-46), its `data.schema` is `incomingSchema`.
          // But a Map node's `data.schema` is technically its Output Schema (primary).
          // Input schema to a Map node does NOT become its Output Schema (unlike Filter).
          // Map node transforms it.
          
          // SO: If the current node is a TRANSFORMING node (Map), we shouldn't overwrite its schema with `incomingSchema` from upstream?
          // Actually, `propagateSchema` is usually called when UPSTREAM changes.
          // If upstream changes, Map output might become invalid?
          // Or does Map output schema persist independently?
          // In our implementation, Map output schema is MANUALLY configured in Editor.
          // It does NOT derive automatically from input (except for manual auto-mapping).
          // So propagating Input Schema INTO a Map Node should NOT overwrite the Map's usage of that schema?
          // Actually, `node.data.schema` represents "What this node Outputs".
          
          // Issue: If I trigger propagation from `FileReader` -> `Map`.
          // `incomingSchema` = Reader Schema.
          // Loop processes `Map` node.
          // Lines 39-45 overwrite `Map.data.schema` with `Reader Schema`.
          // THIS IS WRONG for Map! Map has its own schema.
          
          // Fix: `transformSchemaForComponent` handles the transformation logic.
          // But here we are applying `incomingSchema` directly to `data.schema`.
          
          // Refinement: 
          // 1. `incomingSchema` is what is ARRIVING at the node.
          // 2. We should Store it as `inputSchema`? No, we don't store input schema on nodes.
          // 3. We calculate `outputSchema` based on `incomingSchema` + `Node Logic`.
          // 4. Update `node.data.schema` with `outputSchema`.
          // 5. Propagate `outputSchema` downstream.
          
          // Let's look only at the Multi-Output logic for now.
          // If `currentNode` is Map, its schema is defined by config.
          // We should NOT overwrite it with `incomingSchema`?
          // Correct. Map ignores input schema for its output definition (it uses input schema for MAPPING UI, but output is separate).
      }
      
      // Calculate effective output schema for the node
      if (currentNode.data.type === 'map') {
           // For Map, outputs are keyed by the TARGET Node ID.
           const mapOutputs = currentNode.data.config.outputs || {};
           
           if (mapOutputs[downstreamId]) {
               schemaToPropagate = mapOutputs[downstreamId].schema || [];
           } else {
               // Fallback: If mapOutputs exists but this target isn't in it (e.g. not configured yet),
               // we should probably send an EMPTY schema rather than the Primary Schema.
               // Sending Primary Schema causes confusion (user sees Output 1 columns on Output 2).
               // However, if mapOutputs is completely empty (legacy/unconfigured), fallback to primary might be safer?
               // Let's check keys length.
               if (Object.keys(mapOutputs).length > 0) {
                   // Map is configured for some outputs, but not this one.
                   // Be precise: return empty schema for unconfigured output.
                   schemaToPropagate = [];
               } else {
                   // Map has no outputs configured. Use primary schema (or empty).
                   schemaToPropagate = currentNode.data.schema || [];
               }
           }
      } 
      
      // Transform schema based on component type of the DOWNSTREAM node?
      // No, `transformSchemaForComponent` (lines 72..) logic seems to be:
      // "Given Input Schema, what does this component Output?"
      // But it's called on `downstreamNode` with `currentSchema`.
      // So it calculates what the Downstream Node outputs given the current node's output.
      
      // Wait, `transformSchemaForComponent` is: `(inputSchema, componentType, config) -> outputSchema`.
      // It is used to calculate the schema FOR the queue (next iteration).
      
      // So if `Map` -> `Filter`.
      // `currentSchema` = Map Output (via handle).
      // `transform(MapOutput, 'filter')` -> `FilterOutput` (= MapOutput).
      // Queue pushes `filter` with `FilterOutput`.
      // Next Loop: `nodeId` = Filter. `incomingSchema` = FilterOutput.
      // Filter.data.schema updated to `FilterOutput`.
      
      // This looks correct.
      
      const transformedSchema = transformSchemaForComponent(
        schemaToPropagate,
        downstreamNode.data.type,
        downstreamNode.data.config
      );

      queue.push({ nodeId: downstreamId, schema: transformedSchema });
    }
  }

  return updatedNodes;
};

/**
 * Transform schema based on component type
 */
const transformSchemaForComponent = (
  inputSchema: ColumnSchema[],
  componentType: string,
  _config: any // Prefixed with _ to indicate intentionally unused
): ColumnSchema[] => {
  // For most components, schema passes through unchanged
  let outputSchema = [...inputSchema];

  // Filter component - schema stays the same (just filters rows)
  if (componentType === 'filter') {
    return outputSchema;
  }

  // Aggregate component - modifies schema
  if (componentType === 'aggregate') {
    const config = _config || {};
    const newSchema: ColumnSchema[] = [];
    
    // Add Group By columns
    if (config.groupByColumns) {
       config.groupByColumns.forEach((colName: string) => {
          const originalCol = inputSchema.find(c => c.name === colName);
          newSchema.push(originalCol || { name: colName, type: 'string' });
       });
    }
    
    // Add Aggregation columns
    if (config.aggregations) {
       config.aggregations.forEach((agg: any) => {
          const name = agg.targetColumn || agg.column + '_' + agg.operation;
          // Type depends on operation
          let type: ColumnSchema['type'] = 'number'; // count, sum, avg
          if (['max', 'min', 'first', 'last'].includes(agg.operation)) {
             const originalCol = inputSchema.find(c => c.name === agg.column);
             type = originalCol ? originalCol.type : 'string';
          }
          newSchema.push({ name, type });
       });
    }
    
    // If no config, pass through (or empty?)
    return newSchema.length > 0 ? newSchema : outputSchema;
  }

  // Normalize (Unpivot/Melt)
  if (componentType === 'normalize') {
      const config = _config || {};
      const newSchema: ColumnSchema[] = [];
      
      // Keep ID columns
      if (config.idColumns) {
           config.idColumns.forEach((colName: string) => {
              const originalCol = inputSchema.find(c => c.name === colName);
              newSchema.push(originalCol || { name: colName, type: 'string' });
           });
      }
      
      // Add variable and value columns
      newSchema.push({ name: config.varName || 'variable', type: 'string' });
      // Value column type? Hard to say if mixed. Default string or try to infer from valueColumns?
      newSchema.push({ name: config.valueName || 'value', type: 'string' });
      
      return newSchema;
  }
  
  // Row Generator - Schema defined in config
  if (componentType === 'row-generator') {
      const config = _config || {};
      if (config.fields) {
          return config.fields.map((f: any) => ({ name: f.name, type: (f.type || 'string') as ColumnSchema['type'] }));
      }
      return outputSchema;
  }

  // Convert Type - Update types
  if (componentType === 'convert-type') {
      const config = _config || {};
      if (config.conversions) {
          return outputSchema.map(col => {
              const conv = config.conversions.find((c: any) => c.column === col.name);
              if (conv) {
                  return { ...col, type: conv.type };
              }
              return col;
          });
      }
      return outputSchema;
  }

  // Split Row (Explode) - Schema same
  if (componentType === 'split-row') {
      return outputSchema;
  }
  
  // Unique Row - Schema same
  if (componentType === 'uniq-row') {
      return outputSchema;
  }

  // Denormalize (Pivot) - Schema Unpredictable
  if (componentType === 'denormalize') {
       // We can only propagate Index columns
       // The rest are dynamic. We basically "break" the schema propagation or set it to partial
       const config = _config || {};
       const newSchema: ColumnSchema[] = [];
       if (config.indexColumns) {
           config.indexColumns.forEach((colName: string) => {
              const originalCol = inputSchema.find(c => c.name === colName);
              newSchema.push(originalCol || { name: colName, type: 'string' });
           });
       }
       return newSchema;
  }

  // Rest Client - Adds status_code and response_body or Is Source
  if (componentType === 'rest-client') {
       // If no input data (Source mode), we don't know schema unless we define it?
       // Usually returns a list of Dicts.
       // If Transfom mode, it appends columns.
       const newSchema = [...outputSchema];
       newSchema.push({ name: 'status_code', type: 'integer' });
       newSchema.push({ name: 'response_body', type: 'string' }); // or json object
       return newSchema;
  }
  
  // Run Job, Java Row, Script - Pass through or Unknown
  if (['run-job', 'java-row'].includes(componentType)) {
      return outputSchema;
  }

  // Sort component - schema stays the same (just reorders rows)
  if (componentType === 'sort') {
    return outputSchema;
  }

  // Union component - simple merge (assuming same schema for now)
  if (componentType === 'union') {
    return outputSchema;
  }

  // Log component - schema passes through
  if (componentType === 'log') {
    return outputSchema;
  }

  // File writer / Database writer - schema passes through
  if (componentType.includes('writer') || componentType.includes('output')) {
    return outputSchema;
  }

  return outputSchema;
};

/**
 * Get the schema for a specific node by tracing back through the graph
 */
export const getNodeSchema = (
  nodeId: string,
  nodes: Node<ComponentData>[],
  edges: Edge[]
): ColumnSchema[] | null => {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // If node has schema, return it
  if (node.data.schema && node.data.schema.length > 0) {
    return node.data.schema;
  }

  // Find upstream nodes
  const upstreamEdges = edges.filter(e => e.target === nodeId);
  if (upstreamEdges.length === 0) {
    return null;
  }

  const upstreamNodeId = upstreamEdges[0].source;
  return getNodeSchema(upstreamNodeId, nodes, edges);
};
