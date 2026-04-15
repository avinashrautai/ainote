import type { Note, Notebook } from "@prisma/client";
import type { NoteDetail, NoteListItem, NotebookSummary } from "@/lib/types";

type NotebookWithCount = Notebook & {
  _count: {
    notes: number;
  };
};

type NoteWithRelations = Note & {
  notebook: Notebook;
};

export function serializeNotebook(notebook: NotebookWithCount): NotebookSummary {
  return {
    id: notebook.id,
    name: notebook.name,
    description: notebook.description,
    color: notebook.color,
    createdAt: notebook.createdAt.toISOString(),
    updatedAt: notebook.updatedAt.toISOString(),
    noteCount: notebook._count.notes,
  };
}

export function serializeNoteListItem(note: NoteWithRelations): NoteListItem {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    excerpt: note.excerpt,
    notebookId: note.notebookId,
    notebookName: note.notebook.name,
    updatedAt: note.updatedAt.toISOString(),
    createdAt: note.createdAt.toISOString(),
  };
}

export function serializeNoteDetail(note: NoteWithRelations): NoteDetail {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    excerpt: note.excerpt,
    notebookId: note.notebookId,
    notebookName: note.notebook.name,
    updatedAt: note.updatedAt.toISOString(),
    createdAt: note.createdAt.toISOString(),
  };
}
