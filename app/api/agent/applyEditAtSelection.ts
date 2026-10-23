import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import {
  $createRangeSelection,
  $createTextNode,
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
} from "lexical";
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
 * Convert a narrowed replacement string into Lexical nodes while preserving
 * edge whitespace. The standard markdown→HTML pipeline strips leading/trailing
 * whitespace; for narrowed replacements those spaces are meaningful content.
 * When the narrowed text is plain (no formatting), a TextNode is created
 * directly. Otherwise the markdown pipeline is used with whitespace patched.
 */
export function $narrowedReplacementToNodes(
  editor: LexicalEditor,
  replacement: string,
  markdownIt: MarkdownIt,
  expectedPlainText?: string,
): LexicalNode[] {
  if (replacement.length === 0) return [];

  const plainText = expectedPlainText ?? markdownQuoteToPlainText(replacement);
  if (replacement === plainText) {
    return [$createTextNode(replacement)];
  }

  const nodes = $htmlToInlineNodes(editor, renderAgentMarkdownToHtml(markdownIt, replacement));
  const nodesText = nodes.map(n => n.getTextContent()).join("");

  const leadingWs = plainText.match(/^(\s+)/)?.[1] ?? "";
  const nodesLeadingWs = nodesText.match(/^(\s+)/)?.[1] ?? "";
  if (leadingWs.length > nodesLeadingWs.length) {
    nodes.unshift($createTextNode(leadingWs.slice(0, leadingWs.length - nodesLeadingWs.length)));
  }

  const trailingWs = plainText.match(/(\s+)$/)?.[1] ?? "";
  const nodesTrailingWs = nodesText.match(/(\s+)$/)?.[1] ?? "";
  if (trailingWs.length > nodesTrailingWs.length) {
    nodes.push($createTextNode(trailingWs.slice(nodesTrailingWs.length)));
  }

  return nodes;
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
function $addTextFormat(node: LexicalNode, format: number): void {
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
 * the minimal diff (possibly a pure insertion), render the narrowed
 * replacement markdown to nodes (the caller supplies the `math-tex`-emitting
 * markdown-it instance — post or research — so `$...$` becomes a real
 * MathNode), and splice them in. Shared by the post and research replaceText
 * routes and the typo-suggestion apply path. Must be called inside a Lexical
 * update context.
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
  const narrowing = $computeNarrowing(anchor, focus, quote, replacement, range);
  let nodes: LexicalNode[] = [];
  if (narrowing) {
    nodes = $narrowedReplacementToNodes(editor, narrowing.replacement, markdownIt);
  } else if (replacement.length > 0) {
    nodes = $htmlToInlineNodes(editor, renderAgentMarkdownToHtml(markdownIt, replacement));
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
