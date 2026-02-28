import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { $createTextNode, $getNodeByKey, $isTextNode } from "lexical";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { createSuggestionThreadInCommentsDoc } from "../suggestionThreads";
import {
  deriveAgentAuthor,
  sleep,
  withMainDocEditorSession,
  selectQuotedTextInEditor,
} from "../editorAgentUtil";
import { replaceTextToolSchema, type ReplaceMode } from "../toolSchemas";
import { getHocuspocusToken } from "../getHocuspocusToken";

const HOCUSPOCUS_FLUSH_WAIT_MS = 750;

interface ReplaceResult {
  replaced: boolean
  quoteFoundInDocument: boolean
  note: string
  suggestionId?: string
}

function applySuggestionReplacement({
  matchedNodeKey,
  startOffset,
  endOffset,
  replacement,
  suggestionId,
}: {
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
    insertSuggestion.append($createTextNode(replacement));
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
            const node = selectionResult.matchedNodeKey
              ? $getNodeByKey(selectionResult.matchedNodeKey)
              : null;
            if ($isTextNode(node) && selectionResult.startOffset !== undefined && selectionResult.endOffset !== undefined) {
              const splitNodes = node.splitText(selectionResult.startOffset, selectionResult.endOffset);
              const selectedNode = splitNodes.length > 1 ? splitNodes[1] : splitNodes[0];
              if ($isTextNode(selectedNode)) {
                if (replacement.length > 0) {
                  selectedNode.setTextContent(replacement);
                } else {
                  selectedNode.remove();
                }
                replaced = true;
              }
            }
            return;
          }

          suggestionId = randomId();
          replaced = applySuggestionReplacement({
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
          ? "Quote found in document, but simple single-node replacement did not apply."
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
    return NextResponse.json(
      {
        error: "Failed to replace text in collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
