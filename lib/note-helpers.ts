export function buildExcerpt(content: string, title: string) {
  const normalized = content.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return title ? `Draft note: ${title}` : "Empty note";
  }

  return normalized.slice(0, 140);
}
