import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import { $appendImportedFootnotes, splitImportedFootnotes } from "./importFootnotes";
import {
  $createRangeSelection,
  $isBlockElementNode,
  $isDecoratorNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isRootNode,
  $isTextNode,
  $setSelection,
  type LexicalEditor,
  type LexicalNode,
  type PointType,
  type TextNode,
} from "lexical";
import {
  markdownQuoteToPlainText,
  type MarkdownSelectionPoint,
} from "./mapMarkdownToLexical";
import { findMathSpansInMarkdown } from "@/lib/utils/mathTokens";
import { randomId } from "@/lib/random";
import { sanitize } from "@/lib/utils/sanitize";
import { renderAgentMarkdownToHtml, splitParagraphAtDisplayMath } from "./editorAgentUtil";
import {
  normalizeTracked,
  resolveRawIndexToPoint,
  type LocatedQuoteRange,
} from "./textIndexQuoteLocator";
import type MarkdownIt from "markdown-it";
import type { Token } from "markdown-it/index.js";

function $htmlToNodes(editor: LexicalEditor, html: string): LexicalNode[] {
  const dom = new JSDOM(html);
  try {
    return $generateNodesFromDOM(editor, dom.window.document);
  } finally {
    dom.window.close();
  }
}

/**
 * Convert pre-rendered HTML into inline LexicalNodes suitable for insertion
 * within an existing paragraph. When the HTML produces a single wrapping
 * paragraph (the typical markdown-to-HTML output for an inline fragment),
 * its inline children are extracted so they stay within the surrounding
 * paragraph rather than starting a new one. Footnote sections are returned
 * separately at the end of the array for callers to attach after a successful edit.
 *
 * Must be called inside a Lexical update context.
 */
export function $htmlToInlineNodes(editor: LexicalEditor, html: string): LexicalNode[] {
  const { contentNodes: nodes, footnoteSections } = splitImportedFootnotes($htmlToNodes(editor, html));
  if (nodes.length === 1 && $isElementNode(nodes[0])) {
    return [...nodes[0].getChildren(), ...footnoteSections];
  }
  return [...nodes, ...footnoteSections];
}

/**
 * Render markdown that replaces text within a block as inline nodes. It's
 * parsed as inline markdown only, so text that would start a block at the
 * start of a line (`-`, `9.`, `>`, `#`, an indent) stays text. And it's
 * imported as preformatted text, which is how Lexical exports text, so that
 * Lexical keeps its whitespace rather than collapsing it and trimming it at
 * the fragment's edges.
 *
 * Inline footnotes (`^[…]`) are the one block the inline parser emits: their
 * definitions follow the inline content as a footnote section. That section
 * is rendered outside the preformatted span, where the newlines between its
 * tags would become line breaks, and is returned at the end of the array for
 * callers to attach after a successful edit.
 *
 * Must be called inside a Lexical update context.
 */
export function $inlineMarkdownToNodes(
  editor: LexicalEditor,
  markdown: string,
  markdownIt: MarkdownIt,
): LexicalNode[] {
  if (markdown.length === 0) return [];
  const env = { docId: randomId() };
  const tokens = markdownIt.parseInline(markdown, env);
  const footnoteBlockStart = tokens.findIndex((token) => token.type === "footnote_block_open");
  const inlineTokens = footnoteBlockStart === -1 ? tokens : tokens.slice(0, footnoteBlockStart);
  const footnoteTokens = footnoteBlockStart === -1 ? [] : tokens.slice(footnoteBlockStart);
  for (const token of inlineTokens) {
    rewriteBreaksForPreformattedText(token.children ?? []);
  }
  const inlineHtml = sanitize(markdownIt.renderer.render(inlineTokens, markdownIt.options, env));
  const footnoteHtml = sanitize(markdownIt.renderer.render(footnoteTokens, markdownIt.options, env));
  return $htmlToNodes(editor, `<span style="white-space: pre-wrap">${inlineHtml}</span>${footnoteHtml}`);
}

/**
 * Rewrite an inline token stream's line breaks for import as preformatted
 * text, where every newline is a line break. A soft break becomes the space
 * markdown renders it as, and a hard break just its `<br>` (markdown-it
 * follows it with a newline). A blank line, a paragraph break that inline
 * content can't hold, shows up as two breaks in a row, which both become
 * `<br>`s.
 */
function rewriteBreaksForPreformattedText(children: Token[]): void {
  const isBreak = children.map((token) => token.type === "softbreak" || token.type === "hardbreak");
  for (let i = 0; i < children.length; i++) {
    if (!isBreak[i]) continue;
    const token = children[i];
    if (token.type === "softbreak" && !isBreak[i - 1] && !isBreak[i + 1]) {
      token.type = "text";
      token.content = " ";
    } else {
      token.type = "html_inline";
      token.content = "<br>";
    }
  }
}

/**
 * The text formatting (bold, italic, code, ...) that a replacement for this
 * selection should inherit: the format bits shared by every text node the
 * selection covers. A quote written as plain text (no markdown markers) says
 * nothing about formatting, so a plain replacement of words inside an italic
 * span should stay italic. A quote that spells out markers (e.g. `*foo*`)
 * makes formatting explicit, so nothing is inherited and the replacement's own
 * markdown decides it — that's how an agent removes formatting.
 *
 * Must be called inside a Lexical read/update context, before the selection
 * is mutated.
 */
export function $getInheritedTextFormat(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
  quote: string,
): number {
  if (markdownQuoteToPlainText(quote) !== quote) return 0;
  const selection = $createRangeSelection();
  selection.anchor.set(anchor.key, anchor.offset, anchor.type);
  selection.focus.set(focus.key, focus.offset, focus.type);
  const collapsed = selection.isCollapsed();
  const coveredTextNodes = selection.getNodes().filter((node): node is TextNode => {
    if (!$isTextNode(node)) return false;
    if (collapsed) return true;
    // A boundary node the selection only touches at its edge isn't covered.
    if (anchor.type === "text" && node.getKey() === anchor.key && anchor.offset >= node.getTextContentSize()) return false;
    if (focus.type === "text" && node.getKey() === focus.key && focus.offset <= 0) return false;
    return true;
  });
  if (coveredTextNodes.length === 0) return 0;
  return coveredTextNodes.reduce((format, node) => format & node.getFormat(), coveredTextNodes[0].getFormat());
}

/**
 * Replace the content between two selection points with pre-parsed nodes.
 * Empty `nodes` is a pure deletion, and identical points a pure insertion,
 * which goes where Lexical would put text typed at that point (see
 * `$insertAtCaret`). A replacement goes where the replaced content began,
 * inside any link or mark that content started in (see `$replaceRange`).
 * Nodes that include blocks (a multi-paragraph replacement) go through
 * Lexical's paste path instead, which splits the surrounding block around
 * them.
 *
 * Must be called inside a Lexical update context.
 */
export function $applyEditAtSelection({
  anchor,
  focus,
  nodes,
}: {
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  nodes: LexicalNode[]
}): boolean {
  const selection = $createRangeSelection();
  selection.anchor.set(anchor.key, anchor.offset, anchor.type);
  selection.focus.set(focus.key, focus.offset, focus.type);
  // Lexical's selection editing re-reads the editor's current selection
  // partway through, so the range has to be the current selection rather
  // than one left over from an earlier update (as in a headless editor that
  // just loaded its content). Clear it afterwards rather than leave it
  // pointing into replaced content.
  $setSelection(selection);
  try {
    if (nodes.length === 0) {
      selection.removeText();
      return true;
    }
    if (nodes.some($isBlockElementNode)) {
      selection.insertNodes(nodes);
      return true;
    }
    if (selection.isCollapsed()) {
      return $insertAtCaret(anchor, nodes);
    }
    return $replaceRange(anchor, focus, nodes);
  } finally {
    $setSelection(null);
  }
}

/**
 * The nearest block-level node containing a selection point: the first
 * non-inline element or decorator ancestor (a paragraph inside a blockquote,
 * a list item, a top-level display equation), not the top-level element.
 * Narrowing renders the replacement as inline nodes, so it only applies to
 * ranges within one such block. An element point keyed on an element
 * resolves to the child the boundary sits against: before it for an anchor,
 * after it for a focus.
 */
function $blockOfPoint(point: MarkdownSelectionPoint, isFocus: boolean): LexicalNode | null {
  let node = $getNodeByKey(point.key);
  if (!node) return null;
  if (point.type === "element" && $isElementNode(node)) {
    const children = node.getChildren();
    const index = Math.max(0, Math.min(isFocus ? point.offset - 1 : point.offset, children.length - 1));
    node = children[index] ?? node;
  }
  let current: LexicalNode | null = node;
  while (current && !$isRootNode(current)) {
    const isBlock = ($isElementNode(current) || $isDecoratorNode(current)) && !current.isInline();
    if (isBlock) return current;
    current = current.getParent();
  }
  return null;
}

/** Whether both selection points sit inside the same block-level node. */
function $pointsShareBlock(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): boolean {
  const anchorBlock = $blockOfPoint(anchor, false);
  const focusBlock = $blockOfPoint(focus, true);
  return !!anchorBlock && !!focusBlock && anchorBlock.getKey() === focusBlock.getKey();
}

/**
 * Insert nodes at a point where Lexical would put text typed there: inside
 * the text node the point is in, except at the edge of an inline element
 * that doesn't take text there (a link, a comment mark), where they go
 * outside it. Their text also gets the formatting typed text would, that of
 * the text the point is in: a narrowed replacement's markdown covers only the
 * inserted text, so it can't carry the formatting around it.
 */
function $insertAtCaret(point: MarkdownSelectionPoint, nodes: LexicalNode[]): boolean {
  const caretNode = $getNodeByKey(point.key);
  if (point.type === "element") {
    if (!$isElementNode(caretNode)) return false;
    caretNode.splice(point.offset, 0, nodes);
    return true;
  }
  if (!$isTextNode(caretNode)) return false;

  for (const node of nodes) {
    $addTextFormat(node, caretNode.getFormat());
  }
  if (point.offset === 0) {
    const next = $outsideInlineEdge(caretNode, "start");
    for (const node of nodes) {
      next.insertBefore(node);
    }
  } else if (point.offset >= caretNode.getTextContentSize()) {
    let previous = $outsideInlineEdge(caretNode, "end");
    for (const node of nodes) {
      previous.insertAfter(node);
      previous = node;
    }
  } else {
    const [, next] = caretNode.splitText(point.offset);
    for (const node of nodes) {
      next.insertBefore(node);
    }
  }
  return true;
}

/**
 * The node to insert next to at an edge of `node`: the outermost inline
 * element that `node` starts (or ends) and that doesn't take text inserted
 * there, or `node` itself if there's none.
 */
function $outsideInlineEdge(node: LexicalNode, edge: "start" | "end"): LexicalNode {
  let current = node;
  for (let parent = current.getParent(); parent?.isInline(); parent = current.getParent()) {
    const atEdge = edge === "start" ? !current.getPreviousSibling() : !current.getNextSibling();
    const takesText = edge === "start" ? parent.canInsertTextBefore() : parent.canInsertTextAfter();
    if (!atEdge || takesText) break;
    current = parent;
  }
  return current;
}

/** Add text formatting to every text node in `node`'s subtree. */
export function $addTextFormat(node: LexicalNode, format: number): void {
  if ($isTextNode(node)) {
    node.setFormat(node.getFormat() | format);
  } else if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      $addTextFormat(child, format);
    }
  }
}

/**
 * Replace a non-empty range with inline nodes, inserting them where the
 * range starts, inside any link or mark its content started in: before the
 * first selected node. The selected nodes are then removed with Lexical's
 * range removal, which also merges the blocks at the range's ends when it
 * spans several. Inserting first means a link or mark whose whole content is
 * replaced is never left empty, which would remove it.
 */
function $replaceRange(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
  nodes: LexicalNode[],
): boolean {
  const selected = $splitAtRangeEnds(anchor, focus);
  if (!selected) return false;

  for (const node of nodes) {
    selected.first.insertBefore(node);
  }
  const removal = $createRangeSelection();
  $setPointAtNodeEdge(removal.anchor, selected.first, "start");
  $setPointAtNodeEdge(removal.focus, selected.last, "end");
  $setSelection(removal);
  removal.removeText();
  return true;
}

function $setPointAtNodeEdge(point: PointType, node: LexicalNode, edge: "start" | "end"): void {
  if ($isTextNode(node)) {
    point.set(node.getKey(), edge === "start" ? 0 : node.getTextContentSize(), "text");
  } else {
    const index = node.getIndexWithinParent() + (edge === "start" ? 0 : 1);
    point.set(node.getParentOrThrow().getKey(), index, "element");
  }
}

/**
 * Resolve a selection anchor to the first node it selects. A text anchor may
 * `splitText` so the selection starts on a clean node boundary; an element
 * anchor `{parent, offset}` selects from `parent`'s child at `offset`.
 */
function $resolveFirstSelectedNode(anchor: MarkdownSelectionPoint): LexicalNode | null {
  if (anchor.type === "element") {
    const parent = $getNodeByKey(anchor.key);
    if (!$isElementNode(parent)) return null;
    return parent.getChildren()[anchor.offset] ?? null;
  }
  const anchorNode = $getNodeByKey(anchor.key);
  if (!$isTextNode(anchorNode)) return null;
  if (anchor.offset === 0) return anchorNode;
  if (anchor.offset >= anchorNode.getTextContent().length) return anchorNode.getNextSibling();
  return anchorNode.splitText(anchor.offset)[1] ?? null;
}

/**
 * Resolve a selection focus to the last node it selects. An element focus
 * `{parent, offset}` selects up to `parent`'s child at `offset - 1`.
 */
function $resolveLastSelectedNode(focus: MarkdownSelectionPoint): LexicalNode | null {
  if (focus.type === "element") {
    const parent = $getNodeByKey(focus.key);
    if (!$isElementNode(parent)) return null;
    return parent.getChildren()[focus.offset - 1] ?? null;
  }
  const focusNode = $getNodeByKey(focus.key);
  if (!$isTextNode(focusNode)) return null;
  if (focus.offset >= focusNode.getTextContent().length) return focusNode;
  if (focus.offset <= 0) return focusNode.getPreviousSibling();
  return focusNode.splitText(focus.offset)[0];
}

/**
 * Split boundary text nodes so that a range covers whole nodes, and return
 * the first and last of them. They can have different parents (a range from
 * plain text into a link) or blocks. A range can also end on either side of
 * an atomic node like a MathNode (selected via an element-type point).
 */
function $splitAtRangeEnds(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): { first: LexicalNode, last: LexicalNode } | null {
  if (anchor.type === "text" && focus.type === "text" && anchor.key === focus.key) {
    const node = $getNodeByKey(anchor.key);
    if (!$isTextNode(node)) return null;
    // When anchor.offset > 0, splitText produces [before, selected, ...];
    // otherwise there is no "before" part.
    const selected = node.splitText(anchor.offset, focus.offset)[anchor.offset > 0 ? 1 : 0];
    return selected ? { first: selected, last: selected } : null;
  }
  // Resolve element-typed points first: they are plain child-index lookups,
  // whereas resolving a text point may `splitText` and shift sibling indices,
  // which would invalidate a not-yet-resolved element point's offset.
  let first = anchor.type === "element" ? $resolveFirstSelectedNode(anchor) : null;
  let last = focus.type === "element" ? $resolveLastSelectedNode(focus) : null;
  if (anchor.type === "text") first = $resolveFirstSelectedNode(anchor);
  if (focus.type === "text") last = $resolveLastSelectedNode(focus);
  return first && last ? { first, last } : null;
}

interface TextSpan {
  start: number
  /** Exclusive. */
  end: number
}

/**
 * A backslash escape: a backslash before ASCII punctuation, or before a
 * newline (a hard break).
 */
const MARKDOWN_ESCAPE = /\\[!-/:-@[-`{-~\n]/g;

/** A footnote reference or definition (`[^id]`), or an inline footnote (`^[…]`). */
const MARKDOWN_FOOTNOTE = /\[\^|\^\[/;

/**
 * Spans of markdown that narrowing mustn't split. A math token's fragment
 * can't be located against the document's atomic MathNode. A piece of a
 * backslash escape renders differently from the whole: `\.` is a `.`, but a
 * lone `\` is a backslash. And markdown-it links a bare URL, so a piece of
 * one would link to the wrong address.
 */
function findUnsplittableSpans(markdown: string, markdownIt: MarkdownIt): TextSpan[] {
  const escapes = Array.from(markdown.matchAll(MARKDOWN_ESCAPE), (match) => ({
    start: match.index,
    end: match.index + match[0].length,
  }));
  const urls = (markdownIt.linkify.match(markdown) ?? []).map((match) => ({
    start: match.index,
    end: match.lastIndex,
  }));
  return [...findMathSpansInMarkdown(markdown), ...escapes, ...urls];
}

/**
 * Pull a common-prefix boundary back out of any unsplittable span, to the
 * span's start. The boundary is at the same index in the quote and the
 * replacement, so `spans` holds both of theirs. Moving it can land it inside
 * another span, so this repeats until it's outside all of them.
 */
function snapPrefixOutOfSpans(prefixLen: number, spans: TextSpan[]): number {
  let result = prefixLen;
  let moved = true;
  while (moved) {
    moved = false;
    for (const span of spans) {
      if (result > span.start && result < span.end) {
        result = span.start;
        moved = true;
      }
    }
  }
  return result;
}

/**
 * Pull a common-suffix boundary forward out of any unsplittable span, to the
 * span's end, shrinking the suffix. In each text the boundary sits at
 * `length - suffixLen`. Like `snapPrefixOutOfSpans`, this repeats until the
 * boundary is outside all of the spans.
 */
function snapSuffixOutOfSpans(
  suffixLen: number,
  texts: Array<{ length: number, spans: TextSpan[] }>,
): number {
  let result = suffixLen;
  let moved = true;
  while (moved) {
    moved = false;
    for (const { length, spans } of texts) {
      for (const span of spans) {
        const boundary = length - result;
        if (boundary > span.start && boundary < span.end) {
          result = length - span.end;
          moved = true;
        }
      }
    }
  }
  return result;
}

/**
 * Try to compute narrowed anchor/focus/replacement by stripping the common
 * markdown prefix/suffix between quote and replacement. Returns null if
 * narrowing isn't applicable (identical plain text, no common affixes, etc.),
 * in which case the caller should use the original anchor/focus/replacement.
 */
export function $computeNarrowing(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
  quote: string,
  replacement: string,
  range: LocatedQuoteRange | undefined,
  markdownIt: MarkdownIt,
): {
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  quote: string
  replacement: string
} | null {
  if (!range) return null;
  // Footnote definitions are nonlocal: narrowing can split a reference from
  // its definition, or the `^` of an inline footnote from its brackets.
  if (MARKDOWN_FOOTNOTE.test(quote) || MARKDOWN_FOOTNOTE.test(replacement)) return null;
  // Narrowed replacements are rendered as inline nodes, which assumes a
  // single block's inline context; cross-block edits use the full range.
  if (!$pointsShareBlock(anchor, focus)) return null;

  const matchedText = range.projection.text.slice(range.rawStart, range.rawEnd);
  const quoteMapping = buildPlainToMarkdownMapping(quote);

  // Narrowing advances document positions by quote plain-text character
  // counts, which is only sound when the two texts correspond 1:1 — true
  // whenever the quote was taken verbatim from the read API. Quotes that
  // diverge from the document in length (typographic folding, marker-blind
  // matches over literal markers, spans across math tokens or footnote
  // references) fall back to the full range.
  if (quoteMapping.plainText.length !== matchedText.length) return null;

  // If the visible text is identical, the change is purely structural
  // (formatting, link URLs, etc.) — show the full range.
  if (markdownQuoteToPlainText(replacement) === matchedText) return null;

  // Compare at the markdown level so that formatting/syntax changes
  // prevent narrowing past them. Then pull each boundary out of any span
  // that a fragment can't split, such as a `$…$` or a bare URL.
  const rawAffixes = computeCommonPrefixSuffix(quote, replacement);
  const quoteSpans = findUnsplittableSpans(quote, markdownIt);
  const replacementSpans = findUnsplittableSpans(replacement, markdownIt);
  const mdPrefixLen = snapPrefixOutOfSpans(rawAffixes.prefixLen, [...quoteSpans, ...replacementSpans]);
  const mdSuffixLen = snapSuffixOutOfSpans(rawAffixes.suffixLen, [
    { length: quote.length, spans: quoteSpans },
    { length: replacement.length, spans: replacementSpans },
  ]);

  // Convert markdown offsets to plain-text character counts using the
  // quote's mapping (which has full regex context for links, math, etc.)
  const ptAdvance = countPlainTextInPrefix(quoteMapping.toMarkdown, mdPrefixLen);
  const ptRetreat = countPlainTextInSuffix(quoteMapping.toMarkdown, quote.length, mdSuffixLen);

  if (ptAdvance === 0 && ptRetreat === 0) return null;
  if (ptAdvance + ptRetreat > matchedText.length) return null;

  // Equal overall lengths still allow positional drift between the two
  // sides (e.g. whitespace collapsed at different offsets). Verify that the
  // narrowed slices agree under the matcher's own normalization before
  // trusting the boundaries.
  const narrowedDocText = matchedText.slice(ptAdvance, matchedText.length - ptRetreat);
  const narrowedQuotePlain = quoteMapping.plainText.slice(ptAdvance, quoteMapping.plainText.length - ptRetreat);
  if (normalizeTracked(narrowedDocText).text !== normalizeTracked(narrowedQuotePlain).text) return null;

  const anchorIndex = range.rawStart + ptAdvance;
  const focusIndex = range.rawEnd - ptRetreat;
  const narrowedAnchor = resolveRawIndexToPoint(range.projection, anchorIndex, false);
  // A narrowing that consumes the whole quote is a pure insertion: resolve
  // the collapsed boundary once so both points are identical.
  const narrowedFocus = anchorIndex === focusIndex
    ? narrowedAnchor
    : resolveRawIndexToPoint(range.projection, focusIndex, true);
  if (!narrowedAnchor || !narrowedFocus) return null;

  return {
    anchor: narrowedAnchor,
    focus: narrowedFocus,
    quote: quote.slice(mdPrefixLen, quote.length - mdSuffixLen),
    replacement: replacement.slice(mdPrefixLen, replacement.length - mdSuffixLen),
  };
}

/**
 * Compute the longest common prefix and suffix lengths between two strings.
 * The suffix is not allowed to overlap the prefix.
 */
function computeCommonPrefixSuffix(a: string, b: string): { prefixLen: number, suffixLen: number } {
  let prefixLen = 0;
  const minLen = Math.min(a.length, b.length);
  while (prefixLen < minLen && a[prefixLen] === b[prefixLen]) {
    prefixLen++;
  }

  let suffixLen = 0;
  const maxSuffixLen = minLen - prefixLen;
  while (suffixLen < maxSuffixLen && a[a.length - 1 - suffixLen] === b[b.length - 1 - suffixLen]) {
    suffixLen++;
  }

  return { prefixLen, suffixLen };
}

/**
 * Build a mapping from plain-text character indices to markdown character
 * indices. Uses a greedy two-pointer alignment between the plain text
 * (produced by markdownQuoteToPlainText) and the original markdown string.
 *
 * The returned `toMarkdown` array has length `plainText.length + 1`; the
 * last entry is a sentinel equal to `markdown.length`, used when no suffix
 * needs to be trimmed.
 */
function buildPlainToMarkdownMapping(markdown: string): { plainText: string, toMarkdown: number[] } {
  const plainText = markdownQuoteToPlainText(markdown);
  const toMarkdown: number[] = [];
  let mdIdx = 0;
  for (let plainIdx = 0; plainIdx < plainText.length; plainIdx++) {
    while (mdIdx < markdown.length && markdown[mdIdx] !== plainText[plainIdx]) {
      mdIdx++;
    }
    toMarkdown.push(mdIdx);
    mdIdx++;
  }
  toMarkdown.push(markdown.length);
  return { plainText, toMarkdown };
}

/**
 * Count how many plain-text characters fall within the first `mdPrefixLen`
 * markdown characters, using the plain-to-markdown mapping built on the
 * full string. This correctly handles partial markdown constructs (e.g.
 * a prefix that ends inside a link URL) because the mapping is built with
 * the full string's regex context.
 */
function countPlainTextInPrefix(toMarkdown: number[], mdPrefixLen: number): number {
  let count = 0;
  // Exclude the sentinel (last entry)
  for (let i = 0; i < toMarkdown.length - 1; i++) {
    if (toMarkdown[i] < mdPrefixLen) {
      count++;
    } else {
      break; // toMarkdown is monotonically increasing
    }
  }
  return count;
}

/**
 * Count how many plain-text characters fall within the last `mdSuffixLen`
 * markdown characters.
 */
function countPlainTextInSuffix(toMarkdown: number[], markdownLength: number, mdSuffixLen: number): number {
  if (mdSuffixLen === 0) return 0;
  const threshold = markdownLength - mdSuffixLen;
  let count = 0;
  // Walk backwards from the last non-sentinel entry
  for (let i = toMarkdown.length - 2; i >= 0; i--) {
    if (toMarkdown[i] >= threshold) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Apply an "edit" mode replacement at an already-located selection: narrow to
 * the minimal diff (possibly a pure insertion), render the narrowed
 * replacement markdown to nodes (the caller supplies the `math-tex`-emitting
 * markdown-it instance — post or research — so `$...$` becomes a real
 * MathNode), and splice them in. Shared by the post and research replaceText
 * routes and the typo-suggestion apply path. Must be called inside a Lexical
 * update context.
 *
 * Replacement text is inline content except where it starts a new line,
 * where markdown can start a block (a list item, a new paragraph). So a
 * replacement is only narrowed to a fragment within one line, which is
 * rendered inline. One that isn't narrowed is rendered as blocks if it has
 * more than one line, and inline otherwise.
 */
export function $applyEditModeReplacement({
  editor,
  anchor,
  focus,
  quote,
  replacement,
  range,
  markdownIt,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  quote: string
  replacement: string
  range: LocatedQuoteRange | undefined
  markdownIt: MarkdownIt
}): { replaced: boolean, narrowedQuote: string, narrowedReplacement: string } {
  const computedNarrowing = $computeNarrowing(anchor, focus, quote, replacement, range, markdownIt);
  const narrowing = computedNarrowing?.replacement.includes("\n") ? null : computedNarrowing;
  let importedNodes: LexicalNode[];
  if (narrowing) {
    importedNodes = $inlineMarkdownToNodes(editor, narrowing.replacement, markdownIt);
  } else if (replacement.includes("\n")) {
    importedNodes = $htmlToInlineNodes(editor, renderAgentMarkdownToHtml(markdownIt, replacement));
  } else {
    importedNodes = $inlineMarkdownToNodes(editor, replacement, markdownIt);
  }
  const { contentNodes: nodes, footnoteSections } = splitImportedFootnotes(importedNodes);
  const inheritedFormat = $getInheritedTextFormat(
    narrowing?.anchor ?? anchor, narrowing?.focus ?? focus, narrowing?.quote ?? quote,
  );
  for (const node of nodes) {
    $addTextFormat(node, inheritedFormat);
  }
  const replaced = $applyEditAtSelection({
    anchor: narrowing?.anchor ?? anchor,
    focus: narrowing?.focus ?? focus,
    nodes,
  });
  if (replaced) {
    // A `$$…$$` replacement renders to a block-level (display) MathNode that
    // `$applyEditAtSelection` splices inline into the surrounding paragraph;
    // hoist it back out so the document never holds a block-inside-paragraph.
    $hoistDisplayMathOutOfParagraphs();
    $appendImportedFootnotes(footnoteSections);
  }
  return {
    replaced,
    narrowedQuote: narrowing?.quote ?? quote,
    narrowedReplacement: narrowing?.replacement ?? replacement,
  };
}

/**
 * After an edit splices a `$$…$$` replacement into a paragraph, a block-level
 * (display) MathNode is left nested inside that ParagraphNode. Walk the root's
 * top-level paragraphs and split each one around its display MathNodes, so a
 * display equation becomes a top-level sibling — matching how the editor's
 * MathPlugin and `normalizeImportedTopLevelNodes` represent display math.
 */
function $hoistDisplayMathOutOfParagraphs(): void {
  for (const child of $getRoot().getChildren()) {
    if (!$isParagraphNode(child)) continue;
    const pieces = splitParagraphAtDisplayMath(child);
    // `splitParagraphAtDisplayMath` returns `[child]` unchanged when the
    // paragraph has no display math to hoist.
    if (pieces.length === 1 && pieces[0] === child) continue;
    let anchor: LexicalNode = child;
    for (const piece of pieces) {
      anchor.insertAfter(piece);
      anchor = piece;
    }
    child.remove();
  }
}
