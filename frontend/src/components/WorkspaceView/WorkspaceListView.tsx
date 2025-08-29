import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FolderOpen,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";
// import { useThemeStore } from '../../store/themeStore'; // Removed unused
import { Button } from "../common/Button";
import { Navbar } from "../common/Navbar";
import { Modal } from "../common/Modal";
import { ResourceFormModal } from "../common/ResourceFormModal";
import { Loader } from "../common/Loader";
import { useToast } from "../../contexts/ToastContext";
import { usePageTitle } from "../../hooks/usePageTitle";
import { APP_CONSTANTS } from "../../constants/app";
import { useCrudState } from "../../hooks/useCrudState";
import { useViewMode } from "../../hooks/useViewMode";
import { formatDateOnly } from "../../utils/date";
import type { Workspace } from "../../types/workspace";
import { LayoutGrid, List } from "lucide-react";

export const WorkspaceListView: React.FC = () => {
  usePageTitle("Workspaces | Osmosis");
  const navigate = useNavigate();
  const {
    workspaces,
    loading,
    fetchWorkspaces,
    createWorkspace,
    deleteWorkspace,
    updateWorkspace,
    bulkDeleteWorkspaces,
    exportWorkspace,
  } = useWorkspaceStore();
  const { addToast } = useToast();

  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<Set<string>>(
    new Set(),
  );
  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Reusable CRUD State
  const crud = useCrudState<Workspace>();
  const { mode, toggleMode } = useViewMode("workspaces");

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedWorkspaceIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedWorkspaceIds(newSelected);
  };

  const selectAll = () => {
    if (selectedWorkspaceIds.size === filteredWorkspaces.length) {
      setSelectedWorkspaceIds(new Set());
    } else {
      setSelectedWorkspaceIds(new Set(filteredWorkspaces.map((w) => w.id)));
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleteOpen(false); // Close modal immediately
    try {
      await bulkDeleteWorkspaces(Array.from(selectedWorkspaceIds));
      addToast("success", `Deleted ${selectedWorkspaceIds.size} workspaces`);
      setSelectedWorkspaceIds(new Set());
    } catch (error: any) {
      addToast("error", "Failed to delete workspaces");
    }
  };

  const handleCreateWorkspace = async (name: string, description: string) => {
    setCreating(true);
    try {
      await createWorkspace(name, description);
      addToast(
        "success",
        APP_CONSTANTS.TOAST_MESSAGES.WORKSPACE.CREATE_SUCCESS,
      );
      crud.setCreateOpen(false);
    } catch (error: any) {
      console.error("Failed to create workspace:", error);
      addToast(
        "error",
        error.message || APP_CONSTANTS.TOAST_MESSAGES.WORKSPACE.CREATE_ERROR,
      );
    } finally {
      setCreating(false);
    }
  };

  const handleWorkspaceClick = (e: React.MouseEvent, workspaceId: string) => {
    if ((e.target as HTMLElement).closest(".workspace-menu-btn")) return;
    navigate(`/workspace/${workspaceId}`);
  };

  // Edit Logic
  const openEdit = (workspace: Workspace) => {
    crud.prepareEdit(workspace);
  };

  const submitEdit = async (name: string, description: string) => {
    if (!crud.actionItem) return;
    crud.setProcessing(true);
    try {
      await updateWorkspace(crud.actionItem.id, { name, description });
      addToast(
        "success",
        APP_CONSTANTS.TOAST_MESSAGES.WORKSPACE.UPDATE_SUCCESS,
      );
      crud.setEditOpen(false);
    } catch (error: any) {
      addToast(
        "error",
        error.message || APP_CONSTANTS.TOAST_MESSAGES.WORKSPACE.UPDATE_ERROR,
      );
    } finally {
      crud.setProcessing(false);
    }
  };

  // Delete Logic
  const submitDelete = async () => {
    if (!crud.actionItem) return;
    crud.setProcessing(true);
    try {
      await deleteWorkspace(crud.actionItem.id);
      addToast(
        "success",
        APP_CONSTANTS.TOAST_MESSAGES.WORKSPACE.DELETE_SUCCESS,
      );
      crud.setDeleteOpen(false);
    } catch (error: any) {
      addToast(
        "error",
        error.message || APP_CONSTANTS.TOAST_MESSAGES.WORKSPACE.DELETE_ERROR,
      );
    } finally {
      crud.setProcessing(false);
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      if (crud.menuOpenId) crud.closeMenu();
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [crud.menuOpenId, crud]);

  const handleExport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    crud.closeMenu();
    try {
      await exportWorkspace(id);
      addToast("success", "Export started");
    } catch (error: any) {
      addToast("error", "Failed to export workspace");
    }
  };

  const filteredWorkspaces = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ws.description &&
        ws.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-vercel-light-bg dark:bg-vercel-dark-bg transition-colors duration-300">
      {/* Header */}
      {/* Header */}
      <Navbar>
        <Button
          variant="primary"
          size="sm"
          onClick={() => crud.setCreateOpen(true)}
          icon={<Plus size={16} />}
        >
          New Workspace
        </Button>
      </Navbar>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-vercel-light-text dark:text-vercel-dark-text tracking-tight">
              Workspaces
            </h2>
            <p className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mt-2 text-lg">
              Manage your data pipelines and projects.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            {/* Bulk Selection */}
            {filteredWorkspaces.length > 0 && (
              <div className="flex items-center gap-2 mr-1 px-3 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <button
                  onClick={selectAll}
                  className={`flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${selectedWorkspaceIds.size > 0 ? "text-[var(--accent-blue)]" : "text-[var(--text-secondary)]"} hover:text-[var(--text-primary)] transition-colors`}
                >
                  {selectedWorkspaceIds.size > 0 &&
                  selectedWorkspaceIds.size === filteredWorkspaces.length ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                  <span>
                    {selectedWorkspaceIds.size > 0
                      ? `${selectedWorkspaceIds.size} Selected`
                      : "Select All"}
                  </span>
                </button>
                {selectedWorkspaceIds.size > 0 && (
                  <>
                    <div className="w-px h-4 bg-[var(--border-color)] mx-1"></div>
                    <button
                      onClick={() => setBulkDeleteOpen(true)}
                      className="p-1 hover:bg-red-500/10 rounded text-[var(--text-secondary)] hover:text-red-500"
                      title="Delete Selected"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary"
                size={16}
              />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 text-sm bg-white dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-md focus:outline-none focus:ring-1 focus:ring-vercel-accent-blue w-64 text-vercel-light-text dark:text-vercel-dark-text placeholder:text-gray-400"
              />
            </div>
            <div className="flex border border-[var(--border-color)] rounded-md overflow-hidden">
              <button
                onClick={() => mode !== "grid" && toggleMode()}
                className={`p-1.5 ${mode === "grid" ? "bg-[var(--bg-hover)] text-[var(--accent-blue)]" : "bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"} transition-colors`}
                title="Grid View"
              >
                <LayoutGrid size={18} />
              </button>
              <div className="w-px bg-[var(--border-color)]" />
              <button
                onClick={() => mode !== "list" && toggleMode()}
                className={`p-1.5 ${mode === "list" ? "bg-[var(--bg-hover)] text-[var(--accent-blue)]" : "bg-[var(--bg-surface)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"} transition-colors`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader size="lg" text="Loading workspaces..." />
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-vercel-dark-surface border border-vercel-light-border dark:border-vercel-dark-border rounded-xl shadow-vercel-sm">
            {searchQuery ? (
              <>
                <Search
                  size={48}
                  className="mx-auto text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-4 opacity-50"
                />
                <h3 className="text-xl font-semibold text-vercel-light-text dark:text-vercel-dark-text mb-2">
                  No workspaces found
                </h3>
                <p className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-8 max-w-md mx-auto">
                  No workspaces match your search for "{searchQuery}".
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FolderOpen
                    size={32}
                    className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary"
                  />
                </div>
                <h3 className="text-xl font-semibold text-vercel-light-text dark:text-vercel-dark-text mb-2">
                  No workspaces created
                </h3>
                <p className="text-vercel-light-text-secondary dark:text-vercel-dark-text-secondary mb-8 max-w-md mx-auto">
                  Get started by creating a new workspace to organize your ETL
                  jobs and data flows.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => crud.setCreateOpen(true)}
                  icon={<Plus size={20} />}
                >
                  Create Workspace
                </Button>
              </>
            )}
          </div>
        ) : mode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={(e) => handleWorkspaceClick(e, workspace.id)}
                className="relative p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-hover)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 cursor-pointer group flex flex-col h-full"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => toggleSelection(e, workspace.id)}
                      className={`p-1.5 rounded-md border transition-colors ${selectedWorkspaceIds.has(workspace.id) ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white" : "bg-[var(--bg-surface)] border-[var(--border-color)] text-transparent hover:border-[var(--text-secondary)]"}`}
                    >
                      <CheckSquare
                        size={16}
                        fill="currentColor"
                        className={
                          selectedWorkspaceIds.has(workspace.id)
                            ? "opacity-100"
                            : "opacity-0"
                        }
                      />
                    </button>
                    <FolderOpen
                      size={20}
                      className="text-[var(--accent-blue)]"
                    />
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
                      {workspace.name}
                    </h3>
                  </div>

                  {/* Menu Button - Always Visible */}
                  <button
                    onClick={(e) => crud.toggleMenu(e, workspace.id)}
                    className="workspace-menu-btn p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {/* Menu Dropdown - Same as before */}
                  {crud.menuOpenId === workspace.id && (
                    <div
                      className="absolute top-10 right-4 w-40 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md shadow-xl z-20 py-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(workspace);
                        }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <div className="h-px bg-[var(--border-color)] my-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          crud.prepareDelete(workspace);
                        }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-hover)] text-red-500"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Description - Fixed Height for alignment */}
                <div className="mb-4 pl-8 h-10">
                  {workspace.description ? (
                    <p className="text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {workspace.description}
                    </p>
                  ) : (
                    <p className="text-sm text-[var(--text-tertiary)] italic">
                      No description
                    </p>
                  )}
                </div>

                {/* Footer - Date */}
                <div
                  className={`mt-auto pt-3 border-t border-[var(--border-color)] flex items-center text-xs text-[var(--text-tertiary)] ${!workspace.description ? "pl-0" : "pl-0"}`}
                >
                  <Calendar size={13} strokeWidth={2} className="mr-2" />
                  {new Date(workspace.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
            {filteredWorkspaces.map((workspace, index) => (
              <div
                key={workspace.id}
                onClick={(e) => handleWorkspaceClick(e, workspace.id)}
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors group ${index !== filteredWorkspaces.length - 1 ? "border-b border-[var(--border-color)]" : ""}`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <button
                    onClick={(e) => toggleSelection(e, workspace.id)}
                    className={`p-1.5 rounded-md border transition-colors ${selectedWorkspaceIds.has(workspace.id) ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white" : "bg-[var(--bg-surface)] border-[var(--border-color)] text-transparent hover:border-[var(--text-secondary)]"}`}
                  >
                    <CheckSquare
                      size={16}
                      fill="currentColor"
                      className={
                        selectedWorkspaceIds.has(workspace.id)
                          ? "opacity-100"
                          : "opacity-0"
                      }
                    />
                  </button>
                  <FolderOpen
                    size={20}
                    className="text-[var(--accent-blue)] flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                        {workspace.name}
                      </h3>
                    </div>
                    {workspace.description && (
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {workspace.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                  {/* Date */}
                  <div className="text-xs text-[var(--text-tertiary)] whitespace-nowrap hidden sm:flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formatDateOnly(workspace.createdAt)}
                  </div>

                  <div className="flex items-center gap-2 relative">
                    {/* Menu Button */}
                    <button
                      onClick={(e) => crud.toggleMenu(e, workspace.id)}
                      className="workspace-menu-btn p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Menu Dropdown */}
                    {crud.menuOpenId === workspace.id && (
                      <div
                        className="absolute top-8 right-0 w-40 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-md shadow-xl z-20 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(workspace);
                          }}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <div className="h-px bg-[var(--border-color)] my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            crud.prepareDelete(workspace);
                          }}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-hover)] text-red-500"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                        <div className="h-px bg-[var(--border-color)] my-1" />
                        <button
                          onClick={(e) => handleExport(e, workspace.id)}
                          className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                          <Download size={14} /> Export
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ... (Create/Edit Modals) ... */}
      <ResourceFormModal
        isOpen={crud.isCreateOpen}
        onClose={() => crud.setCreateOpen(false)}
        onSubmit={handleCreateWorkspace}
        title="Create New Workspace"
        confirmLabel="Create Workspace"
        processing={creating}
      />

      <ResourceFormModal
        isOpen={crud.isEditOpen}
        onClose={() => crud.setEditOpen(false)}
        onSubmit={submitEdit}
        title="Edit Workspace"
        initialName={crud.actionItem?.name}
        initialDescription={crud.actionItem?.description}
        confirmLabel="Save Changes"
        processing={crud.processing}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={crud.isDeleteOpen}
        onClose={() => crud.setDeleteOpen(false)}
        title="Delete Workspace"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Warning: This action is permanent and cannot be undone.
            </p>
          </div>
          <p className="text-vercel-light-text dark:text-vercel-dark-text">
            Are you sure you want to delete{" "}
            <span className="font-bold">{crud.actionItem?.name}</span>? All
            associated jobs and data will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => crud.setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={submitDelete}
              loading={crud.processing}
            >
              Delete Workspace
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isBulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${selectedWorkspaceIds.size} Workspaces`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">
              Warning: This action is permanent and cannot be undone.
            </p>
          </div>
          <p className="text-vercel-light-text dark:text-vercel-dark-text">
            Are you sure you want to delete{" "}
            <strong>{selectedWorkspaceIds.size}</strong> selected workspaces?
            All associated data will be removed.
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleBulkDelete} loading={false}>
              Delete All
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
