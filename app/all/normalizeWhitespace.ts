// Collapse all whitespace runs into single spaces, so excerpts fit on one line.
export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
