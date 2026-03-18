import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $createTextNode, $getNodeByKey, $getRoot, $isElementNode, $isTextNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { JSDOM } from "jsdom";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import { deriveAgentAuthor, HOCUSPOCUS_FLUSH_WAIT_MS, normalizeText, withMainDocEditorSession } from "../editorAgentUtil";
import { sleep } from "@/lib/utils/asyncUtils";
import { locateMarkdownQuoteSelectionInSubtree, markdownQuoteToPlainText, type MarkdownSelectionPoint } from "../mapMarkdownToLexical";
import { replaceTextToolSchema, type ReplaceMode } from "../toolSchemas";
import { getHocuspocusToken } from "../getHocuspocusToken";
import { captureException } from "@/lib/sentryWrapper";

interface ReplaceResult {
  replaced: boolean
  quoteFoundInDocument: boolean
  note: string
  suggestionId?: string
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
function buildPlainToMarkdownMapping(markdown: string, precomputedPlainText?: string): { plainText: string, toMarkdown: number[] } {
  const plainText = precomputedPlainText ?? markdownQuoteToPlainText(markdown);
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
 * Narrow a replacement markdown string by trimming `prefixLen` plain-text
 * characters from the start and `suffixLen` from the end. Uses the
 * plain-to-markdown mapping so that formatting markers surrounding the
 * narrowed portion are preserved when possible.
 *
 * If the resulting slice produces malformed markdown (i.e. its plain-text
 * rendering doesn't match the expected narrowed plain text), falls back to
 * returning the narrowed plain text directly.
 */
function narrowReplacementMarkdown(
  replacementMarkdown: string,
  replacementPlainText: string,
  prefixLen: number,
  suffixLen: number,
): { narrowedMarkdown: string, narrowedPlainText: string } {
  if (prefixLen === 0 && suffixLen === 0) {
    return { narrowedMarkdown: replacementMarkdown, narrowedPlainText: replacementPlainText };
  }

  const { plainText, toMarkdown } = buildPlainToMarkdownMapping(replacementMarkdown, replacementPlainText);
  const mdStart = toMarkdown[prefixLen];
  const mdEnd = toMarkdown[plainText.length - suffixLen];
  const narrowed = replacementMarkdown.slice(mdStart, mdEnd);

  const narrowedPlainText = plainText.slice(prefixLen, plainText.length - suffixLen);
  const actualPlainText = markdownQuoteToPlainText(narrowed);

  // Prefer exact match; fall back to normalized comparison (whitespace/case insensitive)
  if (actualPlainText === narrowedPlainText || normalizeText(actualPlainText) === normalizeText(narrowedPlainText)) {
    return { narrowedMarkdown: narrowed, narrowedPlainText };
  }
  return { narrowedMarkdown: narrowedPlainText, narrowedPlainText };
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
 * Apply a suggestion replacement with narrowing: strip the common
 * prefix/suffix between the matched document text and the replacement,
 * so that delete/insert suggestion nodes only wrap the minimal diff.
 *
 * Must be called inside a Lexical update context.
 */
export function $applySuggestionWithNarrowing({
  editor,
  anchor,
  focus,
  replacement,
  suggestionId,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  replacement: string
  suggestionId: string
}): boolean {
  const matchedPlainText = $collectPlainTextInRange(anchor, focus);
  if (matchedPlainText === null) {
    return $applySuggestionFallback({ editor, anchor, focus, replacement, suggestionId });
  }

  const replacementPlainText = markdownQuoteToPlainText(replacement);
  const { prefixLen, suffixLen } = computeCommonPrefixSuffix(matchedPlainText, replacementPlainText);

  if (prefixLen === 0 && suffixLen === 0) {
    return $applySuggestionFallback({ editor, anchor, focus, replacement, suggestionId });
  }

  const narrowedAnchor = $advancePoint(anchor, prefixLen);
  const narrowedFocus = $retreatPoint(focus, suffixLen);
  if (!narrowedAnchor || !narrowedFocus) {
    return $applySuggestionFallback({ editor, anchor, focus, replacement, suggestionId });
  }

  const { narrowedMarkdown: narrowedReplacement, narrowedPlainText } = narrowReplacementMarkdown(replacement, replacementPlainText, prefixLen, suffixLen);
  const replacementNodes = $narrowedReplacementToNodes(editor, narrowedReplacement, narrowedPlainText);

  const isInsertionPoint = narrowedAnchor.key === narrowedFocus.key
    && narrowedAnchor.offset === narrowedFocus.offset
    && narrowedAnchor.type === "text";

  if (isInsertionPoint) {
    return $applySuggestionInsertionAtPoint({
      editor, point: narrowedAnchor, replacement: narrowedReplacement, suggestionId,
      replacementNodes,
    });
  }

  const sameTextNode = narrowedAnchor.key === narrowedFocus.key
    && narrowedAnchor.type === "text" && narrowedFocus.type === "text";

  if (sameTextNode) {
    return $applySuggestionReplacement({
      editor,
      matchedNodeKey: narrowedAnchor.key,
      startOffset: narrowedAnchor.offset,
      endOffset: narrowedFocus.offset,
      replacement: narrowedReplacement,
      replacementNodes,
      suggestionId,
    });
  }

  return $applySuggestionReplacementMultiNode({
    editor,
    anchor: narrowedAnchor,
    focus: narrowedFocus,
    replacement: narrowedReplacement,
    replacementNodes,
    suggestionId,
  });
}

/**
 * Fallback: apply suggestion without narrowing, using the original
 * anchor/focus/replacement. Dispatches to single-node or multi-node
 * depending on the selection.
 */
function $applySuggestionFallback({
  editor,
  anchor,
  focus,
  replacement,
  suggestionId,
}: {
  editor: LexicalEditor
  anchor: MarkdownSelectionPoint
  focus: MarkdownSelectionPoint
  replacement: string
  suggestionId: string
}): boolean {
  const sameTextNode = anchor.key === focus.key && anchor.type === "text" && focus.type === "text";
  if (sameTextNode) {
    return $applySuggestionReplacement({
      editor,
      matchedNodeKey: anchor.key,
      startOffset: anchor.offset,
      endOffset: focus.offset,
      replacement,
      suggestionId,
    });
  }
  return $applySuggestionReplacementMultiNode({
    editor, anchor, focus, replacement, suggestionId,
  });
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
    callback: async ({ editor }) => {
      let replaced = false;
      let quoteFoundInDocument = false;
      let suggestionId: string | undefined = undefined;

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
          replaced = $applySuggestionWithNarrowing({
            editor, anchor, focus, replacement, suggestionId,
          });
          if (!replaced) {
            suggestionId = undefined;
          }
        }, { onUpdate: resolve });
      });

      if (replaced) {
        await sleep(HOCUSPOCUS_FLUSH_WAIT_MS);
      }

      if (replaced) {
        return {
          replaced: true,
          quoteFoundInDocument,
          note: mode === "suggest"
            ? "Created delete/insert suggestion nodes for replacement."
            : "Replaced text directly.",
          suggestionId,
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
        content: quote,
        replaceWith: replacement,
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
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, quote, replacement, mode } = parseResult.data;

  try {
    const token = await getHocuspocusToken(context, postId, key);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized to edit draft" }, { status: 403 });
    }
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
    return NextResponse.json(
      {
        error: "Failed to replace text in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
