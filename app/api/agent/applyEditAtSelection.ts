import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import {
  $createRangeSelection,
  $isDecoratorNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $isParagraphNode,
  $isRootNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import { $isTableCellNode } from "@lexical/table";
import {
  markdownQuoteToPlainText,
  type MarkdownSelectionPoint,
} from "./mapMarkdownToLexical";
import { findMathSpansInMarkdown } from "@/lib/utils/mathTokens";
import { renderAgentMarkdownToHtml, splitParagraphAtDisplayMath } from "./editorAgentUtil";
import {
  normalizeTracked,
  resolveRawIndexToPoint,
  type LocatedQuoteRange,
} from "./textIndexQuoteLocator";
import type MarkdownIt from "markdown-it";

export interface FinalSelection {
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  narrowedQuote: string
  narrowedReplacement: string
}

export const CROSS_TABLE_CELL_REPLACEMENT_ERROR =
  "Quote crosses table cell boundaries; replaceText cannot edit across multiple cells. Use a quote contained within one table cell.";

/**
 * Resolve the final selection and replacement after applying narrowing.
 * Strips the common markdown prefix/suffix shared between quote and
 * replacement so the edit only touches the minimal diff. Falls back to the
 * original (wide) selection when narrowing would collapse to a pure insertion
 * (empty narrowed quote) — edit mode has no distinct insertion-at-point
 * primitive, and the wide replacement is functionally equivalent.
 *
 * Must be called inside a Lexical update/read context (the underlying
 * narrowing reads from the editor tree).
 */
export function $computeFinalSelection(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
  quote: string,
  replacement: string,
  range: LocatedQuoteRange | undefined,
): FinalSelection {
  const narrowing = $computeNarrowing(anchor, focus, quote, replacement, range);
  if (!narrowing || narrowing.quote.length === 0) {
    return { anchor, focus, narrowedQuote: quote, narrowedReplacement: replacement };
  }
  return {
    anchor: narrowing.anchor,
    focus: narrowing.focus,
    narrowedQuote: narrowing.quote,
    narrowedReplacement: narrowing.replacement,
  };
}

/**
 * Convert pre-rendered HTML into inline LexicalNodes suitable for insertion
 * within an existing paragraph. When the HTML produces a single wrapping
 * paragraph (the typical markdown-to-HTML output for an inline fragment),
 * its inline children are extracted so they stay within the surrounding
 * paragraph rather than starting a new one.
 *
 * Must be called inside a Lexical update context.
 */
export function $htmlToInlineNodes(editor: LexicalEditor, html: string): LexicalNode[] {
  const dom = new JSDOM(html);
  try {
    const nodes = $generateNodesFromDOM(editor, dom.window.document);
    if (nodes.length === 1 && $isElementNode(nodes[0])) {
      return nodes[0].getChildren();
    }
    return nodes;
  } finally {
    dom.window.close();
  }
}

/**
 * Apply an edit at a Lexical selection by removing the selected text-node
 * range and splicing the given pre-parsed inline nodes in its place.
 * Dispatches between the single-text-node case (a quote contained inside one
 * text node) and the multi-node case (a quote spanning sibling inline nodes,
 * e.g. across a bold/code boundary). Empty `inlineNodes` is a pure deletion.
 *
 * Must be called inside a Lexical update context.
 */
export function $applyEditAtSelection({
  anchor,
  focus,
  inlineNodes,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  inlineNodes: LexicalNode[]
}): boolean {
  if ($selectionSpansTableCellBoundary(anchor, focus)) return false;
  if (!$pointsShareBlock(anchor, focus)) {
    return $applyEditAcrossBlocks({ anchor, focus, inlineNodes });
  }
  const sameTextNode =
    anchor.key === focus.key && anchor.type === "text" && focus.type === "text";
  if (sameTextNode) {
    return $applyEditSingleNode({
      matchedNodeKey: anchor.key,
      startOffset: anchor.offset,
      endOffset: focus.offset,
      inlineNodes,
    });
  }
  return $applyEditMultiNode({ anchor, focus, inlineNodes });
}

function $nodeOfPoint(point: MarkdownSelectionPoint, isFocus: boolean): LexicalNode | null {
  let node = $getNodeByKey(point.key);
  if (!node) return null;
  if (point.type === "element" && $isElementNode(node)) {
    const children = node.getChildren();
    const index = Math.max(0, Math.min(isFocus ? point.offset - 1 : point.offset, children.length - 1));
    node = children[index] ?? node;
  }
  return node;
}

function $tableCellOfPoint(point: MarkdownSelectionPoint, isFocus: boolean): LexicalNode | null {
  let current = $nodeOfPoint(point, isFocus);
  while (current && !$isRootNode(current)) {
    if ($isTableCellNode(current)) return current;
    current = current.getParent();
  }
  return null;
}

/**
 * Whether applying a replacement to this range could merge or restructure
 * table cells. Replacements within one cell are safe, including ranges that
 * span multiple paragraphs inside that cell.
 */
export function $selectionSpansTableCellBoundary(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): boolean {
  const anchorCell = $tableCellOfPoint(anchor, false);
  const focusCell = $tableCellOfPoint(focus, true);
  return (!!anchorCell || !!focusCell) && anchorCell?.getKey() !== focusCell?.getKey();
}

/**
 * The nearest block-level node containing a selection point: the first
 * non-inline element or decorator ancestor (a paragraph inside a blockquote,
 * a list item, a top-level display equation), not the top-level element.
 * Sibling-walk application can only operate within one such block, so this
 * is the boundary that decides same-block vs cross-block dispatch. An
 * element point keyed on an element resolves to the child the boundary sits
 * against: before it for an anchor, after it for a focus.
 */
function $blockOfPoint(point: MarkdownSelectionPoint, isFocus: boolean): LexicalNode | null {
  const node = $nodeOfPoint(point, isFocus);
  if (!node) return null;
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
 * Apply an edit whose range spans block boundaries, via Lexical's own
 * range-selection editing (the paste path): removing a cross-block range
 * merges the boundary blocks, and inserting nodes splits blocks as needed
 * when the replacement itself is multi-block.
 */
function $applyEditAcrossBlocks({
  anchor,
  focus,
  inlineNodes,
}: {
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  inlineNodes: LexicalNode[]
}): boolean {
  const selection = $createRangeSelection();
  selection.anchor.set(anchor.key, anchor.offset, anchor.type);
  selection.focus.set(focus.key, focus.offset, focus.type);
  if (inlineNodes.length === 0) {
    selection.removeText();
  } else {
    selection.insertNodes(inlineNodes);
  }
  return true;
}

function $applyEditSingleNode({
  matchedNodeKey,
  startOffset,
  endOffset,
  inlineNodes,
}: {
  matchedNodeKey: string
  startOffset: number
  endOffset: number
  inlineNodes: LexicalNode[]
}): boolean {
  const originalNode = $getNodeByKey(matchedNodeKey);
  if (!$isTextNode(originalNode)) return false;

  const splitNodes = originalNode.splitText(startOffset, endOffset);
  // When startOffset > 0, splitText produces [before, match, ...] so the match
  // is at index 1. When startOffset === 0, there is no "before" part.
  const matchNodeIndex = startOffset > 0 ? 1 : 0;
  const selectedNode = splitNodes[matchNodeIndex];
  if (!$isTextNode(selectedNode)) return false;

  for (const node of inlineNodes) {
    selectedNode.insertBefore(node);
  }
  selectedNode.remove();
  return true;
}

function $applyEditMultiNode({
  anchor,
  focus,
  inlineNodes,
}: {
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  inlineNodes: LexicalNode[]
}): boolean {
  const selectedNodes = $splitAndCollectSelectedNodes(anchor, focus);
  if (!selectedNodes) return false;

  for (const node of inlineNodes) {
    selectedNodes[0].insertBefore(node);
  }
  for (const node of selectedNodes) {
    node.remove();
  }
  return true;
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
 * Resolve anchor/focus selection points to the run of sibling nodes they
 * select (inclusive), splitting boundary text nodes as needed. Used when a
 * quote spans multiple inline nodes — across a bold/code boundary, or across
 * an atomic node like a MathNode (selected via an element-type point).
 */
function $splitAndCollectSelectedNodes(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): LexicalNode[] | null {
  // Resolve element-typed points first: they are plain child-index lookups,
  // whereas resolving a text point may `splitText` and shift sibling indices,
  // which would invalidate a not-yet-resolved element point's offset.
  let firstSelectedNode = anchor.type === "element" ? $resolveFirstSelectedNode(anchor) : null;
  let lastSelectedNode = focus.type === "element" ? $resolveLastSelectedNode(focus) : null;
  if (anchor.type === "text") firstSelectedNode = $resolveFirstSelectedNode(anchor);
  if (focus.type === "text") lastSelectedNode = $resolveLastSelectedNode(focus);
  if (!firstSelectedNode || !lastSelectedNode) return null;

  const selectedNodes: LexicalNode[] = [];
  let current: LexicalNode | null = firstSelectedNode;
  while (current) {
    selectedNodes.push(current);
    if (current.getKey() === lastSelectedNode.getKey()) break;
    current = current.getNextSibling();
  }

  if (
    selectedNodes.length === 0
    || selectedNodes[selectedNodes.length - 1].getKey() !== lastSelectedNode.getKey()
  ) {
    return null;
  }

  return selectedNodes;
}

/**
 * Pull a common-prefix boundary back out of any math token. A boundary that
 * falls strictly inside a `$…$` / `\(…\)` token of either string would split
 * an equation; snap it to that token's start instead.
 */
function snapPrefixOutOfMathTokens(quote: string, replacement: string, prefixLen: number): number {
  let result = prefixLen;
  for (const text of [quote, replacement]) {
    for (const span of findMathSpansInMarkdown(text)) {
      if (result > span.start && result < span.end) {
        result = span.start;
      }
    }
  }
  return result;
}

/**
 * Pull a common-suffix boundary forward out of any math token. The boundary
 * sits at `text.length - suffixLen`; if it falls strictly inside a math token,
 * snap it to that token's end, shrinking the suffix.
 */
function snapSuffixOutOfMathTokens(quote: string, replacement: string, suffixLen: number): number {
  let result = suffixLen;
  for (const text of [quote, replacement]) {
    for (const span of findMathSpansInMarkdown(text)) {
      const boundary = text.length - result;
      if (boundary > span.start && boundary < span.end) {
        result = text.length - span.end;
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
): {
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  quote: string
  replacement: string
} | null {
  if (!range) return null;
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
  // prevent narrowing past them. Then pull each boundary out of any math
  // token, so narrowing never splits a `$…$` into a fragment that can't be
  // located against the document's atomic MathNode.
  const rawAffixes = computeCommonPrefixSuffix(quote, replacement);
  const mdPrefixLen = snapPrefixOutOfMathTokens(quote, replacement, rawAffixes.prefixLen);
  const mdSuffixLen = snapSuffixOutOfMathTokens(quote, replacement, rawAffixes.suffixLen);

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
 * the minimal diff, render the narrowed replacement markdown to inline nodes
 * (the caller supplies the `math-tex`-emitting markdown-it instance — post or
 * research — so `$...$` becomes a real MathNode), and splice them in. Shared
 * by the post and research replaceText routes and the typo-suggestion apply
 * path. Must be called inside a Lexical update context.
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
  const sel = $computeFinalSelection(anchor, focus, quote, replacement, range);
  const inlineNodes = sel.narrowedReplacement.length > 0
    ? $htmlToInlineNodes(editor, renderAgentMarkdownToHtml(markdownIt, sel.narrowedReplacement))
    : [];
  const replaced = $applyEditAtSelection({
    editor, anchor: sel.anchor, focus: sel.focus, inlineNodes,
  });
  if (replaced) {
    // A `$$…$$` replacement renders to a block-level (display) MathNode that
    // `$applyEditAtSelection` splices inline into the surrounding paragraph;
    // hoist it back out so the document never holds a block-inside-paragraph.
    $hoistDisplayMathOutOfParagraphs();
  }
  return {
    replaced,
    narrowedQuote: sel.narrowedQuote,
    narrowedReplacement: sel.narrowedReplacement,
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
