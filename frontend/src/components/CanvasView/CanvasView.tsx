import React, { useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  reconnectEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { useJobStore } from "../../store/jobStore";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useCanvasStore } from "../../store/canvasStore";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useToast } from "../../contexts/ToastContext";
import { propagateSchema } from "../../utils/schemaPropagation";
import { Toolbar } from "../Toolbar/Toolbar";
import { Sidebar } from "../Sidebar/Sidebar";
import { NodeConfigModal } from "./NodeConfigModal";
import { MapEditorModal } from "./MapEditor/MapEditorModal";
import { Loader } from "../common/Loader";
import { CustomNode } from "./CustomNode";
import { ExecutionPanel } from "../ExecutionPanel/ExecutionPanel";
import { useExecutionStore } from "../../store/executionStore";

const nodeTypes = {
  custom: CustomNode,
};

const CanvasViewInner: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  // const navigate = useNavigate(); // Unused
  const { currentJob, fetchJob, updateJob } = useJobStore();
  const { currentWorkspace, workspaces, fetchWorkspaces } = useWorkspaceStore();

  // Dynamic Title
  const jobName = currentJob?.name || "Loading Job...";
  const workspaceName =
    currentWorkspace?.name ||
    workspaces.find((w) => w.id === currentJob?.workspaceId)?.name ||
    "...";

  usePageTitle(`${jobName} - ${workspaceName} | Osmosis`);

  // Fetch workspace if not loaded (for title)
  useEffect(() => {
    if (
      currentJob?.workspaceId &&
      !currentWorkspace &&
      !workspaces.find((w) => w.id === currentJob.workspaceId)
    ) {
      fetchWorkspaces();
    }
  }, [currentJob?.workspaceId, currentWorkspace, workspaces]);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    loadCanvasState,
    getCanvasState,
    saveToHistory,
    setSaving,
    setLastSaved,
    onConnect: storeOnConnect,
    selectAll,
    undo,
    redo,
  } = useCanvasStore();

  const { setIsOpen } = useExecutionStore();

  const { project, fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

  const loadedJobIdRef = useRef<string | null>(null);

  // Handle Global Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+A or Ctrl+A for Select All
      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        selectAll();
      }

      // Undo: Cmd+Z or Ctrl+Z
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Redo: Cmd+Shift+Z or Ctrl+Shift+Z or Cmd+Y or Ctrl+Y
      if (
        ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) ||
        ((e.metaKey || e.ctrlKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectAll, undo, redo]);

  // Fetch job if needed
  useEffect(() => {
    if (jobId && (!currentJob || currentJob.id !== jobId)) {
      fetchJob(jobId);
    }
  }, [jobId, currentJob?.id, fetchJob]);

  // Load canvas state only when job changes
  useEffect(() => {
    if (
      currentJob &&
      currentJob.id === jobId &&
      loadedJobIdRef.current !== jobId
    ) {
      if (currentJob.canvasState) {
        loadCanvasState(currentJob.canvasState);
        // Set lastSaved to current time since we just loaded a saved state
        setLastSaved(new Date());

        // Force fit view after data load to ensure nodes are visible
        setTimeout(() => {
          window.requestAnimationFrame(() => {
            fitView({ padding: 0.2 });
          });
        }, 100);
      }
      loadedJobIdRef.current = jobId;
    }
  }, [currentJob, jobId, loadCanvasState, setLastSaved, fitView]);

  // Compute detailed edges with labels for Map nodes
  const detailedEdges = React.useMemo(() => {
    return edges
      .map((edge, globalIndex) => {
        // const targetNode = nodes.find(n => n.id === edge.target); // Unused for generic labeling
        // const sourceNode = nodes.find(n => n.id === edge.source); // Unused for generic labeling

        const isSelected = edge.selected;
        const edgeColor = isSelected
          ? "var(--accent-blue)"
          : "var(--text-tertiary)";

        // Style for the label
        const labelStyle = {
          fill: "var(--text-secondary)",
          fontWeight: 600,
          fontSize: 10,
          fontFamily: "monospace",
        };
        const labelBgStyle = {
          fill: "var(--bg-secondary)",
          fillOpacity: 0.9,
          rx: 4,
          ry: 4,
          stroke: "var(--border-color)",
          strokeWidth: 1,
        };
        const labelBgPadding = [4, 2] as [number, number];

        // Global unique label "row 1" to "row n"
        const label = `row ${globalIndex + 1}`;

        // Common properties
        const commonProps = {
          ...edge,
          label,
          labelShowBg: true,
          labelStyle,
          labelBgStyle,
          labelBgPadding,
          interactionWidth: 25,
          zIndex: isSelected ? 1000 : 0, // Ensure selected edge is always on top
          updatable: true, // Explicitly allow reconnection
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
          },
          style: {
            strokeWidth: 2,
            // stroke color is handled by CSS (selected class), but marker needs manual color
          },
          animated: true,
        };

        return commonProps;
      })
      .sort((a, b) => {
        // Sort selected edges to the end so they render on top
        if (a.selected && !b.selected) return 1;
        if (!a.selected && b.selected) return -1;
        return 0;
      });
  }, [edges, nodes]); // Removed edgesByTarget/Source dep as we use global index now

  const { addToast } = useToast();

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (jobId && currentJob) {
      setSaving(true);
      try {
        const canvasState = getCanvasState();
        await updateJob(jobId, { canvasState });
        setLastSaved(new Date());
      } catch (error) {
        console.error("Auto-save failed:", error);
      } finally {
        setSaving(false);
      }
    }
  }, [jobId, currentJob, getCanvasState, updateJob, setSaving, setLastSaved]);

  const onConnect = useCallback(
    (connection: any) => {
      // Check for duplicate connection
      const isDuplicate = edges.some(
        (edge) =>
          edge.source === connection.source &&
          edge.target === connection.target &&
          edge.sourceHandle === connection.sourceHandle &&
          edge.targetHandle === connection.targetHandle,
      );

      if (isDuplicate) {
        addToast("error", "Connection already exists");
        return;
      }

      storeOnConnect(connection);
      autoSave();
    },
    [edges, storeOnConnect, autoSave, addToast],
  );

  const onReconnect = useCallback(
    (oldEdge: any, newConnection: any) => {
      const newEdges = reconnectEdge(oldEdge, newConnection, edges);
      setEdges(newEdges);

      // Propagate schema from the source of the reconnected edge
      const sourceId = newConnection.source;
      const sourceNode = nodes.find((n) => n.id === sourceId);

      if (sourceNode && sourceNode.data.schema) {
        const updatedNodes = propagateSchema(
          nodes,
          newEdges,
          sourceId,
          sourceNode.data.schema,
        );
        setNodes(updatedNodes);
      }

      autoSave();
    },
    [edges, nodes, setEdges, setNodes, autoSave],
  );

  // Save on specific actions: drag stop, connect, drop, config save
  const onNodeDragStop = useCallback(() => {
    autoSave();
  }, [autoSave]);

  // Wrap onEdgesChange to detect deletions
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);

      // Check if any edge was removed
      const hasRemoval = changes.some((change) => change.type === "remove");
      if (hasRemoval) {
        // Save after a short delay to ensure state is updated
        setTimeout(autoSave, 100);
      }
    },
    [onEdgesChange, autoSave],
  );

  // Wrap onNodesChange to detect deletions
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);

      // Check if any node was removed
      const hasRemoval = changes.some((change) => change.type === "remove");
      if (hasRemoval) {
        // Save after a short delay to ensure state is updated
        setTimeout(autoSave, 100);
      }
    },
    [onNodesChange, autoSave],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      const componentDataStr = event.dataTransfer.getData("componentData");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = project({
        x: event.clientX,
        y: event.clientY,
      });

      const baseData = JSON.parse(componentDataStr);

      // Auto-naming logic: Count existing nodes of this type
      const existingCount = nodes.filter(
        (n) => n.data.type === baseData.type,
      ).length;
      const newLabel = `${baseData.label} ${existingCount + 1}`;

      const newData = {
        ...baseData,
        label: newLabel,
      };

      const newNode = {
        id: `node_${Date.now()}`,
        type: "custom",
        position,
        data: newData,
      };

      setNodes((nds) => [...nds, newNode]);
      saveToHistory();
      // Small delay to ensure state is updated before saving
      setTimeout(autoSave, 100);
    },
    [project, setNodes, saveToHistory, autoSave, nodes],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    setSelectedNode(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (!currentJob) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader size="lg" text="Loading job..." />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <Toolbar jobId={jobId!} jobName={currentJob.name} onSave={autoSave} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <div className="flex-1 relative flex flex-col">
          <ReactFlow
            nodes={nodes}
            edges={detailedEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={() => setIsOpen(false)}
            onNodeDoubleClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            defaultEdgeOptions={{
              interactionWidth: 25,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "var(--text-tertiary)",
              },
              style: { strokeWidth: 2 },
            }}
            fitView
            className="bg-[var(--bg-primary)]"
          >
            <Background color="var(--border-color)" gap={20} size={1} />
            <Controls
              position="top-right"
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)] button:text-[var(--text-secondary)] button:hover:bg-[var(--bg-hover)]"
              showInteractive={false}
            />
            <MiniMap
              className="bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              maskColor="var(--bg-primary-opacity)"
              nodeColor={() => "var(--accent-blue)"}
            />
          </ReactFlow>

          <ExecutionPanel />
        </div>

        {selectedNode &&
        nodes.find((n) => n.id === selectedNode)?.data.type === "map" ? (
          <MapEditorModal
            nodeId={selectedNode}
            isOpen={!!selectedNode}
            onClose={() => setSelectedNode(null)}
            onSave={autoSave}
          />
        ) : (
          selectedNode && (
            <NodeConfigModal
              nodeId={selectedNode}
              isOpen={!!selectedNode}
              onClose={() => setSelectedNode(null)}
              onSave={autoSave}
            />
          )
        )}
      </div>
    </div>
  );
};

export const CanvasView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <CanvasViewInner />
    </ReactFlowProvider>
  );
};
