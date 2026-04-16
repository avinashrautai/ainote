import { buildExcerpt } from "@/lib/note-helpers";
import type { BootstrapResponse, NoteDetail, NoteListItem, NotebookSummary } from "@/lib/types";

const STORAGE_KEY = "ainote-local-data-v1";

type StoredNotebook = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
};

type StoredNote = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  notebookId: string;
  createdAt: string;
  updatedAt: string;
};

type LocalData = {
  notebooks: StoredNotebook[];
  notes: StoredNote[];
};

type NoteInput = {
  notebookId?: string;
  title?: string;
  content?: string;
};

type NotebookInput = {
  name: string;
  description?: string;
  color?: string;
};

function createTimestamp() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

function createSeedData(): LocalData {
  const now = createTimestamp();
  const dailyNotesId = createId();
  const researchId = createId();
  const productIdeasId = createId();

  return {
    notebooks: [
      {
        id: dailyNotesId,
        name: "Daily Notes",
        description: "Quick captures, standups, and daily reflections.",
        color: "#b85c38",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: researchId,
        name: "Research",
        description: "Long-form exploration and source notes.",
        color: "#236c4a",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: productIdeasId,
        name: "Product Ideas",
        description: "Feature concepts and experiments for the AI Notes App.",
        color: "#8b6f47",
        createdAt: now,
        updatedAt: now,
      },
    ],
    notes: [
      {
        id: createId(),
        title: "Launch plan draft",
        content:
          "Ship the polished notes workspace with reliable create, edit, search, filter, and autosave flows.\n\nConfirm the selected note always stays in sync with the right panel and that notebook context remains clear as people move through their work.",
        excerpt: "Outline launch milestones and dependencies.",
        notebookId: dailyNotesId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        title: "Customer interview snippets",
        content:
          "Users want capture to feel instant. They also want to trust that edits are saved quickly and that it is always obvious which note they are working in.",
        excerpt: "Capture themes from user calls and testing.",
        notebookId: dailyNotesId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        title: "Semantic retrieval ideas",
        content:
          "Potential future work: embeddings, note linking, retrieval scoring, and prompt-driven transformations.",
        excerpt: "Future ideas for AI-assisted search and synthesis.",
        notebookId: researchId,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: createId(),
        title: "Inbox zero experiment",
        content:
          "Test notebook-level triage and focused note lists before adding more complex AI workflows.",
        excerpt: "Ideas for taming note overload.",
        notebookId: productIdeasId,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

function parseData(value: string | null): LocalData | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as LocalData;

    if (!Array.isArray(parsed.notebooks) || !Array.isArray(parsed.notes)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function readData(): LocalData {
  const existing = parseData(window.localStorage.getItem(STORAGE_KEY));

  if (existing) {
    return existing;
  }

  const seeded = createSeedData();
  writeData(seeded);
  return seeded;
}

function writeData(data: LocalData) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function findNotebookOrThrow(data: LocalData, notebookId: string) {
  const notebook = data.notebooks.find((item) => item.id === notebookId);

  if (!notebook) {
    throw new Error("Notebook not found.");
  }

  return notebook;
}

function sortNotebooks(notebooks: StoredNotebook[]) {
  return [...notebooks].sort((a, b) => a.name.localeCompare(b.name));
}

function sortNotes(notes: StoredNote[]) {
  return [...notes].sort((a, b) => {
    if (a.updatedAt === b.updatedAt) {
      return b.createdAt.localeCompare(a.createdAt);
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function serializeNotebook(notebook: StoredNotebook, notes: StoredNote[]): NotebookSummary {
  return {
    id: notebook.id,
    name: notebook.name,
    description: notebook.description,
    color: notebook.color,
    createdAt: notebook.createdAt,
    updatedAt: notebook.updatedAt,
    noteCount: notes.filter((note) => note.notebookId === notebook.id).length,
  };
}

function serializeNote(note: StoredNote, notebooks: StoredNotebook[]): NoteDetail {
  const notebook = notebooks.find((item) => item.id === note.notebookId);

  if (!notebook) {
    throw new Error("Notebook not found.");
  }

  return {
    id: note.id,
    title: note.title,
    content: note.content,
    excerpt: note.excerpt,
    notebookId: note.notebookId,
    notebookName: notebook.name,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

function filterNotes(
  notes: StoredNote[],
  notebooks: StoredNotebook[],
  notebookId?: string,
  query?: string,
): NoteListItem[] {
  const normalizedQuery = query?.trim().toLowerCase();

  return sortNotes(notes)
    .filter((note) => {
      if (notebookId && note.notebookId !== notebookId) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        note.title.toLowerCase().includes(normalizedQuery) ||
        note.content.toLowerCase().includes(normalizedQuery)
      );
    })
    .map((note) => serializeNote(note, notebooks));
}

export async function loadBootstrapData(
  notebookId: string,
  query: string,
): Promise<BootstrapResponse> {
  const data = readData();

  return {
    notebooks: sortNotebooks(data.notebooks).map((item) => serializeNotebook(item, data.notes)),
    notes: filterNotes(data.notes, data.notebooks, notebookId !== "all" ? notebookId : undefined, query),
  };
}

export async function getNoteDetail(noteId: string): Promise<NoteDetail> {
  const data = readData();
  const note = data.notes.find((item) => item.id === noteId);

  if (!note) {
    throw new Error("Note not found.");
  }

  return serializeNote(note, data.notebooks);
}

export async function createNote(input: NoteInput): Promise<NoteDetail> {
  const data = readData();
  const fallbackNotebookId = data.notebooks[0]?.id;
  const notebookId = input.notebookId || fallbackNotebookId;

  if (!notebookId) {
    throw new Error("Create a notebook before creating notes.");
  }

  findNotebookOrThrow(data, notebookId);

  const title = input.title?.trim() || "Untitled note";
  const content = input.content ?? "";
  const timestamp = createTimestamp();
  const note: StoredNote = {
    id: createId(),
    title,
    content,
    excerpt: buildExcerpt(content, title),
    notebookId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.notes.push(note);
  writeData(data);

  return serializeNote(note, data.notebooks);
}

export async function updateNote(
  noteId: string,
  input: Pick<NoteInput, "title" | "content" | "notebookId">,
): Promise<NoteDetail> {
  const data = readData();
  const note = data.notes.find((item) => item.id === noteId);

  if (!note) {
    throw new Error("Note not found.");
  }

  const nextNotebookId = input.notebookId || note.notebookId;
  findNotebookOrThrow(data, nextNotebookId);

  note.title = input.title?.trim() || "Untitled note";
  note.content = input.content ?? "";
  note.excerpt = buildExcerpt(note.content, note.title);
  note.notebookId = nextNotebookId;
  note.updatedAt = createTimestamp();

  writeData(data);
  return serializeNote(note, data.notebooks);
}

export async function deleteNote(noteId: string): Promise<{ success: true }> {
  const data = readData();
  const nextNotes = data.notes.filter((item) => item.id !== noteId);

  if (nextNotes.length === data.notes.length) {
    throw new Error("Note not found.");
  }

  writeData({
    ...data,
    notes: nextNotes,
  });

  return { success: true };
}

export async function createNotebook(input: NotebookInput): Promise<NotebookSummary> {
  const data = readData();
  const name = input.name.trim();

  if (!name) {
    throw new Error("Notebook name is required.");
  }

  const timestamp = createTimestamp();
  const notebook: StoredNotebook = {
    id: createId(),
    name,
    description: input.description?.trim() || null,
    color: input.color?.trim() || "#b85c38",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  data.notebooks.push(notebook);
  writeData(data);

  return serializeNotebook(notebook, data.notes);
}

export async function updateNotebook(
  notebookId: string,
  input: NotebookInput,
): Promise<NotebookSummary> {
  const data = readData();
  const notebook = data.notebooks.find((item) => item.id === notebookId);

  if (!notebook) {
    throw new Error("Notebook not found.");
  }

  const name = input.name.trim();

  if (!name) {
    throw new Error("Notebook name is required.");
  }

  notebook.name = name;
  notebook.description = input.description?.trim() || null;
  notebook.color = input.color?.trim() || "#b85c38";
  notebook.updatedAt = createTimestamp();

  writeData(data);
  return serializeNotebook(notebook, data.notes);
}

export async function deleteNotebook(notebookId: string): Promise<{ success: true }> {
  const data = readData();
  const notebookExists = data.notebooks.some((item) => item.id === notebookId);

  if (!notebookExists) {
    throw new Error("Notebook not found.");
  }

  writeData({
    notebooks: data.notebooks.filter((item) => item.id !== notebookId),
    notes: data.notes.filter((item) => item.notebookId !== notebookId),
  });

  return { success: true };
}
