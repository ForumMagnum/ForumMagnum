import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $getNodeByKey, $isElementNode, $isTextNode, type LexicalEditor, type LexicalNode } from "lexical";
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
  selectQuotedTextInEditor,
} from "../editorAgentUtil";
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
  const selectedNode = splitNodes.length > 1 ? splitNodes[1] : splitNodes[0];
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
  const selectedNode = splitNodes.length > 1 ? splitNodes[1] : splitNodes[0];
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
          const selectionResult = selectQuotedTextInEditor(quote);
          quoteFoundInDocument = selectionResult.quoteFoundInDocument;
          if (!selectionResult.selectionCreated) {
            return;
          }

          if (mode === "edit") {
            replaced = $applyEditReplacement({
              editor,
              matchedNodeKey: selectionResult.matchedNodeKey,
              startOffset: selectionResult.startOffset,
              endOffset: selectionResult.endOffset,
              replacement,
            });
            return;
          }

          suggestionId = randomId();
          replaced = $applySuggestionReplacement({
            editor,
            matchedNodeKey: selectionResult.matchedNodeKey,
            startOffset: selectionResult.startOffset,
            endOffset: selectionResult.endOffset,
            replacement,
            suggestionId,
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
