"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Download, FileUp, MoreHorizontal, PenSquare, Save, Trash2 } from "lucide-react";
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
  onCreateNote: () => void;
  onSaveNote: () => void;
  onDeleteNote: () => void;
  onImportTrigger: () => void;
  onExportNote: (kind: "txt" | "md") => void;
  onChange: (note: NoteDetail) => void;
  focusRequest: number;
  isImportingNote: boolean;
  isDeletingNote: boolean;
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
  onCreateNote,
  onSaveNote,
  onDeleteNote,
  onImportTrigger,
  onExportNote,
  onChange,
  focusRequest,
  isImportingNote,
  isDeletingNote,
}: NoteEditorPanelProps) {
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!actionsMenuRef.current?.contains(event.target as Node)) {
        setIsActionsMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!note) {
      return;
    }

    if (!note.title.trim()) {
      titleRef.current?.focus();
      return;
    }

    contentRef.current?.focus();
  }, [focusRequest, note]);

  if (noteLoading) {
    return (
      <section className="flex min-w-0 flex-1 px-6 py-6 md:px-10 md:py-7">
        <div className="mx-auto w-full max-w-[980px]">
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
      <section className="flex min-w-0 flex-1 px-6 py-6 md:px-10 md:py-7">
        <div className="mx-auto w-full max-w-[980px]">
          {noteError ? (
            <div className="app-surface rounded-[30px] p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Note error
              </p>
              <h3 className="font-display mt-3 text-[2rem] text-[var(--text)]">
                This note could not be loaded
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">{noteError}</p>
            </div>
          ) : (
            <EmptyState
              eyebrow="No note selected"
              title="Choose a note to start writing"
              description="Open a note from the list, or create a fresh one and the editor will take over the page."
              actionLabel="Create note"
              onAction={onCreateNote}
            />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-w-0 flex-1 px-6 py-6 md:px-10 md:py-7">
      <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              {getSaveLabel(saveState)}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              {note.notebookName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSaveNote}
              className="app-button app-button-accent rounded-[12px] px-3 py-1.5 text-[12px]"
            >
              {saveState === "saved" ? <Check size={14} strokeWidth={2} /> : <Save size={14} strokeWidth={1.9} />}
              {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving..." : "Save"}
            </button>
            <div className="relative" ref={actionsMenuRef}>
              <button
                type="button"
                onClick={() => setIsActionsMenuOpen((current) => !current)}
                className="app-button rounded-[12px] px-3 py-1.5 text-[12px]"
              >
                <MoreHorizontal size={15} strokeWidth={1.9} />
                Actions
              </button>
              {isActionsMenuOpen ? (
                <div className="app-menu absolute right-0 top-12 z-10 min-w-[220px] rounded-[22px] p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      onImportTrigger();
                    }}
                    className="app-menu-item"
                  >
                    <FileUp size={15} strokeWidth={1.9} />
                    <span>{isImportingNote ? "Importing..." : "Import"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      if (!note.title.trim()) {
                        titleRef.current?.focus();
                        return;
                      }
                      contentRef.current?.focus();
                    }}
                    className="app-menu-item"
                  >
                    <PenSquare size={15} strokeWidth={1.9} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      onExportNote("txt");
                    }}
                    className="app-menu-item"
                  >
                    <Download size={15} strokeWidth={1.9} />
                    <span>Export TXT</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      onExportNote("md");
                    }}
                    className="app-menu-item"
                  >
                    <Download size={15} strokeWidth={1.9} />
                    <span>Export Markdown</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsActionsMenuOpen(false);
                      onDeleteNote();
                    }}
                    className="app-menu-item text-[var(--accent)]"
                    disabled={isDeletingNote}
                  >
                    <Trash2 size={15} strokeWidth={1.9} />
                    <span>{isDeletingNote ? "Deleting..." : "Delete"}</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-5 px-2 md:px-8">
          <input
            ref={titleRef}
            value={note.title}
            onChange={(event) => onChange({ ...note, title: event.target.value })}
            placeholder="Untitled note"
            className="font-display w-full border-none bg-transparent p-0 text-[2.35rem] font-extrabold leading-[1.01] tracking-[-0.055em] text-[#111111] outline-none focus-visible:outline-none md:text-[42px]"
          />

          <div className="mt-4">
            <select
              value={note.notebookId}
              onChange={(event) => onChange({ ...note, notebookId: event.target.value })}
              className="rounded-[12px] bg-[color:color-mix(in_srgb,var(--surface-2)_52%,transparent)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)] outline-none transition focus:text-[#111111] focus-visible:outline-none"
            >
              {notebooks.map((notebook) => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.name}
                </option>
              ))}
            </select>
          </div>

          {saveError ? (
            <p className="mt-6 rounded-[20px] bg-[color:color-mix(in_srgb,var(--accent-soft)_88%,transparent)] px-4 py-3 text-sm text-[var(--accent)]">
              {saveError}
            </p>
          ) : null}

          {importMessage ? (
            <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {importMessage}
            </p>
          ) : null}

          <textarea
            ref={contentRef}
            value={note.content}
            onChange={(event) => onChange({ ...note, content: event.target.value })}
            placeholder="Start writing here..."
            className="mt-5 min-h-[62vh] w-full resize-none border-none bg-[color:color-mix(in_srgb,var(--panel)_38%,transparent)] px-1 py-1 text-[16px] leading-[1.74] text-[#111111] outline-none focus-visible:outline-none md:text-[17px]"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <p>Created {formatAbsoluteDate(note.createdAt)}</p>
          <p>Last updated {formatAbsoluteDate(note.updatedAt)}</p>
        </div>
      </div>
    </section>
  );
}
