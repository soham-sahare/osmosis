import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, MarkerType } from 'reactflow';
import type { Node, Edge, NodeChange, EdgeChange } from 'reactflow';
import type { ComponentData, CanvasState } from '../types/job';
import { propagateSchema } from '../utils/schemaPropagation';

interface CanvasHistory {
  nodes: Node<ComponentData>[];
  edges: Edge[];
}

interface CanvasStore {
  nodes: Node<ComponentData>[];
  edges: Edge[];
  history: CanvasHistory[];
  historyIndex: number;
  isSaving: boolean;
  lastSaved: Date | null;
  
  // Actions
  setNodes: (nodes: Node<ComponentData>[] | ((nodes: Node<ComponentData>[]) => Node<ComponentData>[])) => void;
  setEdges: (edges: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  addNode: (node: Node<ComponentData>) => void;
  updateNodeData: (nodeId: string, data: Partial<ComponentData>) => void;
  deleteNode: (nodeId: string) => void;
  loadCanvasState: (state: CanvasState) => void;
  getCanvasState: () => CanvasState;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  setSaving: (isSaving: boolean) => void;
  setLastSaved: (date: Date) => void;
  reset: () => void;
  onConnect: (connection: any) => void;
  selectAll: () => void;
}

const MAX_HISTORY = 50;

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  edges: [],
  history: [],
  historyIndex: -1,
  isSaving: false,
  lastSaved: null,

  setNodes: (nodes) => 
    set((state) => ({
      nodes: typeof nodes === 'function' ? (nodes as any)(state.nodes) : nodes,
    })),
  
  setEdges: (edges) => 
    set((state) => ({
      edges: typeof edges === 'function' ? (edges as any)(state.edges) : edges,
    })),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
    get().saveToHistory();
  },

  updateNodeData: (nodeId, data) => {
    set((state) => {
      let updatedNodes = state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      );
      
      // If schema was updated, propagate it to downstream nodes
      if (data.schema) {
        updatedNodes = propagateSchema(updatedNodes, state.edges, nodeId, data.schema);
      }
      
      return { nodes: updatedNodes };
    });
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    }));
    get().saveToHistory();
  },

  loadCanvasState: (state) => {
    set({
      nodes: state.nodes || [],
      edges: state.edges || [],
      history: [],
      historyIndex: -1,
    });
  },

  getCanvasState: () => {
    const { nodes, edges } = get();
    return {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 }, // Default viewport
    };
  },

  saveToHistory: () => {
    const { nodes, edges, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: [...nodes], edges: [...edges] });
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      set({
        nodes: [...prevState.nodes],
        edges: [...prevState.edges],
        historyIndex: historyIndex - 1,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        nodes: [...nextState.nodes],
        edges: [...nextState.edges],
        historyIndex: historyIndex + 1,
      });
    }
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  setSaving: (isSaving) => set({ isSaving }),

  setLastSaved: (date) => set({ lastSaved: date }),

  reset: () => set({
    nodes: [],
    edges: [],
    history: [],
    historyIndex: -1,
    isSaving: false,
    lastSaved: null,
  }),

  onConnect: (connection) => {
    set((state) => {
      const newEdge = { 
        ...connection, 
        id: `e${connection.source}-${connection.target}`, 
        markerEnd: { type: MarkerType.ArrowClosed } 
      };
      
      const newEdges = [...state.edges, newEdge];
      let updatedNodes = [...state.nodes];
      
      // Propagate schema from source to target if source has a schema
      const sourceNode = state.nodes.find(n => n.id === connection.source);
      if (sourceNode?.data.schema) {
        updatedNodes = propagateSchema(
          updatedNodes, 
          newEdges, 
          connection.source, 
          sourceNode.data.schema
        );
      }
      
      return { 
        edges: newEdges,
        nodes: updatedNodes
      };
    });
    get().saveToHistory();
  },

  selectAll: () => {
    set((state) => ({
      nodes: state.nodes.map((n) => ({ ...n, selected: true })),
      edges: state.edges.map((e) => ({ ...e, selected: true })),
    }));
  },
}));
