export type NotebookSummary = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
  noteCount: number;
};

export type NoteListItem = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  notebookId: string;
  notebookName: string;
  createdAt: string;
  updatedAt: string;
};

export type NoteDetail = NoteListItem;

export type BootstrapResponse = {
  notebooks: NotebookSummary[];
  notes: NoteListItem[];
};

export type SaveState = "idle" | "saving" | "saved" | "error";
