"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Archive,
  BookCopy,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  PenSquare,
  Tags,
} from "lucide-react";
import type { NotebookSummary } from "@/lib/types";

type SidebarPanelProps = {
  notebooks: NotebookSummary[];
  activeNotebookId: string;
  activeNotebook: NotebookSummary | null;
  totalNoteCount: number;
  isCollapsed: boolean;
  isCreatingNotebook: boolean;
  isUpdatingNotebook: boolean;
  isDeletingNotebook: boolean;
  onToggleCollapsed: () => void;
  onSelectNotebook: (notebookId: string) => void;
  onCreateNotebook: (input: { name: string; description?: string; color?: string }) => Promise<void> | void;
  onUpdateNotebook: (
    notebookId: string,
    input: { name: string; description?: string; color?: string },
  ) => Promise<void> | void;
  onDeleteNotebook: (notebookId: string) => Promise<void> | void;
};

const DEFAULT_COLOR = "#b85c38";

function NavButton({
  title,
  label,
  meta,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  title: string;
  label: string;
  meta?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-disabled={disabled}
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition",
        active
          ? "app-surface text-[var(--text)]"
          : disabled
            ? "cursor-default text-[color:color-mix(in_srgb,var(--text-muted)_74%,transparent)]"
            : "text-[var(--text-muted)] hover:bg-[color:color-mix(in_srgb,var(--surface-2)_88%,transparent)] hover:text-[var(--text)]",
      ].join(" ")}
      disabled={disabled}
    >
      {children}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium">{label}</span>
        {meta ? <span className="block text-[12px] text-[var(--text-muted)]">{meta}</span> : null}
      </span>
    </button>
  );
}

export function SidebarPanel({
  notebooks,
  activeNotebook,
  activeNotebookId,
  totalNoteCount,
  isCollapsed,
  isCreatingNotebook,
  isUpdatingNotebook,
  isDeletingNotebook,
  onToggleCollapsed,
  onSelectNotebook,
  onCreateNotebook,
  onUpdateNotebook,
  onDeleteNotebook,
}: SidebarPanelProps) {
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingColor, setEditingColor] = useState(DEFAULT_COLOR);

  useEffect(() => {
    setEditingName(activeNotebook?.name ?? "");
    setEditingDescription(activeNotebook?.description ?? "");
    setEditingColor(activeNotebook?.color ?? DEFAULT_COLOR);
  }, [activeNotebook]);

  function handleCreateNotebookAction() {
    const name = window.prompt("Notebook name");

    if (!name?.trim()) {
      return;
    }

    void onCreateNotebook({
      name: name.trim(),
      color: DEFAULT_COLOR,
    });
  }

  if (isCollapsed) {
    return (
      <aside className="app-sidebar hidden w-[72px] flex-col items-center gap-4 rounded-[30px] px-3 py-4 md:flex">
        <button type="button" title="Expand sidebar" onClick={onToggleCollapsed} className="app-icon-button">
          <ChevronRight size={18} strokeWidth={1.8} />
        </button>
        <div className="h-px w-8 bg-[color:color-mix(in_srgb,var(--border)_55%,transparent)]" />
        <button
          type="button"
          title={`All notes (${totalNoteCount})`}
          onClick={() => onSelectNotebook("all")}
          className={[
            "inline-flex h-11 w-11 items-center justify-center rounded-full transition",
            activeNotebookId === "all"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-muted)] hover:bg-[color:color-mix(in_srgb,var(--surface-2)_88%,transparent)] hover:text-[var(--text)]",
          ].join(" ")}
        >
          <FileText size={18} strokeWidth={1.8} />
        </button>
        {notebooks.slice(0, 5).map((notebook) => (
          <button
            key={notebook.id}
            type="button"
            title={`${notebook.name} (${notebook.noteCount})`}
            onClick={() => onSelectNotebook(notebook.id)}
            className={[
              "inline-flex h-11 w-11 items-center justify-center rounded-full transition",
              activeNotebookId === notebook.id
                ? "app-surface"
                : "hover:bg-[color:color-mix(in_srgb,var(--surface-2)_88%,transparent)]",
            ].join(" ")}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: notebook.color ?? DEFAULT_COLOR }}
            />
          </button>
        ))}
      </aside>
    );
  }

  return (
      <aside className="app-sidebar fixed inset-y-3 left-3 z-30 flex w-[216px] flex-col rounded-[30px] px-4 py-4 md:static md:inset-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Library
          </p>
          <h2 className="font-display mt-2 text-[1.35rem] text-[var(--text)]">Workspace</h2>
        </div>
        <button type="button" title="Collapse sidebar" onClick={onToggleCollapsed} className="app-icon-button">
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="mt-6 space-y-1.5">
        <NavButton
          title={`All notes (${totalNoteCount})`}
          label="Notes"
          meta={`${totalNoteCount} in workspace`}
          active={activeNotebookId === "all"}
          onClick={() => onSelectNotebook("all")}
        >
          <FileText size={18} strokeWidth={1.8} />
        </NavButton>
        <NavButton
          title="Notebooks"
          label="Notebooks"
          meta={`${notebooks.length} collections`}
          active={activeNotebookId !== "all"}
        >
          <BookCopy size={18} strokeWidth={1.8} />
        </NavButton>
        <NavButton title="Tags" label="Tags" meta="Organize themes" disabled>
          <Tags size={18} strokeWidth={1.8} />
        </NavButton>
        <NavButton title="Archive" label="Archive" meta="Coming soon" disabled>
          <Archive size={18} strokeWidth={1.8} />
        </NavButton>
      </div>

      <div className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Notebooks
          </p>
          <span className="text-[12px] text-[var(--text-muted)]">{notebooks.length}</span>
        </div>
        <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
          {notebooks.map((notebook) => (
            <button
              key={notebook.id}
              type="button"
              onClick={() => onSelectNotebook(notebook.id)}
              className={[
                "flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left transition",
                notebook.id === activeNotebookId
                  ? "bg-[color:color-mix(in_srgb,var(--accent-soft)_88%,transparent)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:bg-[color:color-mix(in_srgb,var(--surface-2)_88%,transparent)] hover:text-[var(--text)]",
              ].join(" ")}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: notebook.color ?? DEFAULT_COLOR }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium">{notebook.name}</span>
                <span className="block text-[12px] text-[var(--text-muted)]">
                  {notebook.noteCount} {notebook.noteCount === 1 ? "note" : "notes"}
                </span>
              </span>
              <FolderOpen size={16} strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <button
          type="button"
          onClick={handleCreateNotebookAction}
          disabled={isCreatingNotebook}
          className="app-button app-button-soft w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PenSquare size={17} strokeWidth={1.8} />
          {isCreatingNotebook ? "Creating..." : "New notebook"}
        </button>
      </div>

      {activeNotebook ? (
        <form
          className="app-surface-soft mt-5 rounded-[26px] px-4 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onUpdateNotebook(activeNotebook.id, {
              name: editingName.trim(),
              description: editingDescription.trim() || undefined,
              color: editingColor,
            });
          }}
        >
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            <FolderOpen size={18} strokeWidth={1.8} />
            <span>Edit notebook</span>
          </div>
          <input
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
            placeholder="Notebook name"
            className="app-field mt-4 w-full rounded-[20px] border-none px-4 py-3 text-[14px] outline-none"
          />
          <textarea
            value={editingDescription}
            onChange={(event) => setEditingDescription(event.target.value)}
            placeholder="Notebook description"
            rows={3}
            className="app-field mt-3 w-full resize-none rounded-[20px] border-none px-4 py-3 text-[14px] leading-6 outline-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <input
              type="color"
              value={editingColor}
              onChange={(event) => setEditingColor(event.target.value)}
              className="h-10 w-10 cursor-pointer rounded-2xl border-none bg-transparent p-1"
              aria-label="Notebook color"
            />
            <button
              type="submit"
              disabled={isUpdatingNotebook || !editingName.trim()}
              className="app-button app-button-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingNotebook ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => void onDeleteNotebook(activeNotebook.id)}
              disabled={isDeletingNotebook}
              className="app-button text-[var(--text-muted)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingNotebook ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      ) : null}
    </aside>
  );
}
