import { JSDOM } from "jsdom";
import { $generateNodesFromDOM } from "@lexical/html";
import {
  $getNodeByKey,
  $isElementNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
} from "lexical";
import {
  markdownQuoteToPlainText,
  type MarkdownSelectionPoint,
} from "./mapMarkdownToLexical";

export interface FinalSelection {
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  narrowedQuote: string
  narrowedReplacement: string
}

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
): FinalSelection {
  const narrowing = $computeNarrowing(anchor, focus, quote, replacement);
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
 * Split anchor and focus text nodes at their respective offsets and collect
 * all sibling nodes between them (inclusive). Used when a quote spans across
 * multiple inline nodes (e.g. plain text + inline code).
 */
export function $splitAndCollectSelectedNodes(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): LexicalNode[] | null {
  if (anchor.type !== "text" || focus.type !== "text") return null;

  const anchorNode = $getNodeByKey(anchor.key);
  const focusNode = $getNodeByKey(focus.key);
  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) return null;

  let firstSelectedNode: LexicalNode | null;
  if (anchor.offset === 0) {
    firstSelectedNode = anchorNode;
  } else if (anchor.offset >= anchorNode.getTextContent().length) {
    firstSelectedNode = anchorNode.getNextSibling();
  } else {
    const splits = anchorNode.splitText(anchor.offset);
    firstSelectedNode = splits[1] ?? null;
  }
  if (!firstSelectedNode) return null;

  let lastSelectedNode: LexicalNode | null;
  if (focus.offset >= focusNode.getTextContent().length) {
    lastSelectedNode = focusNode;
  } else if (focus.offset <= 0) {
    lastSelectedNode = focusNode.getPreviousSibling();
  } else {
    const splits = focusNode.splitText(focus.offset);
    lastSelectedNode = splits[0];
  }
  if (!lastSelectedNode) return null;

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
): {
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  quote: string
  replacement: string
} | null {
  const matchedPlainText = $collectPlainTextInRange(anchor, focus);
  if (matchedPlainText === null) return null;

  // If the visible text is identical, the change is purely structural
  // (formatting, link URLs, etc.) — show the full range.
  if (markdownQuoteToPlainText(replacement) === matchedPlainText) return null;

  // Compare at the markdown level so that formatting/syntax changes
  // prevent narrowing past them.
  const { prefixLen: mdPrefixLen, suffixLen: mdSuffixLen } = computeCommonPrefixSuffix(quote, replacement);

  // Convert markdown offsets to plain-text character counts using the
  // quote's mapping (which has full regex context for links, math, etc.)
  const quoteMapping = buildPlainToMarkdownMapping(quote);
  const ptAdvance = countPlainTextInPrefix(quoteMapping.toMarkdown, mdPrefixLen);
  const ptRetreat = countPlainTextInSuffix(quoteMapping.toMarkdown, quote.length, mdSuffixLen);

  if (ptAdvance === 0 && ptRetreat === 0) return null;
  if (ptAdvance + ptRetreat > matchedPlainText.length) return null;

  const narrowedAnchor = $advancePoint(anchor, ptAdvance);
  const narrowedFocus = $retreatPoint(focus, ptRetreat);
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
 * Collect the plain text content between anchor and focus by walking
 * sibling text nodes. Must be called inside a Lexical read/update context.
 */
function $collectPlainTextInRange(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): string | null {
  if (anchor.type !== "text" || focus.type !== "text") return null;

  const anchorNode = $getNodeByKey(anchor.key);
  if (!$isTextNode(anchorNode)) return null;

  if (anchor.key === focus.key) {
    return anchorNode.getTextContent().slice(anchor.offset, focus.offset);
  }

  let result = anchorNode.getTextContent().slice(anchor.offset);
  let current: LexicalNode | null = anchorNode.getNextSibling();
  while (current) {
    if (current.getKey() === focus.key) {
      result += current.getTextContent().slice(0, focus.offset);
      break;
    }
    result += current.getTextContent();
    current = current.getNextSibling();
  }
  return result;
}

/**
 * Advance a text selection point forward by `chars` characters, crossing
 * into subsequent sibling nodes as needed.
 */
function $advancePoint(
  point: MarkdownSelectionPoint,
  chars: number,
): MarkdownSelectionPoint | null {
  if (chars === 0) return point;
  if (point.type !== "text") return null;

  let remaining = chars;
  let currentNode: LexicalNode | null = $getNodeByKey(point.key);
  if (!currentNode) return null;
  let currentOffset = point.offset;

  while (remaining > 0) {
    const textLen = currentNode.getTextContent().length;
    const available = textLen - currentOffset;
    if (remaining <= available) {
      return { key: currentNode.getKey(), offset: currentOffset + remaining, type: "text" };
    }
    remaining -= available;
    currentNode = currentNode.getNextSibling();
    if (!currentNode) return null;
    currentOffset = 0;
  }
  return { key: currentNode.getKey(), offset: currentOffset, type: "text" };
}

/**
 * Retreat a text selection point backward by `chars` characters, crossing
 * into preceding sibling nodes as needed.
 */
function $retreatPoint(
  point: MarkdownSelectionPoint,
  chars: number,
): MarkdownSelectionPoint | null {
  if (chars === 0) return point;
  if (point.type !== "text") return null;

  let remaining = chars;
  let currentNode: LexicalNode | null = $getNodeByKey(point.key);
  if (!currentNode) return null;
  let currentOffset = point.offset;

  while (remaining > 0) {
    if (remaining <= currentOffset) {
      return { key: currentNode.getKey(), offset: currentOffset - remaining, type: "text" };
    }
    remaining -= currentOffset;
    currentNode = currentNode.getPreviousSibling();
    if (!currentNode) return null;
    currentOffset = currentNode.getTextContent().length;
  }
  return { key: currentNode.getKey(), offset: currentOffset, type: "text" };
}
