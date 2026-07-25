/**
 * Deciding whether an "autogenerate hover preview" request can be answered by
 * copying from elsewhere in the same document, rather than by calling a model.
 *
 * If the author already wrote a preview for this phrase (or for this link)
 * somewhere else in the document, that preview is both cheaper and more
 * faithful to their intent than anything we could regenerate.
 *
 * This module is deliberately free of lexical/React imports: it operates on
 * plain data, so it can be tested and reasoned about on its own.
 */

export interface HoverPreviewEntry {
  /** The anchor text of the link. */
  text: string;
  /** The link's custom hover preview HTML, or '' if it has none. */
  previewHtml: string;
  /** The link's href, or '' if it has none. */
  href: string;
  /** Lexical node key, used to identify (and exclude) the link being annotated. */
  nodeKey: string;
}

function normalizeForComparison(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Whether two strings name the same thing, ignoring case, surrounding space,
 * and the size of internal whitespace runs. Empty strings never match, not even
 * each other: "no text" and "no href" are absences, not values, and treating
 * them as equal would make every blank entry a match for every other one.
 */
export function sameText(a: string, b: string): boolean {
  const normalizedA = normalizeForComparison(a);
  const normalizedB = normalizeForComparison(b);
  return normalizedA.length > 0 && normalizedA === normalizedB;
}

/**
 * Every entry except the link we're annotating. A link can never be its own
 * reuse source; without this it would trivially match itself on both text and
 * href and we'd "reuse" its own (missing) preview.
 */
function entriesExceptTarget(entries: HoverPreviewEntry[], targetNodeKey: string): HoverPreviewEntry[] {
  return entries.filter(entry => entry.nodeKey !== targetNodeKey);
}

/**
 * Where the document already points this phrase. Reusing that href is cheaper
 * and more trustworthy than asking a model to rediscover the same URL.
 * Returns '' if no other link uses this phrase with a real href.
 */
export function findHrefForPhrase(entries: HoverPreviewEntry[], targetNodeKey: string, phrase: string): string {
  const candidates = entriesExceptTarget(entries, targetNodeKey);
  const match = candidates.find(entry => entry.href.length > 0 && sameText(entry.text, phrase));
  return match?.href ?? '';
}

/**
 * The best existing preview to copy: first one written for the same phrase,
 * else one written for the same link. Entries without a preview aren't twins
 * at all, since there'd be nothing to copy.
 */
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

  // A blank href is an absence rather than a value; matching on it would make
  // every unlinked entry in the document a twin of every other one.
  if (href.trim().length === 0) {
    return undefined;
  }

  return candidates.find(entry => sameText(entry.href, href));
}
