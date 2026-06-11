import { $getNodeByKey, $isRootNode, type LexicalNode } from "lexical";
import { $isListItemNode } from "@lexical/list";
import { foldPunctuation } from "./editorAgentUtil";
import { findMathSpansInMarkdown, formatMathToken, type MathSpan } from "@/lib/utils/mathTokens";
import {
  markdownQuoteToRenderedPlainText,
  type MarkdownQuoteSelectionResult,
  type MarkdownSelectionPoint,
} from "./mapMarkdownToLexical";
import {
  $projectDocumentText,
  type DocumentProjection,
  type ProjectionSegment,
  type QuoteLocator,
} from "./quoteLocator";

/**
 * Text-index quote locator.
 *
 * Locates an agent-supplied markdown quote by comparing in rendered-text
 * space rather than markdown space:
 *
 *   1. Project the document to rendered text in one tree walk
 *      (`$projectDocumentText`), with per-segment position mapping back to
 *      nodes.
 *   2. Project the quote to rendered text via markdown-it
 *      (`projectQuoteToRenderedText`).
 *   3. Normalize both sides with one index-tracked normalization
 *      (`normalizeTracked`).
 *   4. Substring search; a quote matching more than once is an error (the
 *      agent guidelines require unambiguous quotes); map the unique match
 *      back through the tracked indices to anchor/focus selection points.
 */

/**
 * Project an agent-supplied markdown quote to the rendered text it denotes.
 *
 * Footnote reference markers (`[^id]`, but not `[^id]:` definitions) are
 * stripped first: the document projection makes footnote references
 * zero-width, and agents reading the markdown API may quote with or without
 * the markers — both must resolve to the same text. The rest is the shared
 * CommonMark projection (`markdownQuoteToRenderedPlainText`).
 *
 * `\[…\]` is read as escaped literal brackets by default: the read path
 * emits real display math as `$$…$$` and escapes literal `[` as `\[`, so in
 * quotes copied from it the escaped-bracket reading is almost always right.
 * The locator retries with `bracketDisplayMath: true` (the LaTeX reading)
 * when this reading fails to match — covering hand-written `\[…\]` math.
 */
export function projectQuoteToRenderedText(
  markdownQuote: string,
  options?: { bracketDisplayMath?: boolean },
): string {
  const withoutAgentSyntax = markdownQuote
    // Footnote definition markers (`[^id]: ` at line start) drop their
    // marker but keep their content — the tree has the content as plain
    // footnote-item text. References (`[^id]` elsewhere) drop entirely,
    // matching the zero-width footnote-reference projection. A reference
    // followed by `(` is not a reference at all but a markdown link whose
    // text happens to be `^…^` (imported posts export footnotes as
    // `[^1^](url)` superscript links) — leave it for markdown-it to parse.
    .replace(/^\[\^[^\]\s]+\]: ?/gm, "")
    .replace(/\[\^[^\]\s]+\](?![(:])/g, "")
    // Collapsible-section markers: `+++ Title` keeps its title text (which is
    // document text); a bare closing `+++` line contributes nothing. Both are
    // read-path syntax that markdown-it would otherwise render literally.
    .replace(/^\+\+\+ ?/gm, "")
    // LLM-content-block fences (`%%% llm-output …` / `%%% /llm-output`).
    .replace(/^%%%[^\n]*$/gm, "");
  return markdownQuoteToRenderedPlainText(withoutAgentSyntax, {
    bracketDisplayMath: options?.bracketDisplayMath ?? false,
  });
}

export interface TrackedNormalization {
  text: string
  /** For each normalized character, the start of its source range in the raw string. */
  toRawStart: number[]
  /** For each normalized character, the end (exclusive) of its source range. */
  toRawEnd: number[]
}

interface NormalizationState {
  out: string
  toRawStart: number[]
  toRawEnd: number[]
  pendingSpaceRawIndex: number | null
}

function emitNormalized(state: NormalizationState, chars: string, rawStart: number, rawEnd: number): void {
  if (chars.length === 0) return;
  if (state.pendingSpaceRawIndex !== null && state.out.length > 0) {
    state.out += " ";
    state.toRawStart.push(state.pendingSpaceRawIndex);
    state.toRawEnd.push(state.pendingSpaceRawIndex + 1);
  }
  state.pendingSpaceRawIndex = null;
  for (let i = 0; i < chars.length; i++) {
    state.out += chars[i];
    state.toRawStart.push(rawStart);
    state.toRawEnd.push(rawEnd);
  }
}

/**
 * Normalize text for matching while recording, for every output character,
 * the source character range it came from. Applied identically to the
 * document projection and the quote projection, so matching is a plain
 * substring search and positions map straight back to the document.
 *
 * Folds: typographic punctuation → ASCII (`foldPunctuation`), whitespace
 * runs → single space (trimmed at both ends), per-character NFKC (which also
 * expands `…` → `...` and NBSP → space), case folding — all outside math.
 * Math tokens are atomic: each `$…$`/`\(…\)` span is re-rendered to its
 * canonical digit-safe form and mapped to the span as a whole, so every
 * delimiter shape of an equation lands on one form on both sides.
 *
 * Math is found by scanning on both sides — symmetry is what keeps a quote
 * and the document agreeing even for awkward inputs (literal `$$x$$` typed
 * as text, prose dollars). The scanner's blank-line and currency guards
 * (see `findMathSpansInMarkdown`) keep prose dollar signs from pairing into
 * phantom spans that would swallow paragraphs between them.
 *
 * The index tracking is what frees this normalization from the
 * length-preservation constraint that `normalizeText` and its callers live
 * under (which is why ellipsis/NFKC folds are possible here but not there).
 */
export function normalizeTracked(raw: string): TrackedNormalization {
  const mathSpans: MathSpan[] = findMathSpansInMarkdown(raw);
  let spanIndex = 0;
  const state: NormalizationState = {
    out: "",
    toRawStart: [],
    toRawEnd: [],
    pendingSpaceRawIndex: null,
  };

  let i = 0;
  while (i < raw.length) {
    while (spanIndex < mathSpans.length && mathSpans[spanIndex].start < i) {
      spanIndex++;
    }
    const span = spanIndex < mathSpans.length ? mathSpans[spanIndex] : undefined;
    if (span && span.start === i) {
      // Re-render the span to its canonical token. Whitespace runs inside
      // the token collapse to single spaces: LaTeX whitespace is
      // insignificant, and the two sides legitimately differ in
      // equation-internal line breaks and alignment spacing.
      const token = formatMathToken({ equation: span.equation, inline: span.inline }, raw[span.end]);
      emitNormalized(state, token.replace(/\s+/g, " "), span.start, span.end);
      i = span.end;
      spanIndex++;
      continue;
    }

    const folded = foldPunctuation(raw[i]);
    if (/\s/.test(folded)) {
      if (state.pendingSpaceRawIndex === null) {
        state.pendingSpaceRawIndex = i;
      }
      i++;
      continue;
    }
    emitNormalized(state, folded.normalize("NFKC").toLowerCase(), i, i + 1);
    i++;
  }

  return { text: state.out, toRawStart: state.toRawStart, toRawEnd: state.toRawEnd };
}

interface StrippedText {
  text: string
  /** For each output character, its index in the source string. */
  toSourceIndex: number[]
}

const INLINE_MARKER_REGEX = /[*_~^`]/;

/**
 * Remove inline formatting-marker characters outside math tokens (collapsing
 * any space runs that removal exposes), keeping a per-character map back to
 * the source string. This is the final fallback comparison space: agents
 * drop, add, or restyle emphasis markers when quoting, and document text can
 * contain literal marker characters that never round-tripped as formatting —
 * comparing both sides marker-blind absorbs all of those at once.
 */
function stripInlineMarkers(value: string): StrippedText {
  const spans = findMathSpansInMarkdown(value);
  let spanIndex = 0;
  let out = "";
  const toSourceIndex: number[] = [];
  for (let i = 0; i < value.length; i++) {
    while (spanIndex < spans.length && spans[spanIndex].end <= i) spanIndex++;
    const inMath = spanIndex < spans.length
      && i >= spans[spanIndex].start && i < spans[spanIndex].end;
    if (!inMath) {
      if (INLINE_MARKER_REGEX.test(value[i])) continue;
      if (value[i] === " " && (out.length === 0 || out.endsWith(" "))) continue;
    }
    out += value[i];
    toSourceIndex.push(i);
  }
  while (out.endsWith(" ")) {
    out = out.slice(0, -1);
    toSourceIndex.pop();
  }
  return { text: out, toSourceIndex };
}

const MAX_COUNTED_OCCURRENCES = 9;

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1 && count <= MAX_COUNTED_OCCURRENCES) {
    count++;
    index = haystack.indexOf(needle, index + 1);
  }
  return count;
}

function segmentTouches(segment: ProjectionSegment, rawIndex: number): boolean {
  return rawIndex >= segment.start && rawIndex <= segment.end;
}

function elementPointAroundSegment(
  segment: ProjectionSegment,
  rawIndex: number,
  isFocus: boolean,
): MarkdownSelectionPoint | null {
  if (segment.parentKey === undefined || segment.childIndex === undefined) return null;
  // focus: ends before the node only if exactly at its start, else after.
  // anchor: starts after the node only if exactly at its end, else before.
  const offset = isFocus
    ? (rawIndex === segment.start ? segment.childIndex : segment.childIndex + 1)
    : (rawIndex === segment.end ? segment.childIndex + 1 : segment.childIndex);
  return { key: segment.parentKey, offset, type: "element" };
}

/**
 * Resolve a character index in the projected text to a Lexical selection
 * point. Prefers a text segment (a boundary between text and an atomic node
 * belongs to the text side, keeping the point a precise text offset); falls
 * back to an element point around an atomic math node. Boundaries on
 * positionless segments (separators, linebreaks) cannot arise from a
 * well-formed match — normalized quotes are trimmed, so both boundaries map
 * to content characters — and resolve to null.
 */
function resolveRawIndexToPoint(
  projection: DocumentProjection,
  rawIndex: number,
  isFocus: boolean,
): MarkdownSelectionPoint | null {
  // A boundary index can touch two adjacent text segments. Prefer the one
  // the selected content actually lies in — forward of an anchor, backward
  // of a focus — so that e.g. a match starting exactly at a link's first
  // character anchors inside the link's text node rather than at the end of
  // the preceding node (which would break sibling-walk application).
  for (const segment of projection.segments) {
    if (segment.start > rawIndex) break;
    if (segment.kind !== "text" || segment.key === undefined) continue;
    const containsTowardSelection = isFocus
      ? rawIndex > segment.start && rawIndex <= segment.end
      : rawIndex >= segment.start && rawIndex < segment.end;
    if (containsTowardSelection) {
      return { key: segment.key, offset: rawIndex - segment.start, type: "text" };
    }
  }
  for (const segment of projection.segments) {
    if (segment.start > rawIndex) break;
    if (segment.kind === "text" && segment.key !== undefined && segmentTouches(segment, rawIndex)) {
      return { key: segment.key, offset: rawIndex - segment.start, type: "text" };
    }
  }
  for (const segment of projection.segments) {
    if (segment.start > rawIndex) break;
    if ((segment.kind === "math" || segment.kind === "mention") && segmentTouches(segment, rawIndex)) {
      return elementPointAroundSegment(segment, rawIndex, isFocus);
    }
  }
  return null;
}

interface NormalizedDocument {
  projection: DocumentProjection
  normalizedDocument: TrackedNormalization
}

/**
 * Project and normalize the current document.
 * Must be called inside a Lexical read/update context.
 */
function $buildNormalizedDocument(): NormalizedDocument {
  const projection = $projectDocumentText();
  return { projection, normalizedDocument: normalizeTracked(projection.text) };
}

type LocateOutcome = "found" | "not_found" | "ambiguous" | "empty";

function locateNormalizedQuote(
  projection: DocumentProjection,
  normalizedDocument: TrackedNormalization,
  normalizedQuote: string,
): { outcome: LocateOutcome, result: MarkdownQuoteSelectionResult } {
  if (!normalizedQuote) {
    return {
      outcome: "empty",
      result: { found: false, reason: "Quote was empty after normalization." },
    };
  }

  const matchIndex = normalizedDocument.text.indexOf(normalizedQuote);
  if (matchIndex === -1) {
    return {
      outcome: "not_found",
      result: { found: false, reason: "Quote not found in document." },
    };
  }
  const occurrences = countOccurrences(normalizedDocument.text, normalizedQuote);
  if (occurrences > 1) {
    const countDescription = occurrences > MAX_COUNTED_OCCURRENCES
      ? `at least ${MAX_COUNTED_OCCURRENCES}`
      : String(occurrences);
    return {
      outcome: "ambiguous",
      result: {
        found: false,
        reason: `Quote is ambiguous: it appears ${countDescription} times in the document. `
          + `Provide a longer quote with more surrounding context to disambiguate.`,
      },
    };
  }

  const rawStart = normalizedDocument.toRawStart[matchIndex];
  const rawEnd = normalizedDocument.toRawEnd[matchIndex + normalizedQuote.length - 1];
  const anchor = resolveRawIndexToPoint(projection, rawStart, false);
  const focus = resolveRawIndexToPoint(projection, rawEnd, true);
  if (!anchor || !focus) {
    return {
      outcome: "found",
      result: {
        found: true,
        reason: "Quote text was found, but its boundaries could not be resolved to selection points.",
      },
    };
  }

  return {
    outcome: "found",
    result: { found: true, anchor, focus, matchedNodeKey: anchor.key },
  };
}

/**
 * Marker-blind fallback: strip inline formatting markers from both the
 * normalized document and the normalized quote, search there, and map the
 * match back through both index layers. Returns null when this tier finds
 * nothing either.
 */
function locateMarkerBlindQuote(
  projection: DocumentProjection,
  normalizedDocument: TrackedNormalization,
  normalizedQuote: string,
): MarkdownQuoteSelectionResult | null {
  const blindQuote = stripInlineMarkers(normalizedQuote).text;
  if (!blindQuote) return null;
  const blindDocument = stripInlineMarkers(normalizedDocument.text);

  const matchIndex = blindDocument.text.indexOf(blindQuote);
  if (matchIndex === -1) return null;
  const occurrences = countOccurrences(blindDocument.text, blindQuote);
  if (occurrences > 1) {
    const countDescription = occurrences > MAX_COUNTED_OCCURRENCES
      ? `at least ${MAX_COUNTED_OCCURRENCES}`
      : String(occurrences);
    return {
      found: false,
      reason: `Quote is ambiguous: it appears ${countDescription} times in the document `
        + `(matching with formatting markers ignored). `
        + `Provide a longer quote with more surrounding context to disambiguate.`,
    };
  }

  const normalizedStart = blindDocument.toSourceIndex[matchIndex];
  const normalizedEnd = blindDocument.toSourceIndex[matchIndex + blindQuote.length - 1];
  const rawStart = normalizedDocument.toRawStart[normalizedStart];
  const rawEnd = normalizedDocument.toRawEnd[normalizedEnd];
  const anchor = resolveRawIndexToPoint(projection, rawStart, false);
  const focus = resolveRawIndexToPoint(projection, rawEnd, true);
  if (!anchor || !focus) {
    return {
      found: true,
      reason: "Quote text was found, but its boundaries could not be resolved to selection points.",
    };
  }
  return { found: true, anchor, focus, matchedNodeKey: anchor.key };
}

/**
 * The text-index implementation of `QuoteLocator`.
 *
 * Tiers: (1) exact search in normalized rendered-text space; (2) when the
 * quote contains `\[`, the LaTeX display-math reading of it; (3) marker-blind
 * search. Each tier is a strictly more tolerant reading of the same quote;
 * ambiguity at any tier is an error, never a guess.
 *
 * Note: the projection always covers the whole document; `rootNodeKey` is
 * accepted for interface compatibility (every production caller passes the
 * root key) but subtree-restricted location is not supported.
 */
export const $locateQuoteWithTextIndex: QuoteLocator = ({ markdownQuote }) => {
  const { projection, normalizedDocument } = $buildNormalizedDocument();
  const normalizedQuote = normalizeTracked(projectQuoteToRenderedText(markdownQuote)).text;

  const primary = locateNormalizedQuote(projection, normalizedDocument, normalizedQuote);
  if (primary.outcome !== "not_found") {
    return primary.result;
  }

  // The primary pass read `\[…\]` as escaped brackets. When that reading
  // finds nothing and the quote contains the bracket form, retry with the
  // LaTeX display-math reading (hand-written `\[…\]` math in quotes).
  if (markdownQuote.includes("\\[")) {
    const retry = locateNormalizedQuote(
      projection,
      normalizedDocument,
      normalizeTracked(projectQuoteToRenderedText(markdownQuote, { bracketDisplayMath: true })).text,
    );
    if (retry.outcome !== "not_found" && retry.outcome !== "empty") {
      return retry.result;
    }
  }

  const blind = locateMarkerBlindQuote(projection, normalizedDocument, normalizedQuote);
  if (blind) return blind;

  return primary.result;
};

export interface BlockPrefixResult {
  node: LexicalNode | null
  reason?: string
}

/**
 * The block a character position belongs to, for block-level operations: the
 * nearest ancestor that is a list item, or failing that the node's top-level
 * element. Matching a list item (at any nesting depth) lets deleteBlock
 * remove one item rather than the whole list; everything else (paragraphs,
 * headings, tables, blockquotes, …) resolves to the top-level block.
 */
function $blockAncestorOfKey(key: string): LexicalNode | null {
  let current = $getNodeByKey(key);
  while (current) {
    if ($isListItemNode(current)) return current;
    const parent: LexicalNode | null = current.getParent();
    if (parent && $isRootNode(parent)) return current;
    current = parent;
  }
  return null;
}

/**
 * Locate the block (top-level node or list item) whose rendered text starts
 * with the given markdown prefix, via the text index. Replaces the legacy
 * markdown-serialization prefix matcher for deleteBlock/insertBlock: the
 * prefix is treated as a quote that must match at a block start, with the
 * same normalization as quote location. A prefix matching more than one
 * block is an error, never a guess.
 *
 * Must be called inside a Lexical read/update context.
 */
export function $locateBlockByPrefix(prefix: string): BlockPrefixResult {
  const { projection, normalizedDocument } = $buildNormalizedDocument();
  const normalizedPrefix = normalizeTracked(projectQuoteToRenderedText(prefix)).text;
  if (!normalizedPrefix) {
    return { node: null, reason: "Prefix was empty after normalization." };
  }

  const matchedKeys = new Set<string>();
  const matchedBlocks: LexicalNode[] = [];
  let matchIndex = normalizedDocument.text.indexOf(normalizedPrefix);
  while (matchIndex !== -1) {
    const rawStart = normalizedDocument.toRawStart[matchIndex];
    const anchor = resolveRawIndexToPoint(projection, rawStart, false);
    const block = anchor ? $blockAncestorOfKey(anchor.key) : null;
    if (block && !matchedKeys.has(block.getKey())) {
      // Only a match at the very start of the block's projected text counts
      // as "the block starts with this prefix".
      const blockSpan = projection.spans.get(block.getKey());
      if (blockSpan && blockSpan.start === rawStart) {
        matchedKeys.add(block.getKey());
        matchedBlocks.push(block);
      }
    }
    matchIndex = normalizedDocument.text.indexOf(normalizedPrefix, matchIndex + 1);
  }

  if (matchedBlocks.length === 1) {
    return { node: matchedBlocks[0] };
  }
  if (matchedBlocks.length === 0) {
    return { node: null, reason: "No block starts with the given prefix." };
  }
  return {
    node: null,
    reason: `Ambiguous prefix: ${matchedBlocks.length} blocks start with it. `
      + `Provide a longer prefix to disambiguate.`,
  };
}
