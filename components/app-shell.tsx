"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Ellipsis, Plus } from "lucide-react";
import { NoteEditorPanel } from "@/components/note-editor-panel";
import { NotesListPanel } from "@/components/notes-list-panel";
import { SidebarPanel } from "@/components/sidebar-panel";
import { parseImportedNoteFile } from "@/lib/imported-note";
import type {
  BootstrapResponse,
  NoteDetail,
  NoteListItem,
  NotebookSummary,
  SaveState,
} from "@/lib/types";

const SEARCH_DEBOUNCE_MS = 250;
const AUTOSAVE_DEBOUNCE_MS = 700;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorPayload = (await safeParseJson<{ error?: string }>(response)) ?? {};
    throw new Error(errorPayload.error ?? "Request failed.");
  }

  const data = await safeParseJson<T>(response);

  if (data === null) {
    throw new Error("The server returned an empty response.");
  }

  return data;
}

async function safeParseJson<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get("content-type") ?? "";
  const contentLength = response.headers.get("content-length");

  if (response.status === 204 || contentLength === "0") {
    return null;
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.error("[frontend:parse-error]", {
      status: response.status,
      body: text,
      error,
    });
    throw new Error("The server returned invalid JSON.");
  }
}

function PanelToggle({
  label,
  title,
  active,
  onClick,
  children,
}: {
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      onClick={onClick}
      className={[
        "flex h-9 w-9 items-center justify-center rounded-2xl transition",
        active ? "bg-accent text-white" : "bg-white/70 text-muted/80 hover:bg-white/90 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function AppShell() {
  const [notebooks, setNotebooks] = useState<NotebookSummary[]>([]);
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [activeNotebookId, setActiveNotebookId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<NoteDetail | null>(null);
  const [appLoading, setAppLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [isImportingNote, setIsImportingNote] = useState(false);
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [isUpdatingNotebook, setIsUpdatingNotebook] = useState(false);
  const [isDeletingNotebook, setIsDeletingNotebook] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const hasInitializedFiltersRef = useRef(false);
  const selectedNoteIdRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const hasHydratedDraftRef = useRef(false);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const draftRef = useRef<NoteDetail | null>(null);
  const activeNotebookIdRef = useRef(activeNotebookId);
  const searchQueryRef = useRef(searchQuery);

  const activeNotebook = useMemo(
    () => notebooks.find((notebook) => notebook.id === activeNotebookId) ?? null,
    [activeNotebookId, notebooks],
  );

  const workspaceNoteCount = useMemo(
    () => notebooks.reduce((total, notebook) => total + notebook.noteCount, 0),
    [notebooks],
  );

  useEffect(() => {
    selectedNoteIdRef.current = selectedNoteId;
  }, [selectedNoteId]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    activeNotebookIdRef.current = activeNotebookId;
  }, [activeNotebookId]);

  useEffect(() => {
    searchQueryRef.current = searchQuery;
  }, [searchQuery]);

  useEffect(() => {
    if (!importMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setImportMessage(null);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [importMessage]);

  const loadBootstrap = useCallback(
    async (nextNotebookId: string, nextQuery: string, preserveSelection = true) => {
      const params = new URLSearchParams();

      if (nextNotebookId !== "all") {
        params.set("notebookId", nextNotebookId);
      }

      if (nextQuery.trim()) {
        params.set("q", nextQuery.trim());
      }

      setNotesLoading(true);
      setAppError(null);

      try {
        const response = await fetch(`/api/bootstrap?${params.toString()}`, {
          cache: "no-store",
        });
        const data = await parseResponse<BootstrapResponse>(response);

        setNotebooks(data.notebooks);
        setNotes(data.notes);

        const nextSelectedId =
          preserveSelection &&
          selectedNoteIdRef.current &&
          data.notes.some((note) => note.id === selectedNoteIdRef.current)
            ? selectedNoteIdRef.current
            : data.notes[0]?.id ?? null;

        setSelectedNoteId(nextSelectedId);
        if (!nextSelectedId) {
          setDraft(null);
          setNoteError(null);
          setSaveError(null);
          setSaveState("idle");
        }
      } catch (error) {
        setAppError(getErrorMessage(error));
      } finally {
        setNotesLoading(false);
        setAppLoading(false);
      }
    },
    [],
  );

  const loadNote = useCallback(async (noteId: string | null) => {
    if (!noteId) {
      setDraft(null);
      setNoteError(null);
      setSaveError(null);
      lastSavedSnapshotRef.current = null;
      hasHydratedDraftRef.current = false;
      return;
    }

    setNoteLoading(true);
    setNoteError(null);
    setSaveError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        cache: "no-store",
      });
      const data = await parseResponse<NoteDetail>(response);

      setDraft(data);
      lastSavedSnapshotRef.current = JSON.stringify(data);
      hasHydratedDraftRef.current = true;
      setSaveState("idle");
    } catch (error) {
      setNoteError(getErrorMessage(error));
      setDraft(null);
      hasHydratedDraftRef.current = false;
    } finally {
      setNoteLoading(false);
    }
  }, []);

  const persistNote = useCallback(
    async (noteToSave: NoteDetail) => {
      const noteId = selectedNoteIdRef.current;

      if (!noteId) {
        return;
      }

      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: noteToSave.title,
          content: noteToSave.content,
          notebookId: noteToSave.notebookId,
        }),
      });
      const data = await parseResponse<NoteDetail>(response);

      setDraft(data);
      lastSavedSnapshotRef.current = JSON.stringify(data);
      setSaveState("saved");
      await loadBootstrap(activeNotebookIdRef.current, searchQueryRef.current, true);
    },
    [loadBootstrap],
  );

  const handleSaveNow = useCallback(async () => {
    const noteToSave = draftRef.current;

    if (!noteToSave || !selectedNoteIdRef.current) {
      return;
    }

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }

    const nextSnapshot = JSON.stringify(noteToSave);

    if (lastSavedSnapshotRef.current === nextSnapshot) {
      setSaveState("saved");
      return;
    }

    setSaveState("saving");
    setSaveError(null);

    try {
      await persistNote(noteToSave);
    } catch (error) {
      setSaveState("error");
      setSaveError(getErrorMessage(error));
    }
  }, [persistNote]);

  useEffect(() => {
    void loadBootstrap("all", "", false);
  }, [loadBootstrap]);

  useEffect(() => {
    if (!hasInitializedFiltersRef.current) {
      hasInitializedFiltersRef.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadBootstrap(activeNotebookId, searchQuery, true);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [activeNotebookId, loadBootstrap, searchQuery]);

  useEffect(() => {
    void loadNote(selectedNoteId);
  }, [loadNote, selectedNoteId]);

  useEffect(() => {
    if (!draft || !selectedNoteId || !hasHydratedDraftRef.current) {
      return;
    }

    const nextSnapshot = JSON.stringify(draft);

    if (lastSavedSnapshotRef.current === nextSnapshot) {
      return;
    }

    setSaveState("saving");
    setSaveError(null);

    autosaveTimeoutRef.current = window.setTimeout(async () => {
      try {
        await persistNote(draft);
      } catch (error) {
        setSaveState("error");
        setSaveError(getErrorMessage(error));
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
        autosaveTimeoutRef.current = null;
      }
    };
  }, [draft, persistNote, selectedNoteId]);

  const handleCreateNotebook = useCallback(
    async (input: { name: string; description?: string; color?: string }) => {
      setIsCreatingNotebook(true);
      setAppError(null);

      try {
        const response = await fetch("/api/notebooks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        const created = await parseResponse<NotebookSummary>(response);
        const nextNotebooks = [...notebooks, created].sort((a, b) => a.name.localeCompare(b.name));

        setNotebooks(nextNotebooks);
        setActiveNotebookId(created.id);
        setIsSidebarCollapsed(false);
      } catch (error) {
        setAppError(getErrorMessage(error));
      } finally {
        setIsCreatingNotebook(false);
      }
    },
    [notebooks],
  );

  const handleUpdateNotebook = useCallback(
    async (notebookId: string, input: { name: string; description?: string; color?: string }) => {
      setIsUpdatingNotebook(true);
      setAppError(null);

      try {
        const response = await fetch(`/api/notebooks/${notebookId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        const updated = await parseResponse<NotebookSummary>(response);

        setNotebooks((current) =>
          current.map((notebook) => (notebook.id === updated.id ? updated : notebook)),
        );
      } catch (error) {
        setAppError(getErrorMessage(error));
      } finally {
        setIsUpdatingNotebook(false);
      }
    },
    [],
  );

  const handleDeleteNotebook = useCallback(
    async (notebookId: string) => {
      if (!window.confirm("Delete this notebook and all of its notes?")) {
        return;
      }

      setIsDeletingNotebook(true);
      setAppError(null);

      try {
        const response = await fetch(`/api/notebooks/${notebookId}`, {
          method: "DELETE",
        });

        await parseResponse<{ success: true }>(response);
        const nextActiveId = activeNotebookId === notebookId ? "all" : activeNotebookId;

        setActiveNotebookId(nextActiveId);
        setSelectedNoteId((current) =>
          notes.some((note) => note.notebookId === notebookId && note.id === current) ? null : current,
        );
        await loadBootstrap(nextActiveId, searchQuery, false);
      } catch (error) {
        setAppError(getErrorMessage(error));
      } finally {
        setIsDeletingNotebook(false);
      }
    },
    [activeNotebookId, loadBootstrap, notes, searchQuery],
  );

  const handleCreateNote = useCallback(async () => {
    setIsCreatingNote(true);
    setAppError(null);
    setNoteError(null);
    setSaveError(null);
    setImportMessage(null);
    setSaveState("idle");

    try {
      const notebookId =
        activeNotebookId !== "all" ? activeNotebookId : notebooks[0]?.id;

      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notebookId,
        }),
      });
      const created = await parseResponse<NoteDetail>(response);

      setSearchQuery("");
      setIsNotesPanelOpen(true);
      setIsFocusMode(false);
      await loadBootstrap(activeNotebookId, "", false);
      setSelectedNoteId(created.id);
    } catch (error) {
      setAppError(getErrorMessage(error));
    } finally {
      setIsCreatingNote(false);
    }
  }, [activeNotebookId, loadBootstrap, notebooks]);

  const handleImportNote = useCallback(
    async (file: File) => {
      setIsImportingNote(true);
      setAppError(null);
      setNoteError(null);
      setSaveError(null);
      setImportMessage(null);
      setSaveState("idle");

      try {
        const imported = await parseImportedNoteFile(file);
        const notebookId = activeNotebookId !== "all" ? activeNotebookId : notebooks[0]?.id;

        if (!notebookId) {
          throw new Error("Create a notebook before importing notes.");
        }

        const response = await fetch("/api/notes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notebookId,
            title: imported.title,
            content: imported.content,
          }),
        });
        const created = await parseResponse<NoteDetail>(response);

        setSearchQuery("");
        setIsNotesPanelOpen(true);
        setIsFocusMode(false);
        await loadBootstrap(activeNotebookId, "", false);
        setSelectedNoteId(created.id);
        setSaveState("saved");
        setImportMessage(imported.isEmpty ? "Imported empty file as a blank note." : "Imported note.");
      } catch (error) {
        setAppError(getErrorMessage(error));
      } finally {
        setIsImportingNote(false);
      }
    },
    [activeNotebookId, loadBootstrap, notebooks],
  );

  const handleDeleteNote = useCallback(async () => {
    if (!selectedNoteId) {
      return;
    }

    if (!window.confirm("Delete this note?")) {
      return;
    }

    setIsDeletingNote(true);
    setAppError(null);

    try {
      const response = await fetch(`/api/notes/${selectedNoteId}`, {
        method: "DELETE",
      });

      await parseResponse<{ success: true }>(response);
      const nextSelectedId = notes.find((note) => note.id !== selectedNoteId)?.id ?? null;

      if (!nextSelectedId) {
        setDraft(null);
        setNoteError(null);
        setSaveError(null);
        setSaveState("idle");
      }
      setSelectedNoteId(nextSelectedId);
      await loadBootstrap(activeNotebookId, searchQuery, false);
    } catch (error) {
      setAppError(getErrorMessage(error));
    } finally {
      setIsDeletingNote(false);
    }
  }, [activeNotebookId, loadBootstrap, notes, searchQuery, selectedNoteId]);

  const handleToggleFocusMode = useCallback(() => {
    setIsFocusMode((current) => {
      const next = !current;

      if (next) {
        setIsNotesPanelOpen(false);
      }

      return next;
    });
  }, []);

  const showSidebar = !isFocusMode;
  const showNotesPanel = !isFocusMode && isNotesPanelOpen;

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[1500px] flex-col md:min-h-[calc(100vh-3rem)]">
        <header className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-6 md:px-6">
          <div />

          <div className="justify-self-center text-[20px] font-medium tracking-[0.09em] text-foreground/65">
            AI NOTE
          </div>

          <div className="flex items-center justify-self-end gap-2">
            <PanelToggle
              label="Toggle browser"
              title="Toggle browser"
              active={showNotesPanel}
              onClick={() => {
                setIsFocusMode(false);
                setIsNotesPanelOpen((current) => !current);
              }}
            >
              <Ellipsis size={18} strokeWidth={1.9} />
            </PanelToggle>

            <button
              type="button"
              onClick={() => void handleCreateNote()}
              disabled={isCreatingNote || notebooks.length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[14px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={16} strokeWidth={2.2} />
              {isCreatingNote ? "Creating..." : "New note"}
            </button>
          </div>
        </header>

        {appError ? (
          <div className="mx-4 mb-3 rounded-2xl bg-[#fff0e8] px-4 py-3 text-sm text-[#8a3c22] md:mx-6">
            {appError}
          </div>
        ) : null}

        <section className="flex flex-1 gap-3 overflow-hidden">
          {showSidebar ? (
            <SidebarPanel
              notebooks={notebooks}
              activeNotebookId={activeNotebookId}
              onSelectNotebook={(notebookId) => {
                setIsFocusMode(false);
                setActiveNotebookId(notebookId);
              }}
              onCreateNotebook={handleCreateNotebook}
              onUpdateNotebook={handleUpdateNotebook}
              onDeleteNotebook={handleDeleteNotebook}
              isCreatingNotebook={isCreatingNotebook}
              isUpdatingNotebook={isUpdatingNotebook}
              isDeletingNotebook={isDeletingNotebook}
              totalNoteCount={workspaceNoteCount}
              activeNotebook={activeNotebook}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapsed={() => setIsSidebarCollapsed((current) => !current)}
            />
          ) : null}

          {showNotesPanel ? (
            <NotesListPanel
              notes={notes}
              selectedNoteId={selectedNoteId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectNote={(noteId) => {
                setSelectedNoteId(noteId);
                setIsFocusMode(false);
              }}
              onCreateNote={() => void handleCreateNote()}
              isLoading={appLoading || notesLoading}
              activeNotebook={activeNotebook}
              hasNotebooks={notebooks.length > 0}
              onClose={() => setIsNotesPanelOpen(false)}
            />
          ) : null}

          <NoteEditorPanel
            note={draft}
            noteLoading={noteLoading}
            noteError={noteError}
            saveState={saveState}
            saveError={saveError}
            importMessage={importMessage}
            notebooks={notebooks}
            onChange={setDraft}
            onCreateNote={() => void handleCreateNote()}
            onImportNote={(file) => void handleImportNote(file)}
            isImportingNote={isImportingNote}
            onSaveNote={() => void handleSaveNow()}
            onDelete={() => void handleDeleteNote()}
            isDeleting={isDeletingNote}
            isFocusMode={isFocusMode}
            onToggleFocusMode={handleToggleFocusMode}
          />
        </section>
      </div>
    </main>
  );
}
