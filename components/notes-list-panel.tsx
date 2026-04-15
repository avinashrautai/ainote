"use client";

import { ChevronLeft, Search } from "lucide-react";
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
  onSearchChange: (value: string) => void;
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
  onSearchChange,
  onSelectNote,
  onCreateNote,
  onClose,
}: NotesListPanelProps) {
  const title = activeNotebook ? activeNotebook.name : "All notes";
  const subtitle = activeNotebook
    ? activeNotebook.description || "Notes in this notebook"
    : "Search and browse every note in your workspace";

  return (
    <section className="flex h-full w-[280px] max-w-[300px] flex-col px-3 py-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted/75">Notes</p>
          <h2 className="mt-2 text-[18px] font-medium tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-[14px] leading-6 text-muted/80">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-muted/80 transition hover:bg-white/60 hover:text-foreground"
          aria-label="Hide notes list"
          title="Hide notes list"
        >
          <ChevronLeft size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-[14px] text-muted ring-1 ring-border/45">
          <Search size={16} strokeWidth={1.9} className="shrink-0 text-muted/70" />
          <input
            className="w-full border-none bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted/70"
            placeholder="Search title and content"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search notes"
          />
        </label>
        <button
          type="button"
          onClick={onCreateNote}
          disabled={!hasNotebooks}
          className="rounded-full bg-accent px-4 py-2 text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          New
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
                  "block w-full rounded-2xl px-4 py-3 text-left transition",
                  note.id === selectedNoteId
                    ? "bg-white/85 ring-1 ring-accent/30"
                    : "hover:bg-white/60",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-medium tracking-tight text-foreground">
                      {note.title || "Untitled note"}
                    </h3>
                    <p className="mt-1 text-[13px] text-muted/75">{formatRelativeDate(note.updatedAt)}</p>
                  </div>
                  {note.id === selectedNoteId ? (
                    <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
                      Open
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-muted/80">
                  {note.excerpt || "Start writing to build out this note."}
                </p>
              </button>
            ))
          : null}
      </div>
    </section>
  );
}
