import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import { Modal } from '../../common/Modal';
import { Button } from '../../common/Button';
import type { Node } from 'reactflow';
import type { ColumnSchema } from '../../../types/job';

interface MapEditorModalProps {
  nodeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export const MapEditorModal: React.FC<MapEditorModalProps> = ({
  nodeId,
  isOpen,
  onClose,
  onSave
}) => {
  const { nodes, edges, updateNodeData } = useCanvasStore();
  const node = nodes.find((n) => n.id === nodeId);
  
  // State
  const [inputNodes, setInputNodes] = useState<Node[]>([]);
  const [outputNodes, setOutputNodes] = useState<Node[]>([]); 
  
  // Multi-output state
  const [outputs, setOutputs] = useState<Record<string, { schema: ColumnSchema[], mappings: any[] }>>({});
  const [activeOutput, setActiveOutput] = useState<string>(''); // Target Node ID
  
  // Current buffer state
  const [outputSchema, setOutputSchema] = useState<ColumnSchema[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  
  const [inputJoinConfigs, setInputJoinConfigs] = useState<Record<string, { type: 'inner' | 'left' | 'full', keys: any[] }>>({});

  // Initialize
  useEffect(() => {
    if (isOpen && node) {
      // Inputs
      const incomingEdges = edges.filter(e => e.target === nodeId);
      const sources = incomingEdges.map(e => nodes.find(n => n.id === e.source)).filter(Boolean) as Node[];
      setInputNodes(sources);
      
      // Outputs (Downstream)
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      const rawDestinations = outgoingEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean) as Node[];
      // Deduplicate by ID
      const destinations = Array.from(new Map(rawDestinations.map(n => [n.id, n])).values());
      setOutputNodes(destinations);

      // Join Configs
      setInputJoinConfigs(node.data.config.inputJoinConfigs || {});

      // Outputs Config
      const existingOutputs = node.data.config.outputs || {};
      const newOutputs: typeof existingOutputs = {};
      
      // Sync with connections
      destinations.forEach(dest => {
          if (existingOutputs[dest.id]) {
              newOutputs[dest.id] = existingOutputs[dest.id];
          } else {
              newOutputs[dest.id] = { schema: [], mappings: [] };
          }
      });
      
      setOutputs(newOutputs);
      
      // Set Active Output
      const destIds = destinations.map(d => d.id);
      if (activeOutput && destIds.includes(activeOutput)) {
           const current = newOutputs[activeOutput];
           setOutputSchema(current?.schema || []);
           setMappings(current?.mappings || []);
      } else if (destinations.length > 0) {
           const firstId = destinations[0].id;
           setActiveOutput(firstId);
           setOutputSchema(newOutputs[firstId]?.schema || []);
           setMappings(newOutputs[firstId]?.mappings || []);
      } else {
           setActiveOutput('');
           setOutputSchema([]);
           setMappings([]);
      }
    }
  }, [isOpen, nodeId, nodes, edges]);

  // Sync buffer
  useEffect(() => {
      if (activeOutput) {
          setOutputs(prev => ({
              ...prev,
              [activeOutput]: {
                  schema: outputSchema,
                  mappings: mappings
              }
          }));
      }
  }, [outputSchema, mappings, activeOutput]);

  const handleSwitchOutput = (targetId: string) => {
      if (targetId === activeOutput) return;
      
      const target = outputs[targetId] || { schema: [], mappings: [] };
      setOutputSchema(target.schema);
      setMappings(target.mappings);
      setActiveOutput(targetId);
  };

  const handleSave = () => {
    if (!node) return;
    
    const finalOutputs = { ...outputs };
    if (activeOutput) {
        finalOutputs[activeOutput] = { schema: outputSchema, mappings };
    }
    
    const firstKey = Object.keys(finalOutputs)[0];
    const primarySchema = firstKey ? finalOutputs[firstKey].schema : [];

    updateNodeData(nodeId, {
      config: {
        ...node.data.config,
        mappings, 
        outputs: finalOutputs,
        inputJoinConfigs,
      },
      schema: primarySchema
    });
    
    if (onSave) onSave();
    onClose();
  };

  const handleJoinDrop = (e: React.DragEvent, targetNodeId: string, targetColumn: string) => {
      e.preventDefault();
      const sourceCol = e.dataTransfer.getData('sourceColumn');
      const sourceLabel = e.dataTransfer.getData('sourceLabel');
      
      if (sourceCol && sourceLabel) {
          const leftExpr = `${sourceLabel}.${sourceCol}`;
          
          setInputJoinConfigs(prev => {
              const currentConfig = prev[targetNodeId] || { type: 'left', keys: [] };
              const exists = currentConfig.keys.some((k: any) => k.rightColumn === targetColumn && k.leftColumn === leftExpr);
              if (exists) return prev;
              
              return {
                  ...prev,
                  [targetNodeId]: {
                      ...currentConfig,
                      keys: [...currentConfig.keys, { leftColumn: leftExpr, rightColumn: targetColumn }]
                  }
              };
          });
      }
  };

  const removeJoinKey = (nodeId: string, idx: number) => {
      setInputJoinConfigs(prev => {
          const config = prev[nodeId];
          if (!config) return prev;
          return {
              ...prev,
              [nodeId]: {
                  ...config,
                  keys: config.keys.filter((_: any, i: number) => i !== idx)
              }
          };
      });
  };

  if (!node) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Map Editor - ${node.data.label}`}
      size="full" 
    >
      <div className="flex flex-col h-[80vh] -m-4">
        {/* Toolbar */}
        <div className="flex justify-between items-center p-4 border-b border-vercel-light-border dark:border-vercel-dark-border">
            <h3 className="font-medium">Map Transformations</h3>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save & Close</Button>
            </div>
        </div>

        {/* 3-Pane Layout */}
        <div className="flex flex-1 overflow-hidden">
            
            {/* Left: Inputs */}
            <div className="w-1/4 border-r border-vercel-light-border dark:border-vercel-dark-border flex flex-col bg-vercel-light-surface/50 dark:bg-vercel-dark-surface/50">
                <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b font-medium text-xs uppercase tracking-wider">
                    Inputs ({inputNodes.length})
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {inputNodes.map((inputNode, idx) => {
                        const isMain = idx === 0;
                        const joinConfig = inputJoinConfigs[inputNode.id] || { type: 'left', keys: [] };

                        return (
                        <div key={inputNode.id} className="bg-white dark:bg-vercel-dark-bg border border-vercel-light-border dark:border-vercel-dark-border rounded-lg shadow-sm">
                            <div className="px-3 py-2 border-b border-vercel-light-border dark:border-vercel-dark-border bg-gray-50 dark:bg-gray-800 rounded-t-lg flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">{inputNode.data.label} (row{idx + 1})</span>
                                    <span className="text-[10px] text-gray-500">{inputNode.data.type}</span>
                                </div>
                                {!isMain && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <select 
                                            value={joinConfig.type}
                                            onChange={(e) => {
                                                setInputJoinConfigs(prev => ({
                                                    ...prev,
                                                    [inputNode.id]: { ...joinConfig, type: e.target.value as any }
                                                }));
                                            }}
                                            className="bg-white dark:bg-vercel-dark-bg border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 text-xs focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="left">Left Join</option>
                                            <option value="inner">Inner Join</option>
                                            <option value="full">Full Join</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="p-2 space-y-1">
                                {inputNode.data.schema?.map((col: ColumnSchema) => {
                                    const linkedKey = !isMain ? joinConfig.keys.find((k: any) => k.rightColumn === col.name) : null;
                                    
                                    // Check if this field is mapped to any output
                                    const fieldRef = `row${idx + 1}.${col.name}`;
                                    const isMapped = mappings.some(m => m.expression === fieldRef);
                                    
                                    return (
                                        <div 
                                            key={col.name} 
                                            className={`text-xs px-2 py-1 rounded flex justify-between items-center group border-l-2 transition-all
                                                ${linkedKey ? 'bg-purple-50 dark:bg-purple-900/20 border-l-purple-500' : ''}
                                                ${isMapped ? 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10' : 'border-l-transparent'}
                                                ${!linkedKey && !isMapped ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20' : ''}
                                            `}
                                            draggable
                                            onDragStart={(e) => {
                                                e.dataTransfer.setData('sourceColumn', col.name);
                                                e.dataTransfer.setData('sourceNodeId', inputNode.id);
                                                e.dataTransfer.setData('sourceLabel', `row${idx + 1}`);
                                            }}
                                            onDragOver={(e) => !isMain && e.preventDefault()}
                                            onDrop={(e) => !isMain && handleJoinDrop(e, inputNode.id, col.name)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <span className="font-medium text-vercel-light-text dark:text-vercel-dark-text truncate">{col.name}</span>
                                                <span className="text-[10px] text-gray-400 group-hover:text-blue-500">{col.type}</span>
                                            </div>
                                            
                                            {linkedKey && (
                                               <div className="flex items-center gap-1">
                                                   <span className="text-[10px] text-purple-600 bg-purple-100 dark:bg-purple-900 px-1 rounded truncate max-w-[80px]" title={linkedKey.leftColumn}>
                                                       = {linkedKey.leftColumn}
                                                   </span>
                                                   <button 
                                                        className="text-gray-400 hover:text-red-500"
                                                        onClick={() => {
                                                            const keyIdx = joinConfig.keys.indexOf(linkedKey);
                                                            removeJoinKey(inputNode.id, keyIdx);
                                                        }}
                                                   >
                                                       ×
                                                   </button>
                                               </div> 
                                            )}
                                        </div>
                                    );
                                })}
                                {(!inputNode.data.schema || inputNode.data.schema.length === 0) && (
                                    <div className="text-xs text-gray-400 italic p-2">No schema available</div>
                                )}
                            </div>
                        </div>
                    );
                    })}
                    {inputNodes.length === 0 && (
                        <div className="text-center text-sm text-gray-500 mt-10">
                            No inputs connected.
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Outputs */}
            <div className="flex-1 flex flex-col bg-white dark:bg-vercel-dark-bg">
                <div className="p-2 bg-gray-50 dark:bg-gray-900 border-b font-medium text-xs uppercase tracking-wider flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span>Output Destination:</span>
                        {outputNodes.length > 0 ? (
                            <select 
                                value={activeOutput}
                                onChange={(e) => handleSwitchOutput(e.target.value)}
                                className="bg-white dark:bg-vercel-dark-bg border border-gray-200 dark:border-gray-700 rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-blue-500 font-bold max-w-[200px]"
                            >
                                {outputNodes.map(node => (
                                    <option key={node.id} value={node.id}>
                                        {node.data.label || node.id} ({node.data.type})
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-gray-400 italic font-normal normal-case">No output connections</span>
                        )}
                    </div>
                    
                    {activeOutput && (
                        <button 
                            onClick={() => {
                                setOutputSchema([...outputSchema, { name: `new_column_${outputSchema.length}`, type: 'string' }]);
                            }}
                            className="text-blue-500 hover:text-blue-600 text-xs"
                        >
                            + Add Column
                        </button>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="px-4 py-2 w-1/4">Column</th>
                                <th className="px-4 py-2 w-1/6">Type</th>
                                <th className="px-4 py-2 w-1/2">Expression / Mapping ({outputNodes.find(n => n.id === activeOutput)?.data.label || activeOutput})</th>
                                <th className="px-2 py-2 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-vercel-light-border dark:divide-vercel-dark-border">
                            {outputSchema.map((col, idx) => {
                                const mapping = mappings.find(m => m.targetColumn === col.name);
                                
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-2">
                                            <input 
                                                value={col.name}
                                                onChange={(e) => {
                                                    const oldName = col.name;
                                                    const newName = e.target.value;
                                                    
                                                    const newSchema = [...outputSchema];
                                                    newSchema[idx].name = newName;
                                                    setOutputSchema(newSchema);
                                                    
                                                    // Update mapping if it exists
                                                    setMappings(prev => prev.map(m => 
                                                        m.targetColumn === oldName ? { ...m, targetColumn: newName } : m
                                                    ));
                                                }}
                                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium"
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <select
                                                value={col.type}
                                                onChange={(e) => {
                                                    const newSchema = [...outputSchema];
                                                    newSchema[idx].type = e.target.value as any;
                                                    setOutputSchema(newSchema);
                                                }}
                                                className="bg-transparent border-none focus:ring-0 p-0 text-xs text-gray-500"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="integer">Integer</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="date">Date</option>
                                            </select>
                                        </td>
                                        <td 
                                            className="px-4 py-2"
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault();
                                                const sourceCol = e.dataTransfer.getData('sourceColumn');
                                                const sourceLabel = e.dataTransfer.getData('sourceLabel');
                                                if (sourceCol) {
                                                    const expression = `${sourceLabel}.${sourceCol}`;
                                                    const newMappings = [...mappings];
                                                    const existingIdx = newMappings.findIndex(m => m.targetColumn === col.name);
                                                    if (existingIdx >= 0) {
                                                        newMappings[existingIdx].expression = expression;
                                                    } else {
                                                        newMappings.push({ targetColumn: col.name, expression });
                                                    }
                                                    setMappings(newMappings);
                                                }
                                            }}
                                        >
                                            <div className="relative flex items-center">
                                                {/* {mapping?.expression && (
                                                    <span className="absolute left-2 text-purple-500 font-bold pointer-events-none">→</span>
                                                )} */}
                                                <input 
                                                    value={mapping?.expression || ''}
                                                    onChange={(e) => {
                                                        const newMappings = [...mappings];
                                                        const existingIdx = newMappings.findIndex(m => m.targetColumn === col.name);
                                                        if (existingIdx >= 0) {
                                                            newMappings[existingIdx].expression = e.target.value;
                                                        } else {
                                                            newMappings.push({ targetColumn: col.name, expression: e.target.value });
                                                        }
                                                        setMappings(newMappings);
                                                    }}
                                                    placeholder="Drag input column here..."
                                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs font-mono text-blue-600 focus:outline-none focus:border-blue-500"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-2">
                                            <button 
                                                onClick={() => {
                                                    setOutputSchema(outputSchema.filter((_, i) => i !== idx));
                                                }}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    
                    {outputSchema.length === 0 && (
                        <div className="p-8 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 m-4 rounded-lg">
                            {activeOutput ? (
                                <>
                                    No output columns defined for <b>{outputNodes.find(n => n.id === activeOutput)?.data.label || activeOutput}</b>.
                                    <br />
                                    <button 
                                        onClick={() => setOutputSchema([{ name: 'new_column', type: 'string' }])}
                                        className="text-blue-500 hover:underline mt-2"
                                    >
                                        Create Output Schema
                                    </button>
                                    <span className="mx-2 text-gray-300">or</span>
                                    <button 
                                        onClick={() => {
                                            if (inputNodes.length > 0 && inputNodes[0].data.schema) {
                                                const schema = [...(inputNodes[0].data.schema || [])];
                                                setOutputSchema(schema);
                                                const newMappings = schema.map((col: ColumnSchema) => ({
                                                    targetColumn: col.name,
                                                    expression: `row1.${col.name}`
                                                }));
                                                setMappings(newMappings);
                                            }
                                        }}
                                        className="text-blue-500 hover:underline"
                                    >
                                        Auto-Map from Input
                                    </button>
                                </>
                            ) : (
                                <span>Please select an output destination or connect a node.</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </Modal>
  );
};
