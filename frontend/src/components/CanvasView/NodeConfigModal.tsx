import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/canvasStore';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

import { propagateSchema } from '../../utils/schemaPropagation';
import type { ColumnSchema } from '../../types/job';
import { DatabaseReaderConfig } from './DatabaseReaderConfig';
import { DatabaseWriterConfig } from './DatabaseWriterConfig';
import { FileReaderConfig } from './FileReaderConfig';
import { FileWriterConfig } from './FileWriterConfig';
import { TransformationConfig } from './TransformationConfig';
import { MessagingConfig } from './MessagingConfig';
import { getNodeSchema } from '../../utils/schemaPropagation';


interface NodeConfigModalProps {
  nodeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const NodeConfigModal: React.FC<NodeConfigModalProps> = ({ nodeId, isOpen, onClose, onSave }) => {
  const { nodes, edges, updateNodeData } = useCanvasStore();
  const node = nodes.find((n) => n.id === nodeId);
  const [config, setConfig] = useState<any>({});
  const [label, setLabel] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [editableSchema, setEditableSchema] = useState<ColumnSchema[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditingSchema, setIsEditingSchema] = useState(false);

  // Calculate Input Schema (from upstream) for Transformation Components
  const inputSchema = React.useMemo(() => {
     if (!node) return [];
     const upstreamEdge = edges.find(e => e.target === node.id);
     if (upstreamEdge) {
         // Get schema of the source node
         const sourceNode = nodes.find(n => n.id === upstreamEdge.source);
         if (sourceNode?.data.schema) return sourceNode.data.schema;
         // Or recursively find it
         return getNodeSchema(sourceNode?.id || '', nodes, edges) || [];
     }
     return [];
  }, [node, nodes, edges]);

  useEffect(() => {
    if (isOpen && node) {
      setConfig(JSON.parse(JSON.stringify(node.data.config || {})));
      setLabel(node.data.label || '');
      if (node.data.schema) {
        setEditableSchema(node.data.schema);
      } else {
        setEditableSchema([]);
      }
    }
  }, [isOpen, node]);


  if (!node) return null;

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev: any) => ({ ...prev, [key]: value }));
  };



  const addSchemaColumn = () => {
    setEditableSchema([...editableSchema, { name: '', type: 'string' }]);
  };

  const removeSchemaColumn = (index: number) => {
    setEditableSchema(editableSchema.filter((_, i) => i !== index));
  };

  const updateSchemaColumn = (index: number, field: 'name' | 'type' | 'value', value: string) => {
    const newSchema = [...editableSchema];
    newSchema[index] = { ...newSchema[index], [field]: value };
    setEditableSchema(newSchema);
  };

  const handleSave = () => {
    if (nodeId) {
      const updates: any = { config, label };
      
      // Save the edited schema
      if (editableSchema.length > 0) {
        updates.schema = editableSchema;
      }
      
      updateNodeData(nodeId, updates);
      
      // Propagate schema to downstream nodes if schema was updated
      if (editableSchema.length > 0) {
        const { nodes: currentNodes, edges, setNodes } = useCanvasStore.getState();
        const updatedNodes = propagateSchema(currentNodes, edges, nodeId, editableSchema);
        setNodes(updatedNodes);
      }
      
      if (onSave) onSave();
      onClose();
    }
  };

  const renderConfigFields = () => {
    const { type } = node.data;

    // Database Reader component
    if (type === 'database-reader') {
      return (
        <DatabaseReaderConfig
          config={config}
          onConfigChange={handleConfigChange}
          onPreview={() => alert('Database preview coming soon!')}
          previewLoading={false}
          previewError={null}
        />
      );
    }

    // Database Writer component
    if (type === 'database-writer') {
      return (
        <DatabaseWriterConfig
          config={config}
          onConfigChange={handleConfigChange}
        />
      );
    }

    // Unified File components
    // Unified File components
    if (type === 'file-reader' || type === 'file-writer') {
      if (type === 'file-reader') {
        return (
          <FileReaderConfig
            config={config}
            onConfigChange={handleConfigChange}
            nodeId={nodeId || undefined}
            onPreview={(result) => {
               setPreviewData(result);
               setEditableSchema(result.schema || []);
               setShowPreview(true);
            }}
          />
        );
      }

      if (type === 'file-writer') {
        return (
           <FileWriterConfig
              config={config}
              onConfigChange={handleConfigChange}
              onEditSchema={() => {
                   const schemaToUse = (editableSchema.length > 0) ? editableSchema : (node.data.schema || []);
                   setEditableSchema(schemaToUse);
                   setPreviewData({ data: [], schema: schemaToUse, totalRows: 0 });
                   setShowPreview(true);
                   setIsEditingSchema(true); 
              }}
           />
        );
      }
    }

    // Filter component
    if (type === 'filter') {
      const conditions = config.conditions || [{ column: '', operator: 'equals', value: '' }];
      
      const addCondition = () => {
        handleConfigChange('conditions', [...conditions, { column: '', operator: 'equals', value: '' }]);
      };
      
      const removeCondition = (index: number) => {
        const newConditions = conditions.filter((_: any, i: number) => i !== index);
        handleConfigChange('conditions', newConditions);
      };
      
      const updateCondition = (index: number, field: string, value: any) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: value };
        handleConfigChange('conditions', newConditions);
      };
      
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
              Logic
            </label>
            <select
              value={config.logic || 'AND'}
              onChange={(e) => handleConfigChange('logic', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
            >
              <option value="AND">AND (all conditions must match)</option>
              <option value="OR">OR (any condition must match)</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">
              Conditions
            </label>
            
            {conditions.map((condition: any, index: number) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {index === 0 && (
                      <label className="block text-xs font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                        Column
                      </label>
                  )}
                  {(node.data.schema && node.data.schema.length > 0) ? (
                      <select
                        value={node.data.schema.some((c: ColumnSchema) => c.name === condition.column) ? condition.column : ''}
                        onChange={(e) => updateCondition(index, 'column', e.target.value)}
                        className="w-full px-2 py-2 text-sm bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                      >
                        <option value="" disabled>Select column</option>
                        {node.data.schema.map((col: ColumnSchema) => (
                          <option key={col.name} value={col.name}>
                            {col.name}
                          </option>
                        ))}
                      </select>
                  ) : (
                    <div className={index === 0 ? "-mt-6" : "" /* Hack to align with Input label handling if needed, or just standard */}> 
                      {/* Input component handles label internally, but here we handled label externally for Select parity. 
                          If we use Input component, we pass label prop. */}
                        <Input
                            label={""} // Label handled above if index===0
                            value={condition.column || ''}
                            onChange={(e) => updateCondition(index, 'column', e.target.value)}
                            placeholder="Column name"
                        />
                    </div>
                  )}
                </div>
                
                <div className="col-span-3">
                  {index === 0 && (
                    <label className="block text-xs font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
                      Operator
                    </label>
                  )}
                  <select
                    value={condition.operator || 'equals'}
                    onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    className="w-full px-2 py-2 text-sm bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
                  >
                    <option value="equals">=</option>
                    <option value="not_equals">≠</option>
                    <option value="greater_than">&gt;</option>
                    <option value="less_than">&lt;</option>
                    <option value="contains">contains</option>
                    <option value="starts_with">starts with</option>
                    <option value="ends_with">ends with</option>
                  </select>
                </div>
                
                <div className="col-span-4">
                  <Input
                    label={index === 0 ? "Value" : ""}
                    value={condition.value || ''}
                    onChange={(e) => updateCondition(index, 'value', e.target.value)}
                    placeholder="Value"
                  />
                </div>
                
                <div className="col-span-1 pb-2">
                  <button
                    onClick={() => removeCondition(index)}
                    className="w-full h-9 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Remove condition"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            
            <button
              onClick={addCondition}
              className="w-full py-2 px-4 text-sm border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-accent-blue hover:bg-vercel-accent-blue/10 transition-colors"
            >
              + Add Condition
            </button>
          </div>
        </div>
      );
    }

    // Messaging components
    if (type === 'kafka-input' || type === 'kafka-output') {
      return (
        <MessagingConfig
           type={type}
           config={config}
           onConfigChange={handleConfigChange}
        />
      );
    }

    // Transformation components
    const transformationTypes = [
      'aggregate', 
      'sort', 
      'uniq-row', 
      'normalize', 
      'denormalize', 
      'split-row', 
      'convert-type', 
      'row-generator', 
      'run-job', 
      'java-row', 
      'rest-client'
    ];
    
    if (transformationTypes.includes(type)) {
       return (
          <TransformationConfig 
             type={type} 
             config={config} 
             onConfigChange={handleConfigChange} 
             schema={inputSchema.length > 0 ? inputSchema : (node.data.schema || [])} 
          />
       );
    }

    // Union component
    if (type === 'union') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text mb-1.5">
              Union Mode
            </label>
            <select
              value={config.mode || 'all'}
              onChange={(e) => handleConfigChange('mode', e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text dark:text-vercel-dark-text focus:outline-none focus:ring-2 focus:ring-vercel-accent-blue"
            >
              <option value="all">All (keep duplicates)</option>
              <option value="distinct">Distinct (remove duplicates)</option>
            </select>
          </div>
          <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
            Union combines multiple input datasets into one.
          </p>
        </div>
      );
    }

    // Log component
    if (type === 'log') {
      return (
        <div className="space-y-4">
          <Input
            label="Message"
            value={config.message || 'Logging data...'}
            onChange={(e) => handleConfigChange('message', e.target.value)}
            placeholder="Enter message to display in logs"
          />
          <p className="text-sm text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
            This component will print the message and the data passing through it to the execution logs.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} title={`Configure ${node.data.type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`} size="xl">
      <div className="space-y-6">
        <Input
          label="Component Name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Enter component name"
        />
        
        <div className="border-t border-vercel-light-border dark:border-vercel-dark-border pt-4">
            <h3 className="text-md font-semibold text-vercel-light-text dark:text-vercel-dark-text mb-4">Configuration</h3>
            {renderConfigFields()}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-vercel-light-border dark:border-vercel-dark-border">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
    
    {/* Preview Modal */}
    <Modal
      isOpen={showPreview}
      onClose={() => setShowPreview(false)}
      title="File Preview & Schema"
      size="xl"
    >
      {previewData && (
        <div className="flex h-[70vh] gap-6 -m-4 p-4">
          {/* Left Side: Schema (Fixed width) */}
          <div className="w-80 flex-shrink-0 flex flex-col border-r border-vercel-light-border dark:border-vercel-dark-border pr-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">
                Schema ({editableSchema.length})
              </h3>
              <div className="flex gap-2">
                {isEditingSchema && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        // Reset schema from preview data if available
                        if (previewData?.schema) {
                            setEditableSchema(previewData.schema);
                        }
                    }}
                    title="Reset to inferred schema from file"
                  >
                    Reset
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditingSchema(!isEditingSchema)}
                >
                  {isEditingSchema ? 'Done' : 'Edit'}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {isEditingSchema ? (
                <>
                  {editableSchema.map((col, idx) => (
                    <div key={idx} className="p-3 bg-vercel-light-surface dark:bg-vercel-dark-bg rounded-lg border border-vercel-light-border dark:border-vercel-dark-border space-y-2">
                       <div className="flex justify-between items-start gap-2">
                          <Input
                            value={col.name}
                            onChange={(e) => updateSchemaColumn(idx, 'name', e.target.value)}
                            placeholder="Name"
                            className="bg-white dark:bg-vercel-dark-surface"
                          />
                          <button
                            onClick={() => removeSchemaColumn(idx)}
                            className="text-vercel-light-text-secondary hover:text-red-500 p-1"
                          >
                            ×
                          </button>
                       </div>
                       <select
                          value={col.type}
                          onChange={(e) => updateSchemaColumn(idx, 'type', e.target.value)}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-md focus:outline-none focus:ring-1 focus:ring-vercel-accent-blue"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="integer">Integer</option>
                          <option value="boolean">Boolean</option>
                          <option value="date">Date</option>
                        </select>
                        {(node.data.type.includes('writer') || col.value) && (
                           <Input
                             value={col.value || ''}
                             onChange={(e) => updateSchemaColumn(idx, 'value', e.target.value)}
                             placeholder="Default Value (Optional)"
                             className="text-xs bg-white dark:bg-vercel-dark-surface"
                           />
                        )}
                    </div>
                  ))}
                  <button
                    onClick={addSchemaColumn}
                    className="w-full py-2 text-sm border border-dashed border-vercel-light-border dark:border-vercel-dark-border rounded-lg text-vercel-light-text-secondary hover:bg-vercel-light-surface dark:hover:bg-vercel-dark-surface hover:text-vercel-accent-blue transition-colors"
                  >
                    + Add Column
                  </button>
                </>
              ) : (
                <div className="space-y-1">
                  {editableSchema.map((col, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-vercel-light-surface dark:hover:bg-vercel-dark-surface rounded-md group">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text truncate" title={col.name}>
                          {col.name}
                        </span>
                        <span className="text-[10px] text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary uppercase">
                          {col.type}
                        </span>
                        {col.value && (
                            <span className="text-[10px] text-vercel-accent-blue truncate mt-0.5" title={`Default: ${col.value}`}>
                                = {col.value}
                            </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Side: Sample Data (Scrollable) */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-4">
               <h3 className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text">
                Sample Data
              </h3>
               <p className="text-xs text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
                Showing {previewData.data?.length || 0} of {previewData.totalRows} rows
              </p>
            </div>
            
            <div className="flex-1 overflow-auto border border-vercel-light-border dark:border-vercel-dark-border rounded-lg bg-white dark:bg-vercel-dark-surface custom-scrollbar">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-vercel-light-surface dark:bg-vercel-dark-bg sticky top-0 z-10">
                  <tr>
                    {editableSchema.map((col, idx) => (
                      <th key={idx} className="px-4 py-3 text-left font-medium text-vercel-light-text dark:text-vercel-dark-text border-b border-r border-vercel-light-border dark:border-vercel-dark-border last:border-r-0 whitespace-nowrap bg-vercel-light-surface dark:bg-vercel-dark-bg">
                        <div className="flex flex-col">
                            <span>{col.name}</span>
                            <span className="text-[10px] text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary font-normal uppercase">{col.type}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.data?.map((row: any, rowIdx: number) => (
                    <tr key={rowIdx} className="hover:bg-vercel-light-bg dark:hover:bg-vercel-dark-bg/50 group">
                      {editableSchema.map((col, colIdx: number) => (
                        <td key={colIdx} className="px-4 py-2 text-vercel-light-text dark:text-vercel-dark-text border-b border-r border-vercel-light-border dark:border-vercel-dark-border last:border-r-0 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                          {String(row[col.name] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!previewData.data || previewData.data.length === 0) && (
                <div className="flex items-center justify-center h-40 text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
                  No data available
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-4">
                <Button variant="primary" onClick={() => setShowPreview(false)}>
                Close
                </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
    </>
  );
};
