import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  AlertCircle,
} from "lucide-react";
import { executionService } from "../../services/executionService";
import { Button } from "../common/Button";
import { Loader } from "../common/Loader";
import { useToast } from "../../contexts/ToastContext";
import { formatDate } from "../../utils/date";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { usePageTitle } from "../../hooks/usePageTitle";

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

interface Execution {
  id: string;
  jobId: string;
  jobName: string;
  status: "success" | "error" | "failed" | "running";
  startTime: string;
  endTime?: string;
  logs: LogEntry[];
  message?: string;
}

export const ExecutionDetailView: React.FC = () => {
  const { workspaceId, executionId } = useParams<{
    workspaceId: string;
    executionId: string;
  }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);

  // Workspace Data for Title
  const { currentWorkspace, workspaces, fetchWorkspaces } = useWorkspaceStore();
  const workspaceName =
    currentWorkspace?.name ||
    workspaces.find((w) => w.id === workspaceId)?.name ||
    "...";

  usePageTitle(
    `${execution?.jobName || "Execution"} | ${workspaceName} | Osmosis`,
  );

  useEffect(() => {
    if (
      workspaceId &&
      !currentWorkspace &&
      !workspaces.find((w) => w.id === workspaceId)
    ) {
      fetchWorkspaces();
    }
  }, [workspaceId, currentWorkspace, workspaces]);

  useEffect(() => {
    if (executionId) {
      fetchExecution();
    }
  }, [executionId]);

  const fetchExecution = async () => {
    try {
      setLoading(true);
      const data = await executionService.getExecutionById(executionId!);
      setExecution(data);
    } catch (error) {
      console.error("Failed to fetch execution:", error);
      addToast("error", "Failed to load execution details");
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start: string, end?: string) => {
    if (!end) return "Running...";
    try {
      const startTime = new Date(start).getTime();
      const endTime = new Date(end).getTime();
      const diff = endTime - startTime;

      if (diff < 1000) return `${diff}ms`;
      if (diff < 60000) return `${(diff / 1000).toFixed(1)}s`;
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      return `${mins}m ${secs}s`;
    } catch (e) {
      return "-";
    }
  };

  const getStatusBadge = (status: string) => {
    const styles =
      status === "success"
        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 ring-1 ring-green-600/20"
        : status === "error" || status === "failed"
          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-1 ring-red-600/20"
          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-600/20";

    const icon =
      status === "success" ? (
        <CheckCircle size={14} />
      ) : status === "error" || status === "failed" ? (
        <XCircle size={14} />
      ) : (
        <Play size={14} />
      );

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${styles}`}
      >
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg flex items-center justify-center">
        <Loader size="lg" text="Loading execution details..." />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg flex flex-col items-center justify-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-vercel-light-text dark:text-vercel-dark-text">
          Execution not found
        </h2>
        <Button
          className="mt-4"
          onClick={() => navigate(`/workspace/${workspaceId}`)}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-vercel-dark-surface border-b border-vercel-light-border dark:border-vercel-dark-border px-6 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigate(`/workspace/${workspaceId}?tab=executions`)
              }
              icon={<ArrowLeft size={16} />}
            >
              Back to Executions
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-vercel-light-text dark:text-vercel-dark-text">
                  {execution.jobName}
                </h1>
                {getStatusBadge(execution.status)}
              </div>
              <p className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary font-mono text-xs">
                ID: {execution.id}
              </p>
            </div>

            <div className="flex items-center gap-8 text-sm">
              <div>
                <div className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-1 flex items-center gap-2">
                  <Calendar size={14} /> Started
                </div>
                <div className="font-mono font-medium text-vercel-light-text dark:text-vercel-dark-text">
                  {formatDate(execution.startTime)}
                </div>
              </div>
              <div>
                <div className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-1 flex items-center gap-2">
                  <Clock size={14} /> Duration
                </div>
                <div className="font-mono font-medium text-vercel-light-text dark:text-vercel-dark-text">
                  {calculateDuration(execution.startTime, execution.endTime)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Logs */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        <div className="bg-white dark:bg-black border border-vercel-light-border dark:border-vercel-dark-border rounded-lg overflow-hidden flex flex-col h-[calc(100vh-250px)] shadow-sm">
          <div className="px-4 py-3 border-b border-vercel-light-border dark:border-vercel-dark-border bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
            <span className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text-secondary">
              Execution Logs
            </span>
            <span className="text-xs text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
              {execution.logs.length} lines
            </span>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-sm custom-scrollbar bg-white dark:bg-black">
            <div className="min-w-max">
              {execution.logs.map((log, i) => (
                <div
                  key={i}
                  className="mb-1.5 flex gap-4 hover:bg-gray-50 dark:hover:bg-white/5 p-1 rounded transition-colors group"
                >
                  <span className="text-gray-400 dark:text-gray-500 shrink-0 w-44 select-none group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                    {new Date(log.timestamp).toLocaleTimeString() +
                      "." +
                      new Date(log.timestamp)
                        .getMilliseconds()
                        .toString()
                        .padStart(3, "0")}
                  </span>
                  <span
                    className={`whitespace-nowrap ${
                      log.level === "error"
                        ? "text-red-600 dark:text-red-400"
                        : log.level === "warning"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-gray-700 dark:text-blue-300"
                    }`}
                  >
                    <span
                      className={`inline-block w-16 font-bold mr-2 ${
                        log.level === "error"
                          ? "text-red-600 dark:text-red-500"
                          : log.level === "warning"
                            ? "text-yellow-600 dark:text-yellow-500"
                            : "text-blue-600 dark:text-blue-500"
                      }`}
                    >
                      [{log.level.toUpperCase()}]
                    </span>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            {(!execution.logs || execution.logs.length === 0) && (
              <div className="text-gray-400 dark:text-gray-500 italic text-center mt-12">
                No logs generated for this execution.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
