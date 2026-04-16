"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { FileUp, Menu, Plus, Search, Settings2 } from "lucide-react";
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
const THEME_STORAGE_KEY = "ainote-theme";
const ACCENT_STORAGE_KEY = "ainote-accent";
const APP_VERSION = "0.1.0";

type ThemePreference = "system" | "light" | "dark";
type EffectiveTheme = "light" | "dark";
type AccentOption = "red" | "blue" | "green" | "amber";

const ACCENT_SWATCHES: Record<AccentOption, string> = {
  red: "#e53935",
  blue: "#2563eb",
  green: "#16a34a",
  amber: "#d97706",
};

function formatHeaderDateTime(date: Date) {
  return {
    day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date),
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
  };
}

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotesPanelOpen, setIsNotesPanelOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>("light");
  const [accentOption, setAccentOption] = useState<AccentOption>("red");
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const hasInitializedFiltersRef = useRef(false);
  const selectedNoteIdRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const hasHydratedDraftRef = useRef(false);
  const autosaveTimeoutRef = useRef<number | null>(null);
  const draftRef = useRef<NoteDetail | null>(null);
  const activeNotebookIdRef = useRef(activeNotebookId);
  const searchQueryRef = useRef(searchQuery);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);

  const activeNotebook = useMemo(
    () => notebooks.find((notebook) => notebook.id === activeNotebookId) ?? null,
    [activeNotebookId, notebooks],
  );

  const workspaceNoteCount = useMemo(
    () => notebooks.reduce((total, notebook) => total + notebook.noteCount, 0),
    [notebooks],
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsSidebarCollapsed(mediaQuery.matches);
  }, []);

  useEffect(() => {
    const storedPreference = localStorage.getItem(THEME_STORAGE_KEY);
    const storedAccent = localStorage.getItem(ACCENT_STORAGE_KEY);
    const nextPreference =
      storedPreference === "light" || storedPreference === "dark" || storedPreference === "system"
        ? storedPreference
        : "system";
    const nextAccent =
      storedAccent === "red" || storedAccent === "blue" || storedAccent === "green" || storedAccent === "amber"
        ? storedAccent
        : "red";

    setThemePreference(nextPreference);
    setAccentOption(nextAccent);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const nextTheme = themePreference === "system" ? (mediaQuery.matches ? "dark" : "light") : themePreference;
      setEffectiveTheme(nextTheme);

      if (themePreference === "system") {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", themePreference);
      }

      localStorage.setItem(THEME_STORAGE_KEY, themePreference);
    };

    applyTheme();

    const handleChange = () => {
      if (themePreference === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [themePreference]);

  useEffect(() => {
    document.documentElement.setAttribute("data-accent", accentOption);
    localStorage.setItem(ACCENT_STORAGE_KEY, accentOption);
  }, [accentOption]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!settingsMenuRef.current?.contains(event.target as Node)) {
        setIsSettingsMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, []);

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
    if (searchQuery.trim()) {
      setIsNotesPanelOpen(true);
    }
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

  useEffect(() => {
    if (!settingsMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSettingsMessage(null);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [settingsMessage]);

  const showSidebar = true;
  const showNotesPanel = isNotesPanelOpen;
  const dateTimeLabel = useMemo(() => formatHeaderDateTime(now), [now]);

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
      const notebookId = activeNotebookId !== "all" ? activeNotebookId : notebooks[0]?.id;

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
      setIsNotesPanelOpen(false);
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
    const note = draftRef.current;

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

  function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void handleImportNote(file);
    event.target.value = "";
  }

  function handleCheckForUpdates() {
    setSettingsMessage("App is up to date");
  }

  return (
    <main className="min-h-screen p-3 md:p-5">
      <input
        ref={importInputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        onChange={handleImportChange}
        className="hidden"
      />

      <div className="app-shell-frame mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1520px] flex-col rounded-[34px] px-3 py-3 md:min-h-[calc(100vh-2.5rem)] md:px-4 md:py-4">
        <header className="flex flex-col gap-2 px-2 py-2 md:px-3">
          <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[auto_minmax(240px,340px)_auto] lg:items-start lg:gap-3">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed((current) => !current)}
                  className="app-icon-button md:hidden"
                  aria-label="Toggle sidebar"
                  title="Toggle sidebar"
                >
                  <Menu size={18} strokeWidth={1.9} />
                </button>
                <div>
                  <p className="font-display text-[30px] font-bold leading-none tracking-[-0.06em] text-[#111111]">
                    AINote
                  </p>
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => void handleCreateNote()}
                      disabled={isCreatingNote || notebooks.length === 0}
                      className="app-button app-button-accent w-fit disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus size={15} strokeWidth={2} />
                      {isCreatingNote ? "Creating..." : "New"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="app-field mt-1 flex min-w-0 w-full max-w-[460px] items-center gap-3 rounded-[16px] px-3.5 py-2 lg:mt-0 lg:justify-self-center">
              <Search size={16} strokeWidth={1.9} className="shrink-0 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full border-none bg-transparent text-[13px] text-[#111111] outline-none focus-visible:outline-none"
                placeholder="Search notes and writing"
                aria-label="Search notes"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-[12px] font-medium text-[var(--text-muted)] transition hover:text-[#111111]"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div className="relative mt-1 shrink-0 lg:mt-0 lg:justify-self-end" ref={settingsMenuRef}>
              <div className="flex items-center gap-2">
                <div className="hidden text-right md:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {dateTimeLabel.day}
                  </p>
                  <p className="mt-1 text-[13px] font-medium text-[#111111]">
                    {dateTimeLabel.date} · {dateTimeLabel.time}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsMenuOpen((current) => !current)}
                  className="app-icon-button h-9 w-9"
                  aria-label="Open settings"
                  title="Settings"
                >
                  <Settings2 size={16} strokeWidth={1.9} />
                </button>
              </div>
              {isSettingsMenuOpen ? (
                <div className="app-menu absolute right-0 top-12 z-20 w-[320px] rounded-[24px] p-3">
                  <div className="px-3 pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Theme
                    </p>
                  </div>
                  <div className="px-3">
                    <div className="flex rounded-[14px] bg-[color:color-mix(in_srgb,var(--surface-2)_72%,transparent)] p-1">
                      {(["light", "dark", "system"] as ThemePreference[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={themePreference === option}
                          onClick={() => setThemePreference(option)}
                          className={[
                            "flex-1 rounded-[10px] px-3 py-2 text-[12px] font-medium capitalize transition",
                            themePreference === option
                              ? "bg-[var(--panel)] text-[#111111] shadow-[0_1px_4px_rgba(17,17,17,0.08)]"
                              : "text-[var(--text-muted)] hover:text-[#111111]",
                          ].join(" ")}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="px-3 pb-2 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Accent
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 px-3">
                    {(["red", "blue", "green", "amber"] as AccentOption[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={accentOption === option}
                        onClick={() => setAccentOption(option)}
                        className={[
                          "flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-left transition",
                          accentOption === option
                            ? "bg-[color:color-mix(in_srgb,var(--accent-soft)_100%,transparent)] text-[#111111]"
                            : "hover:bg-[color:color-mix(in_srgb,var(--hover)_96%,transparent)] text-[var(--text-muted)]",
                        ].join(" ")}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: ACCENT_SWATCHES[option] }}
                        />
                        <span className="text-[13px] font-medium capitalize">{option}</span>
                      </button>
                    ))}
                  </div>

                  <div className="px-3 pb-1 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettingsMenuOpen(false);
                        setIsAboutOpen(true);
                      }}
                      className="app-menu-item"
                    >
                      <span>About</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {isAboutOpen ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-[color:color-mix(in_srgb,#111111_18%,transparent)] px-4">
            <button
              type="button"
              aria-label="Close about dialog"
              className="absolute inset-0"
              onClick={() => setIsAboutOpen(false)}
            />
            <div className="app-menu relative z-10 w-full max-w-[420px] rounded-[28px] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-[28px] font-bold tracking-[-0.05em] text-[#111111]">
                    AINote
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-[#111111]">
                    A calm writing space for clean notes, focused thinking, and everyday productivity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAboutOpen(false)}
                  className="app-icon-button h-9 w-9"
                  aria-label="Close about dialog"
                >
                  <span className="text-base leading-none">×</span>
                </button>
              </div>

              <div className="mt-6 space-y-3 text-[14px] text-[#111111]">
                <p>
                  <span className="text-[var(--text-muted)]">Version:</span> {APP_VERSION}
                </p>
                <p>
                  <span className="text-[var(--text-muted)]">Made by:</span> Avinash with ❤️ &amp; AI
                </p>
                <a
                  href="https://github.com/avinashrautai/ainote"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
                >
                  GitHub repository
                </a>
              </div>

              <div className="mt-6 border-t border-[color:color-mix(in_srgb,var(--border)_72%,transparent)] pt-5">
                <button
                  type="button"
                  onClick={handleCheckForUpdates}
                  className="app-button rounded-[12px] px-3 py-1.5 text-[12px]"
                >
                  Check for updates
                </button>
                {settingsMessage ? (
                  <p className="mt-3 text-sm text-[var(--text-muted)]">{settingsMessage}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {appError ? (
          <div className="mx-2 mb-3 rounded-[22px] bg-[color:color-mix(in_srgb,var(--accent-soft)_90%,transparent)] px-4 py-3 text-sm text-[var(--accent)] md:mx-3">
            {appError}
          </div>
        ) : null}

        {showSidebar && !isSidebarCollapsed ? (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsSidebarCollapsed(true)}
            className="fixed inset-0 z-20 bg-[color:color-mix(in_srgb,var(--text)_10%,transparent)] md:hidden"
          />
        ) : null}

        <section className="flex flex-1 gap-2 overflow-hidden">
          <SidebarPanel
            notebooks={notebooks}
            activeNotebookId={activeNotebookId}
            onSelectNotebook={(notebookId) => {
              setActiveNotebookId(notebookId);
              setIsNotesPanelOpen(true);
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

          {showNotesPanel ? (
            <NotesListPanel
              notes={notes}
              selectedNoteId={selectedNoteId}
              searchQuery={searchQuery}
              onSelectNote={(noteId) => setSelectedNoteId(noteId)}
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
            onSaveNote={() => void handleSaveNow()}
            onDeleteNote={() => void handleDeleteNote()}
            onImportTrigger={() => importInputRef.current?.click()}
            onExportNote={handleExport}
            onChange={setDraft}
            onCreateNote={() => void handleCreateNote()}
            focusRequest={0}
            isImportingNote={isImportingNote}
            isDeletingNote={isDeletingNote}
          />
        </section>
      </div>
    </main>
  );
}
