import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $getNodeByKey, $getRoot, $isElementNode, $isTextNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateNodesFromDOM } from "@lexical/html";
import { JSDOM } from "jsdom";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { markdownToHtml } from "@/server/editor/conversionUtils";
import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import {
  deriveAgentAuthor,
  HOCUSPOCUS_FLUSH_WAIT_MS,
  sleep,
  withMainDocEditorSession,
} from "../editorAgentUtil";
import { locateMarkdownQuoteSelectionInSubtree, type MarkdownSelectionPoint } from "../mapMarkdownToLexical";
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

export function $applySuggestionReplacement({
  editor,
  matchedNodeKey,
  startOffset,
  endOffset,
  replacement,
  suggestionId,
}: {
  editor: LexicalEditor
  matchedNodeKey?: string
  startOffset?: number
  endOffset?: number
  replacement: string
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
  if (replacement.length > 0) {
    for (const node of $markdownToInlineNodes(editor, replacement)) {
      insertSuggestion.append(node);
    }
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

export function $applySuggestionReplacementMultiNode({
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
  const selectedNodes = $splitAndCollectSelectedNodes(anchor, focus);
  if (!selectedNodes) return false;

  const deleteSuggestion = $createSuggestionNode(suggestionId, "delete");
  selectedNodes[0].insertBefore(deleteSuggestion);
  for (const node of selectedNodes) {
    deleteSuggestion.append(node);
  }

  const insertSuggestion = $createSuggestionNode(suggestionId, "insert");
  if (replacement.length > 0) {
    for (const node of $markdownToInlineNodes(editor, replacement)) {
      insertSuggestion.append(node);
    }
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
          if (sameTextNode) {
            replaced = $applySuggestionReplacement({
              editor,
              matchedNodeKey: anchor.key,
              startOffset: anchor.offset,
              endOffset: focus.offset,
              replacement,
              suggestionId,
            });
          } else {
            replaced = $applySuggestionReplacementMultiNode({
              editor, anchor, focus, replacement, suggestionId,
            });
          }
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
