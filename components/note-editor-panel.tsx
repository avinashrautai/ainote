"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Download, Ellipsis, FileDown, FileUp, PenSquare, Plus, Save, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingBlock } from "@/components/loading-block";
import { formatAbsoluteDate } from "@/lib/format";
import type { NoteDetail, NotebookSummary, SaveState } from "@/lib/types";

type NoteEditorPanelProps = {
  note: NoteDetail | null;
  notebooks: NotebookSummary[];
  noteLoading: boolean;
  noteError: string | null;
  saveState: SaveState;
  saveError: string | null;
  importMessage: string | null;
  isDeleting: boolean;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onCreateNote: () => void;
  onImportNote: (file: File) => void;
  isImportingNote: boolean;
  onSaveNote: () => void;
  onDelete: () => void;
  onChange: (note: NoteDetail) => void;
};

function getSaveLabel(saveState: SaveState) {
  if (saveState === "saving") {
    return "Saving...";
  }

  if (saveState === "saved") {
    return "Saved";
  }

  if (saveState === "error") {
    return "Save failed";
  }

  return "Ready";
}

export function NoteEditorPanel({
  note,
  notebooks,
  noteLoading,
  noteError,
  saveState,
  saveError,
  importMessage,
  isDeleting,
  isFocusMode,
  onToggleFocusMode,
  onCreateNote,
  onImportNote,
  isImportingNote,
  onSaveNote,
  onDelete,
  onChange,
}: NoteEditorPanelProps) {
  const [isToolbarMenuOpen, setIsToolbarMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const toolbarMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!toolbarMenuRef.current?.contains(event.target as Node)) {
        setIsToolbarMenuOpen(false);
      }

      if (!exportMenuRef.current?.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function focusEditor() {
    if (!note) {
      return;
    }

    if (!note.title.trim()) {
      titleRef.current?.focus();
      return;
    }

    contentRef.current?.focus();
  }

  function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleExport(kind: "txt" | "md") {
    if (!note) {
      return;
    }

    const safeTitle = (note.title.trim() || "untitled-note")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (kind === "md") {
      downloadFile(
        `${safeTitle || "untitled-note"}.md`,
        `# ${note.title || "Untitled note"}\n\n${note.content}`,
        "text/markdown;charset=utf-8",
      );
      return;
    }

    downloadFile(
      `${safeTitle || "untitled-note"}.txt`,
      `${note.title || "Untitled note"}\n\n${note.content}`,
      "text/plain;charset=utf-8",
    );
  }

  function handleImportButtonClick() {
    importInputRef.current?.click();
  }

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    onImportNote(file);
    event.target.value = "";
  }

  function ToolbarButton({
    label,
    icon,
    onClick,
    subtle = false,
    primary = false,
    className = "",
  }: {
    label: string;
    icon: ReactNode;
    onClick: () => void;
    subtle?: boolean;
    primary?: boolean;
    className?: string;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={[
          "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[13px] font-medium transition",
          primary
            ? "bg-accent text-white hover:opacity-90"
            : subtle
              ? "text-muted/70 hover:bg-white/55 hover:text-foreground"
              : "text-foreground/80 hover:bg-white/55 hover:text-foreground",
          className,
        ].join(" ")}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  if (noteLoading) {
    return (
      <section className="flex min-w-0 flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-[700px]">
          <LoadingBlock lines={3} />
          <div className="mt-8">
            <LoadingBlock lines={8} />
          </div>
        </div>
      </section>
    );
  }

  if (!note) {
    return (
      <section className="flex min-w-0 flex-1 px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-[700px]">
          {noteError ? (
            <div className="rounded-3xl bg-[#fff0e8] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8a3c22]">
                Note error
              </p>
              <h3 className="mt-3 text-xl font-semibold text-[#5d2816]">
                This note could not be loaded
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#8a3c22]">{noteError}</p>
            </div>
          ) : (
            <EmptyState
              eyebrow="No note selected"
              title="Choose a note to start writing"
              description="Open a note from the list, or create a fresh one and the editor will take over the page."
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-1 px-6 py-8 md:px-10 md:py-10">
      <div className="mx-auto flex w-full max-w-[700px] flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted/75">
              {getSaveLabel(saveState)}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted/75">
              {note.notebookName}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 md:gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept=".txt,.md,text/plain,text/markdown"
            onChange={handleImportChange}
            className="hidden"
          />
          <ToolbarButton
            label="New"
            icon={<Plus size={15} strokeWidth={1.9} />}
            onClick={onCreateNote}
            className="md:inline-flex"
          />
          <ToolbarButton
            label={isImportingNote ? "Importing..." : "Import"}
            icon={<FileUp size={15} strokeWidth={1.9} />}
            onClick={handleImportButtonClick}
            className="md:inline-flex"
          />
          <ToolbarButton
            label={saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving..." : "Save"}
            icon={<Save size={15} strokeWidth={1.9} />}
            onClick={onSaveNote}
            primary
          />
          <ToolbarButton
            label="Edit"
            icon={<PenSquare size={15} strokeWidth={1.9} />}
            onClick={focusEditor}
            className="hidden sm:inline-flex"
          />
          <ToolbarButton
            label="Delete"
            icon={<Trash2 size={15} strokeWidth={1.9} />}
            onClick={onDelete}
            subtle
            className="hidden md:inline-flex"
          />

          <div className="relative hidden sm:block" ref={exportMenuRef}>
            <ToolbarButton
              label="Export"
              icon={<Download size={15} strokeWidth={1.9} />}
              onClick={() => {
                setIsExportMenuOpen((current) => !current);
                setIsToolbarMenuOpen(false);
              }}
            />

            {isExportMenuOpen ? (
              <div className="absolute left-0 top-12 z-10 min-w-[180px] rounded-2xl bg-white py-2 shadow-[0_18px_50px_rgba(36,28,22,0.12)] ring-1 ring-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleExport("txt");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-[#f8f2ea]"
                >
                  <FileDown size={15} strokeWidth={1.8} />
                  <span>Export as TXT</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleExport("md");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-[#f8f2ea]"
                >
                  <FileDown size={15} strokeWidth={1.8} />
                  <span>Export as Markdown</span>
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative ml-auto" ref={toolbarMenuRef}>
            <ToolbarButton
              label="More"
              icon={<Ellipsis size={15} strokeWidth={1.9} />}
              onClick={() => {
                setIsToolbarMenuOpen((current) => !current);
                setIsExportMenuOpen(false);
              }}
            />

            {isToolbarMenuOpen ? (
              <div className="absolute right-0 top-12 z-10 min-w-[190px] rounded-2xl bg-white py-2 shadow-[0_18px_50px_rgba(36,28,22,0.12)] ring-1 ring-border/60">
                <button
                  type="button"
                  onClick={() => {
                    setIsToolbarMenuOpen(false);
                    focusEditor();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-[#f8f2ea] sm:hidden"
                >
                  <PenSquare size={15} strokeWidth={1.8} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsToolbarMenuOpen(false);
                    handleImportButtonClick();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-[#f8f2ea] sm:hidden"
                >
                  <FileUp size={15} strokeWidth={1.8} />
                  <span>{isImportingNote ? "Importing..." : "Import"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsToolbarMenuOpen(false);
                    handleExport("txt");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-[#f8f2ea] sm:hidden"
                >
                  <FileDown size={15} strokeWidth={1.8} />
                  <span>Export as TXT</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsToolbarMenuOpen(false);
                    handleExport("md");
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-[#f8f2ea] sm:hidden"
                >
                  <FileDown size={15} strokeWidth={1.8} />
                  <span>Export as Markdown</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsToolbarMenuOpen(false);
                    onToggleFocusMode();
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-foreground transition hover:bg-[#f8f2ea]"
                >
                  <span>{isFocusMode ? "Exit focus mode" : "Enter focus mode"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsToolbarMenuOpen(false);
                    onDelete();
                  }}
                  disabled={isDeleting}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-muted/80 transition hover:bg-[#f8f2ea] md:hidden disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={15} strokeWidth={1.8} />
                  <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-14">
          <input
            ref={titleRef}
            value={note.title}
            onChange={(event) => onChange({ ...note, title: event.target.value })}
            placeholder="Untitled note"
            className="w-full border-none bg-transparent p-0 text-[2.85rem] font-medium tracking-tight text-foreground outline-none md:text-[4rem]"
          />

          <div className="mt-10">
            <select
              value={note.notebookId}
              onChange={(event) => onChange({ ...note, notebookId: event.target.value })}
              className="min-w-0 appearance-none bg-transparent px-0 py-0 text-[11px] font-medium uppercase tracking-[0.24em] text-muted/75 outline-none transition focus:text-foreground"
            >
              {notebooks.map((notebook) => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.name}
                </option>
              ))}
            </select>
          </div>

          {saveError ? (
            <p className="mt-6 rounded-2xl bg-[#fff0e8] px-4 py-3 text-sm text-[#8a3c22]">{saveError}</p>
          ) : null}

          {importMessage ? (
            <p className="mt-6 text-[12px] font-medium uppercase tracking-[0.18em] text-muted/75">
              {importMessage}
            </p>
          ) : null}

          <textarea
            ref={contentRef}
            value={note.content}
            onChange={(event) => onChange({ ...note, content: event.target.value })}
            placeholder="Start writing here..."
            className="mt-12 min-h-[60vh] w-full resize-none border-none bg-transparent text-[16px] leading-[1.78] text-foreground/70 outline-none"
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4 text-[12px] font-medium uppercase tracking-[0.18em] text-muted/75">
          <p>Created {formatAbsoluteDate(note.createdAt)}</p>
          <p>Last updated {formatAbsoluteDate(note.updatedAt)}</p>
        </div>
      </div>
    </section>
  );
}
