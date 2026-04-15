"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { BookOpenText, ChevronLeft, ChevronRight, FileText, FolderOpen, PenSquare } from "lucide-react";
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

function IconButton({
  title,
  active = false,
  onClick,
  children,
}: {
  title: string;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={[
        "flex h-10 w-10 items-center justify-center rounded-2xl transition",
        active ? "bg-white/80 text-foreground" : "text-muted/80 hover:bg-white/60 hover:text-foreground",
      ].join(" ")}
    >
      {children}
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
      <aside className="flex w-[60px] flex-col items-center gap-6 px-2 py-5">
        <IconButton title="Expand sidebar" onClick={onToggleCollapsed}>
          <ChevronRight size={18} strokeWidth={1.8} />
        </IconButton>
        <div className="h-px w-7 bg-border/70" />
        <IconButton
          title={`All notes (${totalNoteCount})`}
          active={activeNotebookId === "all"}
          onClick={() => onSelectNotebook("all")}
        >
          <FileText size={18} strokeWidth={1.8} />
        </IconButton>
        {notebooks.slice(0, 5).map((notebook) => (
          <IconButton
            key={notebook.id}
            title={`${notebook.name} (${notebook.noteCount})`}
            active={activeNotebookId === notebook.id}
            onClick={() => onSelectNotebook(notebook.id)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: notebook.color ?? DEFAULT_COLOR }}
            />
          </IconButton>
        ))}
      </aside>
    );
  }

  return (
    <aside className="flex w-[220px] flex-col px-3 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted/75">
          <BookOpenText size={18} strokeWidth={1.8} />
          <span>Workspace</span>
        </div>
        <IconButton title="Collapse sidebar" onClick={onToggleCollapsed}>
          <ChevronLeft size={18} strokeWidth={1.8} />
        </IconButton>
      </div>

      <div className="mt-7 space-y-2">
        <button
          type="button"
          onClick={() => onSelectNotebook("all")}
          className={[
            "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
            activeNotebookId === "all" ? "bg-white/75 text-foreground" : "text-muted/85 hover:bg-white/55 hover:text-foreground",
          ].join(" ")}
        >
          <FileText size={18} strokeWidth={1.8} />
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium">All notes</span>
          <span className="text-[12px] text-muted/75">{totalNoteCount}</span>
        </button>

        {notebooks.map((notebook) => (
          <button
            key={notebook.id}
            type="button"
            onClick={() => onSelectNotebook(notebook.id)}
            className={[
              "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
              notebook.id === activeNotebookId ? "bg-white/75 text-foreground" : "text-muted/85 hover:bg-white/55 hover:text-foreground",
            ].join(" ")}
          >
            <FolderOpen size={18} strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{notebook.name}</span>
            <span className="text-[12px] text-muted/75">{notebook.noteCount}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={handleCreateNotebookAction}
          disabled={isCreatingNotebook}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted/80 transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PenSquare size={17} strokeWidth={1.8} />
          {isCreatingNotebook ? "Creating..." : "New notebook"}
        </button>
      </div>

      {activeNotebook ? (
        <form
          className="mt-8"
          onSubmit={(event) => {
            event.preventDefault();
            void onUpdateNotebook(activeNotebook.id, {
              name: editingName.trim(),
              description: editingDescription.trim() || undefined,
              color: editingColor,
            });
          }}
        >
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted/70">
            <FolderOpen size={18} strokeWidth={1.8} />
            <span>Edit notebook</span>
          </div>
          <input
            value={editingName}
            onChange={(event) => setEditingName(event.target.value)}
            placeholder="Notebook name"
            className="mt-3 w-full rounded-2xl bg-white/70 px-4 py-3 text-[14px] text-foreground outline-none ring-1 ring-border/45 transition placeholder:text-muted/70 focus:ring-2 focus:ring-accent/15"
          />
          <textarea
            value={editingDescription}
            onChange={(event) => setEditingDescription(event.target.value)}
            placeholder="Notebook description"
            rows={3}
            className="mt-3 w-full resize-none rounded-2xl bg-white/70 px-4 py-3 text-[14px] leading-6 text-foreground outline-none ring-1 ring-border/45 transition placeholder:text-muted/70 focus:ring-2 focus:ring-accent/15"
          />
          <div className="mt-3 flex items-center gap-3">
            <input
              type="color"
              value={editingColor}
              onChange={(event) => setEditingColor(event.target.value)}
              className="h-10 w-10 cursor-pointer rounded-xl border border-border/70 bg-transparent p-1"
              aria-label="Notebook color"
            />
            <button
              type="submit"
              disabled={isUpdatingNotebook || !editingName.trim()}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingNotebook ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => void onDeleteNotebook(activeNotebook.id)}
              disabled={isDeletingNotebook}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted transition hover:text-[#b33f22] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingNotebook ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      ) : null}
    </aside>
  );
}
