import { $generateHtmlFromNodes } from "@lexical/html";
import {
  $getNodeByKey,
  $isDecoratorNode,
  $isElementNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
  type SerializedLexicalNode,
} from "lexical";
import { htmlToMarkdown, markdownToHtml, markdownToHtmlNoMath } from "@/server/editor/conversionUtils";
import { JSDOM } from "jsdom";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { createHeadlessEditor, foldPunctuation, normalizeText, paragraphMarkdownStartsWith, plainTextStartsWith } from "./editorAgentUtil";
import { FOOTNOTE_ELEMENT_TYPES } from "@/components/editor/lexicalPlugins/footnotes/constants";
import { QUERY_INPUT_NODE_TYPE } from "@/components/research/lexical/QueryInputNode";
import { $isMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import { stripMathTokens, formatMathToken, foldCaseOutsideMath, canonicalizeMathTokens, findMathSpansInMarkdown, type MathSpan } from "@/lib/utils/mathTokens";
import { $isListNode } from "@lexical/list";

/**
 * Recursively serialize a Lexical node and its children to JSON.
 * Lexical's internal `exportNodeToJSON` is not exported, but we need
 * the same behaviour: call `exportJSON()` on the node, then walk its
 * element children and push their serialized forms into the `children`
 * array that `exportJSON()` leaves empty.
 */
function exportNodeToJSONRecursive(node: LexicalNode): SerializedLexicalNode {
  const serialized = node.exportJSON();
  if ($isElementNode(node)) {
    const children = node.getChildren().map(exportNodeToJSONRecursive);
    (serialized as AnyBecauseHard).children = children;
  }
  return serialized;
}

export interface MarkdownSelectionPoint {
  key: string
  offset: number
  type: "text" | "element"
}

export interface NodeMarkdownEntry {
  key: string
  type: string
  depth: number
  markdown: string
}

export interface NodeMarkdownMapResult {
  entries: NodeMarkdownEntry[]
  byKey: Map<string, NodeMarkdownEntry>
}

export interface MarkdownQuoteSelectionResult {
  found: boolean
  anchor?: MarkdownSelectionPoint
  focus?: MarkdownSelectionPoint
  matchedNodeKey?: string
  matchedNodeType?: string
  matchedMarkdown?: string
  reason?: string
}

function stripSimpleMarkdownPunctuation(value: string): string {
  return value.replace(/[*_`~]/g, "");
}

function normalizeEmphasisMarkerStyle(value: string): string {
  return value.replace(/\*/g, "_");
}

function normalizeForSemanticMatch(value: string): string {
  // `normalizeText` canonicalizes math tokens, so all delimiter shapes of an
  // equation fold together without a separate delimiter-normalization pass.
  return normalizeText(normalizeEmphasisMarkerStyle(value));
}

// The plaintext returned here preserves a character-by-character ordering
// correspondence with the markdown source: each output character appears in
// the input in the same order, so callers can align plaintext positions back
// to markdown positions via a two-pointer walk (see `buildPlainToMarkdownMapping`
// in replaceText). Keep this regex-based — do not swap to a markdown-it render,
// which adds trailing whitespace and trims input whitespace in ways that break
// position alignment. For the quote-matching projection (which needs CommonMark
// semantics for intraword `_`, literal `$`, etc.), use
// `markdownQuoteToRenderedPlainText` instead.
//
// Math tokens are projected to zero width: an equation is an opaque MathNode
// that contributes no text content to the Lexical document, so counting the
// equation body here would desynchronize replaceText narrowing offsets from
// the document's text-node walk (`$advancePoint`/`$retreatPoint`).
export function markdownQuoteToPlainText(value: string): string {
  return stripMathTokens(value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1"))
    .replace(/[*_`~]/g, "");
}

/**
 * Locate a rendered-text quote (as captured by a DOM selection on the post's
 * rendered HTML) in the post's markdown source, returning the markdown
 * substring that corresponds to the same content. Returns null if the
 * rendered quote can't be located.
 *
 * Why we need this: DOM selections strip inline markdown markers (`**`, `_`,
 * `` ` ``, `~`), so a quote that spans across a `<strong>...</strong>` boundary
 * is a contiguous string in rendered form but a discontiguous one in markdown
 * (the asterisks interrupt it). Plain `markdown.indexOf(renderedQuote)` fails
 * for such quotes.
 *
 * Approach: project the markdown onto its plain-text view via
 * `markdownQuoteToPlainText` while preserving a 1:1 character-position mapping
 * back to the markdown source (greedy two-pointer alignment). Find the
 * rendered quote in the plain text and slice the corresponding markdown range.
 * The returned markdown substring may include orphan markers (e.g. a closing
 * `**` with no opener) — that's intentional, the caller uses it for substring
 * matching only, not for re-rendering.
 */
export function findRenderedQuoteInMarkdown(
  markdown: string,
  renderedQuote: string,
): { markdownQuote: string; mdStart: number; mdEnd: number } | null {
  if (renderedQuote.length === 0) return null;
  const plainText = markdownQuoteToPlainText(markdown);
  const startInPlain = plainText.indexOf(renderedQuote);
  if (startInPlain === -1) return null;

  // Two-pointer walk: advance through markdown, matching characters against
  // plainText. Markers are skipped automatically because `markdownQuoteToPlainText`
  // dropped them. mdStart is captured when we reach the quote's first char;
  // mdEnd is one past the last char.
  let mdIdx = 0;
  for (let plainIdx = 0; plainIdx < startInPlain; plainIdx++) {
    while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[plainIdx]) mdIdx++;
    if (mdIdx === markdown.length) return null;
    mdIdx++;
  }
  while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[startInPlain]) mdIdx++;
  if (mdIdx === markdown.length) return null;
  const mdStart = mdIdx;
  mdIdx++;

  for (let plainIdx = startInPlain + 1; plainIdx < startInPlain + renderedQuote.length; plainIdx++) {
    while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[plainIdx]) mdIdx++;
    if (mdIdx === markdown.length) return null;
    mdIdx++;
  }
  const mdEnd = mdIdx;
  return { markdownQuote: markdown.slice(mdStart, mdEnd), mdStart, mdEnd };
}

// Sentinel that brackets a math span's index while the surrounding prose is
// rendered through markdown-it. U+E000 is a private-use character markdown-it
// treats as ordinary text and never transforms. The index makes restoration
// position-independent: if markdown-it drops a placeholder (e.g. a math span
// that landed in a link href, which renders to no visible text), the surviving
// placeholders still restore to their own equations rather than shifting onto
// the wrong ones.
const MATH_PLACEHOLDER_SENTINEL = String.fromCharCode(0xE000);
function mathPlaceholder(index: number): string {
  return MATH_PLACEHOLDER_SENTINEL + index + MATH_PLACEHOLDER_SENTINEL;
}
const MATH_PLACEHOLDER_REGEXP = new RegExp(
  MATH_PLACEHOLDER_SENTINEL + "(\\d+)" + MATH_PLACEHOLDER_SENTINEL,
  "g",
);

// Project an agent-supplied markdown quote to the rendered plaintext it
// represents, via markdown-it's CommonMark implementation. Preserves literal
// punctuation in content (e.g. `snake_case`, `2*3`, `` `code` ``) while
// stripping genuine emphasis/code wrappers.
//
// Math spans are swapped for placeholders before rendering and restored after:
// markdown-it would otherwise interpret markdown syntax *inside* an equation
// (`$a*b*$` as emphasis, `$a~b~c$` as a subscript, `\(x\)` as escaped parens)
// and corrupt it. The restored math is then run through
// `canonicalizeMathTokens` so every delimiter shape of an equation lands on
// one form.
export function markdownQuoteToRenderedPlainText(value: string): string {
  const spans = findMathSpansInMarkdown(value);
  const rawMath: string[] = [];
  let withPlaceholders = "";
  let cursor = 0;
  for (const span of spans) {
    withPlaceholders += value.slice(cursor, span.start) + mathPlaceholder(rawMath.length);
    rawMath.push(value.slice(span.start, span.end));
    cursor = span.end;
  }
  withPlaceholders += value.slice(cursor);

  const html = markdownToHtmlNoMath(withPlaceholders);
  const rendered = new JSDOM(html).window.document.body.textContent ?? "";

  // A placeholder markdown-it dropped (e.g. one that landed in an href) simply
  // does not appear; the rest still map to the right equations.
  const restored = rendered.replace(
    MATH_PLACEHOLDER_REGEXP,
    (_match: string, index: string) => rawMath[Number(index)] ?? "",
  );
  return canonicalizeMathTokens(restored);
}

/**
 * Parse markdown through the markdown-it pipeline and extract the rendered
 * plain text, producing a fast-reject filter string for
 * `buildNodeMarkdownMapForSubtree`. This handles all block-level and inline
 * markdown syntax (headings, blockquotes, lists, links, emphasis, etc.)
 * without hardcoding individual patterns.
 *
 * Math tokens are stripped first: `markdownToHtml` renders them inconsistently
 * (`\(…\)` in tests, `<mjx-container>` in production), and the node-text side
 * of the filter excludes math too — so the filter stays reliably math-blind on
 * both sides, and a block whose markdown starts with an equation is never
 * wrongly filtered out before the precise matcher runs.
 *
 * A consequence: a math-only quote yields an empty filter — see the KNOWN
 * PERFORMANCE ISSUE note on `buildNodeMarkdownMapForSubtree`.
 */
export function toPlainTextFilter(markdownQuote: string): string {
  const html = markdownToHtml(stripMathTokens(markdownQuote));
  const dom = new JSDOM(html);
  const textOnly = dom.window.document.body.textContent;
  return normalizeText(textOnly);
}

/**
 * Locate `plainQuote` — a `normalizeText`-normalized string (single-space
 * whitespace, canonical math tokens) — inside `rawLower` (raw text whose case
 * has already been folded outside math). Tolerates the two ways the strings
 * can legitimately differ:
 *
 *  - whitespace: a run of raw whitespace matches a single normalized space;
 *  - math delimiter shape: a math token matches by equation + inline-ness, so
 *    a raw `$$x$$` aligns with a canonical `$$\nx\n$$` even though the two
 *    differ in length — which a plain index-offset mapping cannot model.
 *
 * Returns the matched `[rawStart, rawEnd)` range in `rawLower`, or null. This
 * is the fallback for `findTextRangeInNodeByPlainQuote`, reached only after an
 * exact substring search has already failed, so the O(n·m) candidate scan
 * (each candidate alignment fails fast on the first mismatch) is acceptable.
 */
function alignNormalizedQuoteInRaw(
  rawLower: string,
  plainQuote: string,
): { rawStart: number, rawEnd: number } | null {
  // `plainQuote` comes from `normalizeText`, which folds typographic
  // punctuation (curly quotes, dashes) to ASCII; fold `rawLower` the same way
  // so the two char streams align. `foldPunctuation` is length-preserving and
  // never touches math delimiters, so the matched indices stay valid for the
  // caller's `combined` string and the math spans below are unaffected.
  const foldedRaw = foldPunctuation(rawLower);
  const rawSpanByStart = new Map<number, MathSpan>();
  for (const span of findMathSpansInMarkdown(foldedRaw)) {
    rawSpanByStart.set(span.start, span);
  }
  const quoteSpanByStart = new Map<number, MathSpan>();
  for (const span of findMathSpansInMarkdown(plainQuote)) {
    quoteSpanByStart.set(span.start, span);
  }

  const tryAlignFrom = (rawStart: number): number | null => {
    let r = rawStart;
    let q = 0;
    while (q < plainQuote.length) {
      const rawSpan = rawSpanByStart.get(r);
      const quoteSpan = quoteSpanByStart.get(q);
      if (
        rawSpan && quoteSpan
        && rawSpan.equation === quoteSpan.equation
        && rawSpan.inline === quoteSpan.inline
      ) {
        r = rawSpan.end;
        q = quoteSpan.end;
        continue;
      }
      if (r >= foldedRaw.length) return null;
      const rawIsWhitespace = /\s/.test(foldedRaw[r]);
      const quoteIsWhitespace = /\s/.test(plainQuote[q]);
      if (rawIsWhitespace && quoteIsWhitespace) {
        while (r < foldedRaw.length && /\s/.test(foldedRaw[r])) r++;
        q++;
        continue;
      }
      if (foldedRaw[r] !== plainQuote[q]) return null;
      r++;
      q++;
    }
    return r;
  };

  for (let start = 0; start < foldedRaw.length; start++) {
    // A normalized quote is trimmed, so it never starts on whitespace.
    if (/\s/.test(foldedRaw[start])) continue;
    const rawEnd = tryAlignFrom(start);
    if (rawEnd !== null) return { rawStart: start, rawEnd };
  }
  return null;
}

// One run of the matcher's `combined` projection. Math segments carry
// `equation`/`inline` so the post-collection pass can re-render `text` once
// the following segment — hence the digit-safety of the `$…$` form — is known.
type QuoteSegment =
  | { kind: "text", key: string, text: string }
  | { kind: "math", key: string, text: string, equation: string, inline: boolean };

function findTextRangeInNodeByPlainQuote(
  node: LexicalNode,
  markdownQuote: string
): { anchor: MarkdownSelectionPoint, focus: MarkdownSelectionPoint } | null {
  const plainQuoteRaw = markdownQuoteToRenderedPlainText(markdownQuote).trim();
  const plainQuote = normalizeText(plainQuoteRaw);
  if (!plainQuoteRaw || !plainQuote) {
    return null;
  }

  const segments: QuoteSegment[] = [];

  const appendSegments = (currentNode: LexicalNode) => {
    // Must precede the $isTextNode branch: FootnoteReferenceNode extends
    // TextNode with content `[N]`, but agents reading via the markdown API
    // see footnotes as `[^id]` and naturally omit them when quoting.
    if (currentNode.getType() === FOOTNOTE_ELEMENT_TYPES.footnoteReference) {
      return;
    }

    if ($isTextNode(currentNode)) {
      segments.push({
        kind: "text",
        key: currentNode.getKey(),
        text: currentNode.getTextContent(),
      });
      return;
    }

    if ($isMathNode(currentNode)) {
      const equation = currentNode.getEquation();
      if (equation) {
        const inline = currentNode.isInline();
        segments.push({
          kind: "math",
          key: currentNode.getKey(),
          // Provisional — re-rendered by the post-pass below once the
          // following segment is known (see `formatMathToken`'s digit rule).
          text: formatMathToken({ equation, inline }),
          equation,
          inline,
        });
      }
      return;
    }

    if ($isElementNode(currentNode)) {
      for (const child of currentNode.getChildren()) {
        appendSegments(child);
      }
    }
  };

  appendSegments(node);
  if (segments.length === 0) {
    return null;
  }

  // Re-render each math segment now that the following segment is known: an
  // inline equation immediately followed by a digit must take the digit-safe
  // `\(…\)` form (see `formatMathToken`), matching what the agent read API
  // emits and what `canonicalizeMathTokens` produces for the agent's quote.
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (segment.kind === "math") {
      segment.text = formatMathToken(
        { equation: segment.equation, inline: segment.inline },
        segments[i + 1]?.text[0],
      );
    }
  }

  const combined = segments.map((segment) => segment.text).join("");
  // `foldCaseOutsideMath` is length-preserving, so indices into `rawLower`
  // are also valid indices into `combined` (which `locatePoint` walks).
  const rawLower = foldCaseOutsideMath(combined);
  let rawStartIndex = rawLower.indexOf(foldCaseOutsideMath(plainQuoteRaw));
  let rawEndExclusive: number;
  if (rawStartIndex === -1) {
    // The exact search failed — fall back to a whitespace- and math-delimiter-
    // tolerant alignment of the normalized quote against the raw text. This
    // covers a quote whose whitespace differs from the document's, and a
    // document whose text literally contains math-delimiter characters in a
    // non-canonical shape, where `combined` and the canonical `plainQuote`
    // disagree on a token's length.
    const aligned = alignNormalizedQuoteInRaw(rawLower, plainQuote);
    if (!aligned) {
      return null;
    }
    rawStartIndex = aligned.rawStart;
    rawEndExclusive = aligned.rawEnd;
  } else {
    rawEndExclusive = rawStartIndex + plainQuoteRaw.length;
  }
  // `isFocus` distinguishes the selection's end (focus) from its start
  // (anchor); it decides which side of a math token a boundary that lands on
  // it falls on.
  const locatePoint = (rawIndex: number, isFocus: boolean): MarkdownSelectionPoint | null => {
    // First pass: prefer a text segment. A position at the boundary between a
    // text and a math segment belongs to the text side, keeping the selection
    // point a precise text offset.
    let cursor = 0;
    for (const segment of segments) {
      const segmentStart = cursor;
      const segmentEnd = cursor + segment.text.length;
      if (segment.kind === "text" && rawIndex >= segmentStart && rawIndex <= segmentEnd) {
        return { key: segment.key, offset: rawIndex - segmentStart, type: "text" };
      }
      cursor = segmentEnd;
    }
    // Second pass: the position is in or on a math segment with no adjacent
    // text on the relevant side. A MathNode is atomic (no internal text
    // offsets), so emit an element point on its parent — the equation is
    // included in or excluded from the range as a whole.
    cursor = 0;
    for (const segment of segments) {
      const segmentStart = cursor;
      const segmentEnd = cursor + segment.text.length;
      if (segment.kind === "math" && rawIndex >= segmentStart && rawIndex <= segmentEnd) {
        const mathNode = $getNodeByKey(segment.key);
        const parent = mathNode?.getParent();
        if (!mathNode || !parent) return null;
        const mathIndex = mathNode.getIndexWithinParent();
        // focus: ends before the math only if exactly at its start, else after.
        // anchor: starts after the math only if exactly at its end, else before.
        const offset = isFocus
          ? (rawIndex === segmentStart ? mathIndex : mathIndex + 1)
          : (rawIndex === segmentEnd ? mathIndex + 1 : mathIndex);
        return { key: parent.getKey(), offset, type: "element" };
      }
      cursor = segmentEnd;
    }
    return null;
  };

  const anchor = locatePoint(rawStartIndex, false);
  const focus = locatePoint(rawEndExclusive, true);
  if (!anchor || !focus) {
    return null;
  }

  return {
    anchor,
    focus,
  };
}

function serializeNodeSubtreeToMarkdown(node: LexicalNode, editor: LexicalEditor): string {
  if ($isTextNode(node)) {
    return node.getTextContent();
  }
  if (!$isElementNode(node) && !$isDecoratorNode(node)) {
    return node.getTextContent();
  }

  const rootChildren = node.getType() === "root" && $isElementNode(node)
    ? node.getChildren().map((child) => exportNodeToJSONRecursive(child))
    : [exportNodeToJSONRecursive(node)];
  const state = {
    root: {
      children: rootChildren,
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
  const parsedState = editor.parseEditorState(JSON.stringify(state));
  editor.setEditorState(parsedState);

  const html = withDomGlobals(() => {
    let generated = "";
    editor.getEditorState().read(() => {
      generated = $generateHtmlFromNodes(editor, null);
    });
    return generated;
  });

  return htmlToMarkdown(html);
}

// Produces the node-text side of `buildNodeMarkdownMapForSubtree`'s fast-reject
// filter. Footnote references are excluded so a paragraph containing one isn't
// filtered out before the matcher runs (agents quote `[^id]`, not `[N]`).
// MathNodes contribute no text content — math is excluded from this filter on
// both sides (`toPlainTextFilter` strips math tokens too), keeping the filter
// reliably math-blind.
function getTextContentForQuoteMatching(node: LexicalNode): string {
  if (node.getType() === FOOTNOTE_ELEMENT_TYPES.footnoteReference) {
    return "";
  }
  if ($isTextNode(node)) {
    return node.getTextContent();
  }
  if ($isElementNode(node)) {
    return node.getChildren().map(getTextContentForQuoteMatching).join("");
  }
  return node.getTextContent();
}

const HIDDEN_FROM_AGENT_EDITS_NODE_TYPES = new Set<string>([QUERY_INPUT_NODE_TYPE]);

function isHiddenFromAgentEdits(node: LexicalNode): boolean {
  // Hidden node types are always elements; cheap pre-check skips the
  // getType() virtual dispatch for every TextNode in the document.
  return $isElementNode(node) && HIDDEN_FROM_AGENT_EDITS_NODE_TYPES.has(node.getType());
}

function collectSubtreeNodes(rootNode: LexicalNode): Array<{ node: LexicalNode, depth: number }> {
  const collected: Array<{ node: LexicalNode, depth: number }> = [];

  const visit = (node: LexicalNode, depth: number) => {
    // Always include the root itself even if its type is hidden — callers
    // pass a meaningful root (often the document root) and need at least
    // one entry to map against.
    if (node !== rootNode && isHiddenFromAgentEdits(node)) return;
    collected.push({ node, depth });
    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        visit(child, depth + 1);
      }
    }
  };

  visit(rootNode, 0);
  return collected;
}

/**
 * Build markdown serializations for every node in the subtree rooted at rootNodeKey.
 * Must be called inside a Lexical read/update context.
 *
 * When `textFilter` is provided, nodes whose plain-text content clearly cannot
 * contain the filter string are skipped, avoiding expensive markdown serialization
 * (JSDOM + Turndown) for non-matching nodes.
 *
 * KNOWN PERFORMANCE ISSUE (deliberately not fixed): a math-only quote — e.g.
 * `$x^2$` with no surrounding prose — produces an empty `textFilter`, because
 * `toPlainTextFilter` strips math tokens. An empty filter disables the
 * fast-reject below, so every element node in the subtree is fully serialized
 * (`parseEditorState` + `$generateHtmlFromNodes` + Turndown). The cost scales
 * with element-node count: negligible on short posts, up to roughly a second
 * on long ones, a timeout risk only on book-length documents. It is one-time
 * per request and not a correctness issue, and bare-equation quotes are
 * uncommon (agents are steered to quote phrases with surrounding context), so
 * it is left as-is. A fix would skip non-root nodes whose subtree contains no
 * MathNode when the quote is math-only.
 */
export function buildNodeMarkdownMapForSubtree(rootNodeKey: string, textFilter?: string): NodeMarkdownMapResult {
  const rootNode = $getNodeByKey(rootNodeKey);
  if (!rootNode) {
    return { entries: [], byKey: new Map() };
  }

  const reusableEditor = createHeadlessEditor("MapMarkdownToLexical");
  const entries: NodeMarkdownEntry[] = [];
  const byKey = new Map<string, NodeMarkdownEntry>();
  for (const { node, depth } of collectSubtreeNodes(rootNode)) {
    if (textFilter) {
      const textContent = normalizeText(getTextContentForQuoteMatching(node));
      // Skip nodes whose text content is non-empty and clearly doesn't contain
      // the filter. Nodes with empty text content (e.g. decorator/math nodes)
      // are kept to avoid false negatives.
      if (textContent && !textContent.includes(textFilter)) {
        continue;
      }
    }
    const entry: NodeMarkdownEntry = {
      key: node.getKey(),
      type: node.getType(),
      depth,
      markdown: serializeNodeSubtreeToMarkdown(node, reusableEditor),
    };
    entries.push(entry);
    byKey.set(entry.key, entry);
  }
  return { entries, byKey };
}

/**
 * Locate a top-level (or list-item) node whose markdown / plain-text content
 * starts with the given prefix, for block-level operations like deleteBlock.
 *
 * For each top-level child of root:
 *   - If the child is a list, descend into its list-item children and try to
 *     match each item individually. Returns the list item if matched, so the
 *     caller can operate on a single item rather than the whole list (the
 *     agent API previously matched the list-as-a-whole on its first item's
 *     text and then deleted the entire list).
 *   - Otherwise try to match the child itself (paragraphs, tables, headings,
 *     spoiler blocks, …). Tables are matched as a top-level block — there's
 *     no useful "delete a single cell" semantics in markdown.
 *
 * Must be called inside a Lexical read/update context.
 */
export function findBlockToOperateOnByPrefix({
  rootChildren,
  prefix,
  mapResult,
  textFilter,
}: {
  rootChildren: LexicalNode[]
  prefix: string
  mapResult: NodeMarkdownMapResult
  textFilter: string
}): LexicalNode | null {
  const matches = (node: LexicalNode): boolean => {
    const markdown = mapResult.byKey.get(node.getKey())?.markdown;
    if (markdown && paragraphMarkdownStartsWith(markdown, prefix)) return true;
    const text = node.getTextContent();
    if (plainTextStartsWith(text, prefix)) return true;
    if (textFilter.length > 0 && normalizeText(text).startsWith(textFilter)) return true;
    return false;
  };

  for (const child of rootChildren) {
    if (isHiddenFromAgentEdits(child)) continue;
    if ($isListNode(child)) {
      for (const item of child.getChildren()) {
        if (matches(item)) return item;
      }
      // No list-item matched: don't fall through to matching the list as a
      // whole, since that would just match the first item's text and delete
      // the entire list.
      continue;
    }
    if (matches(child)) return child;
  }
  return null;
}

function createElementRangeAroundNode(node: LexicalNode): MarkdownQuoteSelectionResult {
  const parent = node.getParent();
  if (!parent) {
    return { found: false, reason: "Matched node has no parent for range selection." };
  }

  const indexWithinParent = node.getIndexWithinParent();
  return {
    found: true,
    matchedNodeKey: node.getKey(),
    matchedNodeType: node.getType(),
    anchor: {
      key: parent.getKey(),
      offset: indexWithinParent,
      type: "element",
    },
    focus: {
      key: parent.getKey(),
      offset: indexWithinParent + 1,
      type: "element",
    },
  };
}

/**
 * Locate a markdown quote in a subtree and return a Lexical-compatible selection range.
 * Must be called inside a Lexical read/update context.
 */
export function locateMarkdownQuoteSelectionInSubtree({
  rootNodeKey,
  markdownQuote,
  mapResult,
}: {
  rootNodeKey: string
  markdownQuote: string
  mapResult?: NodeMarkdownMapResult
}): MarkdownQuoteSelectionResult {
  const normalizedQuote = normalizeText(markdownQuote);
  const normalizedQuoteMarkdownInsensitive = toPlainTextFilter(markdownQuote);
  const normalizedQuoteMarkerStyleInsensitive = normalizeForSemanticMatch(markdownQuote);
  if (!normalizedQuote) {
    return { found: false, reason: "Quote was empty after normalization." };
  }

  const plainTextFilter = toPlainTextFilter(markdownQuote);
  const mapping = mapResult ?? buildNodeMarkdownMapForSubtree(rootNodeKey, plainTextFilter);
  if (mapping.entries.length === 0) {
    return { found: false, reason: "No nodes found for subtree." };
  }

  const candidates = mapping.entries
    .filter(({ markdown }) => {
      const normalizedCandidate = normalizeText(markdown);
      if (normalizedCandidate.includes(normalizedQuote)) {
        return true;
      }
      const normalizedCandidateMarkerStyleInsensitive = normalizeForSemanticMatch(markdown);
      if (normalizedCandidateMarkerStyleInsensitive.includes(normalizedQuoteMarkerStyleInsensitive)) {
        return true;
      }
      if (!normalizedQuoteMarkdownInsensitive) {
        return false;
      }
      return toPlainTextFilter(markdown).includes(normalizedQuoteMarkdownInsensitive);
    })
    .sort((a, b) => b.depth - a.depth || a.markdown.length - b.markdown.length);

  if (candidates.length === 0) {
    const rootNode = $getNodeByKey(rootNodeKey);
    if (rootNode) {
      const fallbackRange = findTextRangeInNodeByPlainQuote(rootNode, markdownQuote);
      if (fallbackRange) {
        return {
          found: true,
          matchedNodeKey: rootNode.getKey(),
          matchedNodeType: rootNode.getType(),
          matchedMarkdown: "",
          anchor: fallbackRange.anchor,
          focus: fallbackRange.focus,
        };
      }
    }
  }

  for (const candidate of candidates) {
    const node = $getNodeByKey(candidate.key);
    if (!node) {
      continue;
    }

    if ($isTextNode(node)) {
      const rawNodeText = node.getTextContent();
      const textMatchIdx = rawNodeText.toLowerCase().indexOf(markdownQuote.toLowerCase());
      if (textMatchIdx >= 0) {
        return {
          found: true,
          matchedNodeKey: node.getKey(),
          matchedNodeType: node.getType(),
          matchedMarkdown: candidate.markdown,
          anchor: {
            key: node.getKey(),
            offset: textMatchIdx,
            type: "text",
          },
          focus: {
            key: node.getKey(),
            offset: textMatchIdx + markdownQuote.length,
            type: "text",
          },
        };
      }

      const markdownInsensitiveQuote = stripSimpleMarkdownPunctuation(markdownQuote);
      const markdownInsensitiveMatchIdx = markdownInsensitiveQuote
        ? rawNodeText.toLowerCase().indexOf(markdownInsensitiveQuote.toLowerCase())
        : -1;
      if (markdownInsensitiveMatchIdx >= 0) {
        return {
          found: true,
          matchedNodeKey: node.getKey(),
          matchedNodeType: node.getType(),
          matchedMarkdown: candidate.markdown,
          anchor: {
            key: node.getKey(),
            offset: markdownInsensitiveMatchIdx,
            type: "text",
          },
          focus: {
            key: node.getKey(),
            offset: markdownInsensitiveMatchIdx + markdownInsensitiveQuote.length,
            type: "text",
          },
        };
      }
    }

    const plainRange = findTextRangeInNodeByPlainQuote(node, markdownQuote);
    if (plainRange) {
      return {
        found: true,
        matchedNodeKey: node.getKey(),
        matchedNodeType: node.getType(),
        matchedMarkdown: candidate.markdown,
        anchor: plainRange.anchor,
        focus: plainRange.focus,
      };
    }

    const normalizedCandidate = normalizeForSemanticMatch(candidate.markdown);
    if (normalizedCandidate === normalizedQuote || $isMathNode(node)) {
      const elementRange = createElementRangeAroundNode(node);
      if (elementRange.found) {
        return {
          ...elementRange,
          matchedMarkdown: candidate.markdown,
        };
      }
    }
  }

  return { found: false, reason: "No markdown quote match found in subtree map." };
}

/**
 * Convenience wrapper for callers holding an editor object.
 */
export function locateMarkdownQuoteSelectionInEditor({
  editor,
  rootNodeKey,
  markdownQuote,
}: {
  editor: LexicalEditor
  rootNodeKey: string
  markdownQuote: string
}): MarkdownQuoteSelectionResult {
  let result: MarkdownQuoteSelectionResult = { found: false, reason: "Editor read did not run." };
  editor.getEditorState().read(() => {
    const plainTextFilter = toPlainTextFilter(markdownQuote);
    const mapResult = buildNodeMarkdownMapForSubtree(rootNodeKey, plainTextFilter);
    result = locateMarkdownQuoteSelectionInSubtree({ rootNodeKey, markdownQuote, mapResult });
  });
  return result;
}
