import React, { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { FolderOpen, ArrowLeft, Download } from "lucide-react";
// import { ContextManagerModal } from './ContextManagerModal'; // Removed
import { ContextVariablesView } from "./ContextVariablesView";
import { ConnectionsView } from "./ConnectionsView";
import { SchedulerView } from "./SchedulerView";
import { useWorkspaceStore } from "../../store/workspaceStore";
// import { useThemeStore } from '../../store/themeStore'; // Removed unused
import { Button } from "../common/Button";
import { Navbar } from "../common/Navbar";
import { JobListView } from "../JobListView/JobListView";
import { ExecutionHistoryView } from "../Execution/ExecutionHistoryView";
import { Loader } from "../common/Loader";
import { useToast } from "../../contexts/ToastContext";

type Tab =
  | "jobs"
  | "executions"
  | "connections"
  | "filesystems"
  | "variables"
  | "scheduler";

export const WorkspaceDetailView: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    currentWorkspace,
    setCurrentWorkspace,
    workspaces,
    fetchWorkspaces,
    loading,
    exportWorkspace,
  } = useWorkspaceStore();
  const { addToast } = useToast();

  // Derived state from URL, default to 'jobs'
  const activeTab = (searchParams.get("tab") as Tab) || "jobs";

  const handleTabChange = (tab: Tab) => {
    setSearchParams({ tab });
  };

  // Dynamic Title
  const workspaceName =
    currentWorkspace?.name ||
    workspaces.find((w) => w.id === workspaceId)?.name ||
    "Loading...";

  useEffect(() => {
    let titlePrefix = "Jobs";
    switch (activeTab) {
      case "executions":
        titlePrefix = "Executions";
        break;
      case "connections":
        titlePrefix = "Databases";
        break;
      case "filesystems":
        titlePrefix = "File Systems";
        break;
      case "variables":
        titlePrefix = "Variables";
        break;
      case "scheduler":
        titlePrefix = "Scheduler";
        break;
    }
    document.title = `${titlePrefix} - ${workspaceName} | Osmosis`;
  }, [activeTab, workspaceName]);

  useEffect(() => {
    if (!workspaceId) return;

    // Ensure workspaces are loaded
    if (workspaces.length === 0) {
      fetchWorkspaces().then(() => {
        // After fetch, set current
        // This is a bit of a race condition if fetchWorkspaces overrides store state, but usually fine
        // Ideally useWorkspaceStore should have a 'getById' action
      });
    } else {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws) setCurrentWorkspace(ws);
    }
  }, [workspaceId, workspaces]);

  // Fallback if direct access and fetch is pending
  const workspace =
    currentWorkspace || workspaces.find((w) => w.id === workspaceId);

  useEffect(() => {
    if (!loading && workspaces.length > 0 && !workspace) {
      addToast("error", "Workspace does not exist");
    }
  }, [loading, workspaces, workspace, addToast]);

  if (loading && !workspace) {
    return (
      <div className="min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg flex items-center justify-center">
        <Loader size="lg" text="Loading workspace..." />
      </div>
    );
  }

  if (!workspace && !loading && workspaces.length > 0) {
    return (
      <div className="min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-red-500 mb-4">
          Workspace not found
        </h2>
        <Button variant="primary" onClick={() => navigate("/workspaces")}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg transition-colors duration-300">
      {/* Header */}
      {/* Header - Unified background */}
      {/* Header */}
      {/* Header */}
      <Navbar
        fullWidth={true}
        brand={
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/workspaces")}
              icon={<ArrowLeft size={16} />}
            ></Button>
            <div className="flex items-center gap-3 border-l border-vercel-light-border dark:border-vercel-dark-border pl-4 h-6">
              <FolderOpen size={20} className="text-vercel-accent-blue" />
              <h1 className="text-lg font-semibold text-vercel-light-text dark:text-vercel-dark-text tracking-tight truncate max-w-[200px] xl:max-w-none">
                {workspace?.name || "Loading..."}
              </h1>
            </div>
          </div>
        }
        centerContent={
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleTabChange("jobs")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "jobs"
                  ? "bg-vercel-light-surface dark:bg-vercel-dark-surface text-vercel-light-text dark:text-vercel-dark-text shadow-sm ring-1 ring-vercel-light-border dark:ring-vercel-dark-border"
                  : "text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary hover:text-vercel-light-text dark:hover:text-vercel-dark-text hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => handleTabChange("variables")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "variables"
                  ? "bg-vercel-light-surface dark:bg-vercel-dark-surface text-vercel-light-text dark:text-vercel-dark-text shadow-sm ring-1 ring-vercel-light-border dark:ring-vercel-dark-border"
                  : "text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary hover:text-vercel-light-text dark:hover:text-vercel-dark-text hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Variables
            </button>
            <button
              onClick={() => handleTabChange("connections")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "connections"
                  ? "bg-vercel-light-surface dark:bg-vercel-dark-surface text-vercel-light-text dark:text-vercel-dark-text shadow-sm ring-1 ring-vercel-light-border dark:ring-vercel-dark-border"
                  : "text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary hover:text-vercel-light-text dark:hover:text-vercel-dark-text hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Databases
            </button>
            <button
              onClick={() => handleTabChange("filesystems")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "filesystems"
                  ? "bg-vercel-light-surface dark:bg-vercel-dark-surface text-vercel-light-text dark:text-vercel-dark-text shadow-sm ring-1 ring-vercel-light-border dark:ring-vercel-dark-border"
                  : "text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary hover:text-vercel-light-text dark:hover:text-vercel-dark-text hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              File Systems
            </button>
            <button
              onClick={() => handleTabChange("scheduler")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "scheduler"
                  ? "bg-vercel-light-surface dark:bg-vercel-dark-surface text-vercel-light-text dark:text-vercel-dark-text shadow-sm ring-1 ring-vercel-light-border dark:ring-vercel-dark-border"
                  : "text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary hover:text-vercel-light-text dark:hover:text-vercel-dark-text hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Scheduler
            </button>
            <button
              onClick={() => handleTabChange("executions")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "executions"
                  ? "bg-vercel-light-surface dark:bg-vercel-dark-surface text-vercel-light-text dark:text-vercel-dark-text shadow-sm ring-1 ring-vercel-light-border dark:ring-vercel-dark-border"
                  : "text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary hover:text-vercel-light-text dark:hover:text-vercel-dark-text hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              Executions
            </button>
          </div>
        }
      >
        <button
          onClick={async () => {
            if (!workspace) return;
            try {
              await exportWorkspace(workspace.id);
              addToast("success", "Workspace export started");
            } catch (error: any) {
              addToast("error", "Failed to export workspace");
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all bg-vercel-light-surface dark:bg-vercel-dark-surface text-vercel-light-text dark:text-vercel-dark-text shadow-sm ring-1 ring-vercel-light-border dark:ring-vercel-dark-border hover:opacity-80"
          title="Export Workspace"
        >
          <Download size={16} />
          Export Workspace
        </button>
      </Navbar>

      {/* Tab Content */}
      <main className="w-full px-6 py-8">
        {activeTab === "jobs" && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <JobListView workspaceId={workspaceId!} hideHeader={true} />
          </div>
        )}

        {activeTab === "variables" && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ContextVariablesView workspaceId={workspaceId!} />
          </div>
        )}

        {activeTab === "executions" && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ExecutionHistoryView workspaceId={workspaceId!} />
          </div>
        )}

        {activeTab === "connections" && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ConnectionsView workspaceId={workspaceId!} type="database" />
          </div>
        )}

        {activeTab === "filesystems" && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ConnectionsView workspaceId={workspaceId!} type="filesystem" />
          </div>
        )}

        {activeTab === "scheduler" && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SchedulerView workspaceId={workspaceId!} />
          </div>
        )}
      </main>
    </div>
  );
};
