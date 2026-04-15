const SUPPORTED_EXTENSIONS = [".txt", ".md"] as const;
const MAX_IMPORT_BYTES = 1024 * 1024;

export function isSupportedImportFile(file: File) {
  const lowerName = file.name.toLowerCase();

  return SUPPORTED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
}

export function getImportedNoteTitle(filename: string) {
  const normalized = filename.replace(/\.[^/.]+$/, "").trim();

  return normalized || "Imported note";
}

export async function parseImportedNoteFile(file: File) {
  if (!isSupportedImportFile(file)) {
    throw new Error("Only .txt and .md files can be imported.");
  }

  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error("This file is too large to import. Please choose a text file under 1 MB.");
  }

  const content = await file.text();
  const title = getImportedNoteTitle(file.name);

  return {
    title,
    content,
    isEmpty: !content.trim(),
  };
}
