import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $createTextNode, $getNodeByKey, $getRoot, $isElementNode, $isTextNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { JSDOM } from "jsdom";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { deriveAgentAuthor, waitForProviderFlush, withMainDocEditorSession, authorizeAgentDraftAccess } from "../editorAgentUtil";

import { locateMarkdownQuoteSelectionInSubtree, markdownQuoteToPlainText, type MarkdownSelectionPoint } from "../mapMarkdownToLexical";
import { replaceTextToolSchema, type ReplaceMode } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

interface ReplaceResult {
  replaced: boolean
  quoteFoundInDocument: boolean
  note: string
  suggestionId?: string
  /** The quote/replacement after narrowing, for use in suggestion summaries. */
  summaryQuote?: string
  summaryReplacement?: string
}

interface SuggestionNarrowingResult {
  replaced: boolean
  /** The quote/replacement actually used after narrowing (for summaries). */
  narrowedQuote: string
  narrowedReplacement: string
}

/**
 * Parses a markdown replacement string into inline Lexical nodes suitable for
 * insertion within an existing paragraph. When the markdown produces a single
 * wrapping paragraph, the inline children are extracted so they stay inline.
 */
function $markdownToInlineNodes(editor: LexicalEditor, markdown: string): LexicalNode[] {
  const html = markdownToHtml(markdown);
  const dom = new JSDOM(html);
  const nodes = $generateNodesFromDOM(editor, dom.window.document);
  // Markdown typically produces a single paragraph wrapping inline children.
  // Extract the inline children so they stay within the existing paragraph.
  if (nodes.length === 1 && $isElementNode(nodes[0])) {
    return nodes[0].getChildren();
  }
  return nodes;
}

/**
 * Convert a narrowed replacement string into Lexical nodes while preserving
 * edge whitespace. The standard markdown→HTML pipeline strips leading/trailing
 * whitespace; for narrowed replacements those spaces are meaningful content.
 * When the narrowed text is plain (no formatting), a TextNode is created
 * directly. Otherwise the markdown pipeline is used with whitespace patched.
 */
function $narrowedReplacementToNodes(editor: LexicalEditor, replacement: string, expectedPlainText?: string): LexicalNode[] {
  if (replacement.length === 0) return [];

  const plainText = expectedPlainText ?? markdownQuoteToPlainText(replacement);
  if (replacement === plainText) {
    return [$createTextNode(replacement)];
  }

  const nodes = $markdownToInlineNodes(editor, replacement);
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

export function $applyEditReplacement({
  editor,
  matchedNodeKey,
  startOffset,
  endOffset,
  replacement,
}: {
  editor: LexicalEditor
  matchedNodeKey?: string
  startOffset?: number
  endOffset?: number
  replacement: string
}): boolean {
  if (!matchedNodeKey || startOffset === undefined || endOffset === undefined) {
    return false;
  }

  const originalNode = $getNodeByKey(matchedNodeKey);
  if (!$isTextNode(originalNode)) {
    return false;
  }

  const splitNodes = originalNode.splitText(startOffset, endOffset);
  // When startOffset > 0, splitText produces [before, match, ...] so the match is at index 1.
  // When startOffset === 0, there is no "before" part, so the match is at index 0.
  const matchNodeIndex = startOffset > 0 ? 1 : 0;
  const selectedNode = splitNodes[matchNodeIndex];
  if (!$isTextNode(selectedNode)) {
    return false;
  }

  if (replacement.length > 0) {
    const inlineNodes = $markdownToInlineNodes(editor, replacement);
    for (const node of inlineNodes) {
      selectedNode.insertBefore(node);
    }
    selectedNode.remove();
  } else {
    selectedNode.remove();
  }
  return true;
}

function $applySuggestionReplacement({
  editor,
  matchedNodeKey,
  startOffset,
  endOffset,
  replacement,
  replacementNodes,
  suggestionId,
}: {
  editor: LexicalEditor
  matchedNodeKey?: string
  startOffset?: number
  endOffset?: number
  replacement: string
  replacementNodes?: LexicalNode[]
  suggestionId: string
}): boolean {
  if (!matchedNodeKey || startOffset === undefined || endOffset === undefined) {
    return false;
  }

  const originalNode = $getNodeByKey(matchedNodeKey);
  if (!$isTextNode(originalNode)) {
    return false;
  }

  const splitNodes = originalNode.splitText(startOffset, endOffset);
  const matchNodeIndex = startOffset > 0 ? 1 : 0;
  const selectedNode = splitNodes[matchNodeIndex];
  if (!$isTextNode(selectedNode)) {
    return false;
  }

  const deleteSuggestion = $createSuggestionNode(suggestionId, "delete");
  selectedNode.insertBefore(deleteSuggestion);
  deleteSuggestion.append(selectedNode);

  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  const nodes = replacementNodes ?? $narrowedReplacementToNodes(editor, replacement);
  for (const node of nodes) {
    insertSuggestion.append(node);
  }
  deleteSuggestion.insertAfter(insertSuggestion);

  return true;
}

/**
 * Split anchor and focus text nodes at their respective offsets and collect
 * all sibling nodes between them (inclusive). Used when a quote spans across
 * multiple inline nodes (e.g. plain text + inline code).
 */
function $splitAndCollectSelectedNodes(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): LexicalNode[] | null {
  if (anchor.type !== "text" || focus.type !== "text") return null;

  const anchorNode = $getNodeByKey(anchor.key);
  const focusNode = $getNodeByKey(focus.key);
  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) return null;

  // Determine the first selected node by splitting the anchor text node
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

  // Determine the last selected node by splitting the focus text node
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

  // Walk siblings from first to last
  const selectedNodes: LexicalNode[] = [];
  let current: LexicalNode | null = firstSelectedNode;
  while (current) {
    selectedNodes.push(current);
    if (current.getKey() === lastSelectedNode.getKey()) break;
    current = current.getNextSibling();
  }

  // Verify we reached lastSelectedNode
  if (selectedNodes.length === 0 || selectedNodes[selectedNodes.length - 1].getKey() !== lastSelectedNode.getKey()) {
    return null;
  }

  return selectedNodes;
}

export function $applyEditReplacementMultiNode({
  editor,
  anchor,
  focus,
  replacement,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  replacement: string
}): boolean {
  const selectedNodes = $splitAndCollectSelectedNodes(anchor, focus);
  if (!selectedNodes) return false;

  if (replacement.length > 0) {
    const inlineNodes = $markdownToInlineNodes(editor, replacement);
    for (const node of inlineNodes) {
      selectedNodes[0].insertBefore(node);
    }
  }

  for (const node of selectedNodes) {
    node.remove();
  }

  return true;
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

/**
 * Some zero-width positions sit exactly on a text-node boundary, so Lexical can
 * represent the same insertion point as either "end of left node" or "start of
 * right node". Normalize those equivalent points to a single text position.
 */
function $getEquivalentInsertionPoint(
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
): MarkdownSelectionPoint | null {
  if (anchor.type !== "text" || focus.type !== "text") return null;

  if (anchor.key === focus.key && anchor.offset === focus.offset) {
    return anchor;
  }

  const anchorNode = $getNodeByKey(anchor.key);
  const focusNode = $getNodeByKey(focus.key);
  if (!$isTextNode(anchorNode) || !$isTextNode(focusNode)) return null;

  const anchorAtEnd = anchor.offset === anchorNode.getTextContent().length;
  const focusAtStart = focus.offset === 0;
  if (anchorAtEnd && focusAtStart && anchorNode.getNextSibling()?.getKey() === focus.key) {
    return focus;
  }

  // Defensive: handle the reverse case where focus precedes anchor in sibling
  // order. This shouldn't arise from the narrowing logic but guards against
  // unexpected selection orientations.
  const anchorAtStart = anchor.offset === 0;
  const focusAtEnd = focus.offset === focusNode.getTextContent().length;
  if (anchorAtStart && focusAtEnd && focusNode.getNextSibling()?.getKey() === anchor.key) {
    return anchor;
  }

  return null;
}

/**
 * Handle the pure-insertion case: narrowing produced an empty delete range
 * (anchor and focus are at the same point), so we just need to insert
 * suggestion nodes at that position.
 */
function $applySuggestionInsertionAtPoint({
  editor,
  point,
  replacement,
  suggestionId,
  replacementNodes,
}: {
  editor: LexicalEditor
  point: MarkdownSelectionPoint
  replacement: string
  suggestionId: string
  replacementNodes?: LexicalNode[]
}): boolean {
  if (point.type !== "text") return false;

  const node = $getNodeByKey(point.key);
  if (!$isTextNode(node)) return false;

  // Determine the anchor node after which to place the suggestion pair.
  // For offset 0, we use insertBefore on the text node itself.
  const textLen = node.getTextContent().length;
  let anchorNode: LexicalNode;
  let useInsertBefore = false;
  if (point.offset <= 0) {
    anchorNode = node;
    useInsertBefore = true;
  } else if (point.offset >= textLen) {
    anchorNode = node;
  } else {
    anchorNode = node.splitText(point.offset)[0];
  }

  const deleteSuggestion = $createSuggestionNode(suggestionId, "delete");
  if (useInsertBefore) {
    anchorNode.insertBefore(deleteSuggestion);
  } else {
    anchorNode.insertAfter(deleteSuggestion);
  }

  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  const nodes = replacementNodes ?? $narrowedReplacementToNodes(editor, replacement);
  for (const n of nodes) {
    insertSuggestion.append(n);
  }
  deleteSuggestion.insertAfter(insertSuggestion);
  return true;
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
 * Apply a suggestion replacement, dispatching to the insertion, single-node,
 * or multi-node apply function as appropriate for the given selection.
 */
function $applySuggestionForSelection(
  editor: LexicalEditor,
  anchor: MarkdownSelectionPoint,
  focus: MarkdownSelectionPoint,
  replacement: string,
  suggestionId: string,
  replacementNodes?: LexicalNode[],
): boolean {
  const insertionPoint = $getEquivalentInsertionPoint(anchor, focus);
  if (insertionPoint) {
    return $applySuggestionInsertionAtPoint({
      editor, point: insertionPoint, replacement, suggestionId, replacementNodes,
    });
  }

  const sameTextNode = anchor.key === focus.key
    && anchor.type === "text" && focus.type === "text";

  if (sameTextNode) {
    return $applySuggestionReplacement({
      editor,
      matchedNodeKey: anchor.key,
      startOffset: anchor.offset,
      endOffset: focus.offset,
      replacement,
      replacementNodes,
      suggestionId,
    });
  }

  return $applySuggestionReplacementMultiNode({
    editor, anchor, focus, replacement, replacementNodes, suggestionId,
  });
}

/**
 * Apply a suggestion replacement with narrowing: strip the common
 * markdown prefix/suffix between the quote and replacement so that
 * delete/insert suggestion nodes only wrap the minimal diff.
 *
 * Must be called inside a Lexical update context.
 */
export function $applySuggestionWithNarrowing({
  editor,
  anchor,
  focus,
  quote,
  replacement,
  suggestionId,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  quote: string
  replacement: string
  suggestionId: string
}): SuggestionNarrowingResult {
  const narrowing = $computeNarrowing(anchor, focus, quote, replacement);

  if (!narrowing) {
    const replaced = $applySuggestionForSelection(editor, anchor, focus, replacement, suggestionId);
    return { replaced, narrowedQuote: quote, narrowedReplacement: replacement };
  }

  const narrowedPlainText = markdownQuoteToPlainText(narrowing.replacement);
  const replacementNodes = $narrowedReplacementToNodes(editor, narrowing.replacement, narrowedPlainText);
  const replaced = $applySuggestionForSelection(
    editor, narrowing.anchor, narrowing.focus, narrowing.replacement, suggestionId, replacementNodes,
  );
  return { replaced, narrowedQuote: narrowing.quote, narrowedReplacement: narrowing.replacement };
}

function $applySuggestionReplacementMultiNode({
  editor,
  anchor,
  focus,
  replacement,
  replacementNodes,
  suggestionId,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  replacement: string
  replacementNodes?: LexicalNode[]
  suggestionId: string
}): boolean {
  const selectedNodes = $splitAndCollectSelectedNodes(anchor, focus);
  if (!selectedNodes) return false;

  const deleteSuggestion = $createSuggestionNode(suggestionId, "delete");
  selectedNodes[0].insertBefore(deleteSuggestion);
  for (const node of selectedNodes) {
    deleteSuggestion.append(node);
  }

  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  const nodes = replacementNodes ?? $narrowedReplacementToNodes(editor, replacement);
  for (const node of nodes) {
    insertSuggestion.append(node);
  }
  deleteSuggestion.insertAfter(insertSuggestion);

  return true;
}

export async function replaceTextInMainDoc({
  postId,
  token,
  quote,
  replacement,
  mode,
  authorName,
  authorId,
}: {
  postId: string
  token: string
  quote: string
  replacement: string
  mode: ReplaceMode
  authorName: string
  authorId: string
}): Promise<ReplaceResult> {
  const result = await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "ReplaceText",
    callback: async ({ editor, provider }) => {
      let replaced = false;
      let quoteFoundInDocument = false;
      let suggestionId: string | undefined = undefined;
      let summaryQuote = quote;
      let summaryReplacement = replacement;

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const root = $getRoot();
          const selectionResult = locateMarkdownQuoteSelectionInSubtree({
            rootNodeKey: root.getKey(),
            markdownQuote: quote,
          });
          quoteFoundInDocument = selectionResult.found;
          if (!selectionResult.found || !selectionResult.anchor || !selectionResult.focus) {
            return;
          }

          const { anchor, focus } = selectionResult;
          const sameTextNode = anchor.key === focus.key && anchor.type === "text" && focus.type === "text";

          if (mode === "edit") {
            if (sameTextNode) {
              replaced = $applyEditReplacement({
                editor,
                matchedNodeKey: anchor.key,
                startOffset: anchor.offset,
                endOffset: focus.offset,
                replacement,
              });
            } else {
              replaced = $applyEditReplacementMultiNode({
                editor, anchor, focus, replacement,
              });
            }
            return;
          }

          suggestionId = randomId();
          const narrowingResult = $applySuggestionWithNarrowing({
            editor, anchor, focus, quote, replacement, suggestionId,
          });
          replaced = narrowingResult.replaced;
          summaryQuote = narrowingResult.narrowedQuote;
          summaryReplacement = narrowingResult.narrowedReplacement;
          if (!replaced) {
            suggestionId = undefined;
          }
        }, { onUpdate: resolve });
      });

      if (replaced) {
        await waitForProviderFlush(provider);
      }

      if (replaced) {
        return {
          replaced: true,
          quoteFoundInDocument,
          note: mode === "suggest"
            ? "Created delete/insert suggestion nodes for replacement."
            : "Replaced text directly.",
          suggestionId,
          summaryQuote,
          summaryReplacement,
        };
      }

      return {
        replaced: false,
        quoteFoundInDocument,
        note: quoteFoundInDocument
          ? "Quote was found in the document but spans multiple formatted regions (e.g. bold/italic/link boundaries), so the replacement could not be applied. Try quoting a smaller segment that falls within a single paragraph and formatting style."
          : "Quote not found in document.",
      };
    },
  });

  if (mode === "suggest" && result.replaced && result.suggestionId) {
    await createSuggestionThreadInCommentsDoc({
      postId,
      token,
      suggestionId: result.suggestionId,
      authorName,
      authorId,
      summaryItems: [{
        type: "replace",
        content: result.summaryQuote ?? quote,
        replaceWith: result.summaryReplacement ?? replacement,
      }],
    });
  }

  return result;
}

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = replaceTextToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "replaceText", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, quote, replacement, mode } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "replaceText", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;
    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });

    const result = await replaceTextInMainDoc({
      postId,
      token,
      quote,
      replacement,
      mode,
      authorName,
      authorId,
    });

    captureAgentApiEvent({ route: "replaceText", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: !result.quoteFoundInDocument ? "quote_not_found" : result.replaced ? "replaced" : "not_replaced" });
    return NextResponse.json({
      ok: true,
      postId,
      mode,
      replaced: result.replaced,
      quoteFoundInDocument: result.quoteFoundInDocument,
      note: result.note,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("replaceText", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to replace text in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
