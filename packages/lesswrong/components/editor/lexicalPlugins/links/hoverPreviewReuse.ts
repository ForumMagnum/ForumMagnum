/**
 * Whether an autogenerate request can be answered by copying from
 * elsewhere in the document instead of calling a model. A preview the
 * author already wrote is cheaper and truer to their intent.
 */

export interface HoverPreviewEntry {
  text: string;
  previewHtml: string;
  href: string;
  /** Identifies the entry being annotated, so it can be excluded. */
  nodeKey: string;
}

function normalizeForComparison(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Empty never matches empty: an absence is not a value, and treating
 * it as one would make every blank entry a match for every other.
 */
export function sameText(a: string, b: string): boolean {
  const normalizedA = normalizeForComparison(a);
  const normalizedB = normalizeForComparison(b);
  return normalizedA.length > 0 && normalizedA === normalizedB;
}

/** An entry can never be its own reuse source. */
function entriesExceptTarget(entries: HoverPreviewEntry[], targetNodeKey: string): HoverPreviewEntry[] {
  return entries.filter(entry => entry.nodeKey !== targetNodeKey);
}

/**
 * Where the document already points this phrase. More trustworthy
 * than asking a model to rediscover the same URL.
 */
export function findHrefForPhrase(entries: HoverPreviewEntry[], targetNodeKey: string, phrase: string): string {
  const candidates = entriesExceptTarget(entries, targetNodeKey);
  const match = candidates.find(entry => entry.href.length > 0 && sameText(entry.text, phrase));
  return match?.href ?? '';
}

/** Prefers a phrase match, then a link match. */
export function findTwinPreview(
  entries: HoverPreviewEntry[],
  targetNodeKey: string,
  phrase: string,
  href: string,
): HoverPreviewEntry | undefined {
  const candidates = entriesExceptTarget(entries, targetNodeKey).filter(entry => entry.previewHtml.length > 0);

  const phraseMatch = candidates.find(entry => sameText(entry.text, phrase));
  if (phraseMatch) {
    return phraseMatch;
  }

  // Matching a blank href would make every unlinked entry a twin.
  if (href.trim().length === 0) {
    return undefined;
  }

  return candidates.find(entry => sameText(entry.href, href));
}
