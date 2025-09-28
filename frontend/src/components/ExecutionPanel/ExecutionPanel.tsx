import React, { useRef, useEffect } from "react";
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { useExecutionStore } from "../../store/executionStore";

export const ExecutionPanel: React.FC = () => {
  const { isOpen, toggleOpen, logs, clearLogs, isExecuting, setIsOpen } =
    useExecutionStore();

  const logsEndRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = React.useState(false);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  // Open panel automatically when execution starts
  useEffect(() => {
    if (isExecuting) {
      setIsOpen(true);
    }
  }, [isExecuting, setIsOpen]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (logs.length === 0) return;

    try {
      await navigator.clipboard.writeText(logs.join("\n"));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy logs:", err);
    }
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-vercel-dark-surface border-t border-vercel-light-border dark:border-vercel-dark-border transition-all duration-300 ease-in-out z-40 flex flex-col overflow-hidden ${
        isOpen ? "h-64" : "h-10"
      }`}
    >
      {/* Header / Toggle Bar */}
      <div
        className="h-10 flex-none flex items-center justify-between px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-vercel-dark-hover transition-colors"
        onClick={toggleOpen}
      >
        <div className="flex items-center gap-3">
          <Terminal
            size={16}
            className={`text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary ${isExecuting ? "animate-pulse text-vercel-accent-blue" : ""}`}
          />
          <span className="text-sm font-medium text-vercel-light-text dark:text-vercel-dark-text leading-relaxed">
            Execution Logs {isExecuting && "(Running...)"}
          </span>
          {logs.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-vercel-dark-bg text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
              {logs.length}
            </span>
          )}
        </div>

        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Download logs
              if (logs.length === 0) return;
              const blob = new Blob([logs.join("\n")], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `execution-logs-${new Date().toISOString()}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            disabled={logs.length === 0}
            title="Download Logs"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
          </button>
          <button
            onClick={handleCopy}
            disabled={logs.length === 0}
            title="Copy Logs"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCopied ? (
              <Check size={16} className="text-green-600" />
            ) : (
              <Copy
                size={16}
                className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary"
              />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearLogs();
            }}
            title="Clear Logs"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Trash2
              size={16}
              className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary"
            />
          </button>
          <div className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary">
            {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </div>
        </div>
      </div>

      {/* Logs Content */}
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-vercel-dark-bg p-4 font-mono text-sm">
        {logs.length === 0 ? (
          <div className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary italic">
            No logs to display...
          </div>
        ) : (
          <div className="space-y-1 min-w-max">
            {logs.map((log, index) => {
              const isSuccess = log.includes("Status: success");
              const isError =
                log.includes("Status: error") ||
                log.includes("Error:") ||
                log.includes("ERROR:");
              const isCompleted = log.includes("Execution completed in");
              const isWarning = log.includes("WARNING:");

              let textColors =
                "text-vercel-light-text dark:text-vercel-dark-text";
              let fontClass = "";

              if (isSuccess) {
                textColors = "text-green-600 dark:text-green-400";
                fontClass = "font-bold";
              } else if (isError) {
                textColors = "text-red-600 dark:text-red-400";
                fontClass = "font-bold";
              } else if (isCompleted) {
                textColors = "text-vercel-accent-blue";
                fontClass = "font-semibold";
              } else if (isWarning) {
                textColors = "text-yellow-500";
              }

              return (
                <div
                  key={index}
                  className={`flex gap-2 whitespace-nowrap ${textColors} ${fontClass}`}
                >
                  <span className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary opacity-50 select-none font-normal">
                    Osmosis &gt;
                  </span>
                  {log}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
