"use client";

import { ChevronLeft, FileText, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { LoadingBlock } from "@/components/loading-block";
import { formatRelativeDate } from "@/lib/format";
import type { NoteListItem, NotebookSummary } from "@/lib/types";

type NotesListPanelProps = {
  notes: NoteListItem[];
  selectedNoteId: string | null;
  searchQuery: string;
  isLoading: boolean;
  hasNotebooks: boolean;
  activeNotebook: NotebookSummary | null;
  onSelectNote: (noteId: string) => void;
  onCreateNote: () => void;
  onClose: () => void;
};

export function NotesListPanel({
  notes,
  selectedNoteId,
  searchQuery,
  isLoading,
  hasNotebooks,
  activeNotebook,
  onSelectNote,
  onCreateNote,
  onClose,
}: NotesListPanelProps) {
  const title = activeNotebook ? activeNotebook.name : "All notes";
  const subtitle = activeNotebook
    ? activeNotebook.description || "Notes in this notebook"
    : "Search and browse every note in your workspace";

  return (
    <section className="app-surface flex h-full w-full max-w-[340px] flex-col rounded-[32px] px-4 py-5 md:w-[320px]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Notes
          </p>
          <h2 className="font-display mt-2 text-[1.45rem] text-[var(--text)]">{title}</h2>
          <p className="mt-2 text-[14px] leading-6 text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="app-icon-button"
          aria-label="Hide notes list"
          title="Hide notes list"
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="app-surface-soft mt-6 rounded-[24px] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--surface)_84%,transparent)]">
            <FileText size={17} strokeWidth={1.9} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-[var(--text)]">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </p>
            <p className="text-[12px] text-[var(--text-muted)]">
              {searchQuery.trim() ? `Filtered by "${searchQuery.trim()}"` : "Most recently updated first"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreateNote}
          disabled={!hasNotebooks}
          className="app-button app-button-accent mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={15} strokeWidth={2} />
          New note
        </button>
      </div>

      <div className="mt-6 flex-1 space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          <>
            <LoadingBlock lines={4} />
            <LoadingBlock lines={3} />
          </>
        ) : null}

        {!isLoading && !hasNotebooks ? (
          <EmptyState
            eyebrow="No notebooks"
            title="Create a notebook first"
            description="Once a notebook exists, your notes list will appear here."
          />
        ) : null}

        {!isLoading && hasNotebooks && notes.length === 0 ? (
          <EmptyState
            eyebrow={searchQuery.trim() ? "No results" : "No notes"}
            title={searchQuery.trim() ? "Nothing matched your search" : "No notes here yet"}
            description={
              searchQuery.trim()
                ? "Try a different phrase or clear the search to reveal more notes."
                : "Create a note and start writing in this notebook."
            }
            actionLabel={searchQuery.trim() ? undefined : "Create note"}
            onAction={searchQuery.trim() ? undefined : onCreateNote}
          />
        ) : null}

        {!isLoading
          ? notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note.id)}
                className={[
                  "block w-full rounded-[24px] px-4 py-4 text-left transition",
                  note.id === selectedNoteId
                    ? "bg-[color:color-mix(in_srgb,var(--accent-soft)_88%,transparent)]"
                    : "hover:bg-[color:color-mix(in_srgb,var(--surface-2)_88%,transparent)]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-medium tracking-tight text-[var(--text)]">
                      {note.title || "Untitled note"}
                    </h3>
                    <p className="mt-1 text-[13px] text-[var(--text-muted)]">
                      {formatRelativeDate(note.updatedAt)}
                    </p>
                  </div>
                  {note.id === selectedNoteId ? (
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                      Open
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-[var(--text-muted)]">
                  {note.excerpt || "Start writing to build out this note."}
                </p>
              </button>
            ))
          : null}
      </div>
    </section>
  );
}
