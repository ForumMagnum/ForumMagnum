import { randomId } from "@/lib/random";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { runQuery } from "@/server/vulcan-lib/query";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { $createTextNode, $getNodeByKey, $isTextNode } from "lexical";
import { $createSuggestionNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import {
  sleep,
  withMainDocEditorSession,
  selectQuotedTextInEditor,
} from "../editorAgentUtil";

const HocuspocusAuthQuery = `
  query AgentReplaceTextHocuspocusAuthQuery($postId: String!, $linkSharingKey: String) {
    HocuspocusAuth(postId: $postId, linkSharingKey: $linkSharingKey) {
      token
    }
  }
`;

const HOCUSPOCUS_FLUSH_WAIT_MS = 750;

const ReplaceTextRequestSchema = z.object({
  postId: z.string(),
  key: z.string().optional(),
  quote: z.string(),
  replacement: z.string(),
  mode: z.enum(["edit", "suggest"]).default("suggest"),
});

type ReplaceMode = z.infer<typeof ReplaceTextRequestSchema>["mode"];

interface ReplaceResult {
  replaced: boolean
  quoteFoundInDocument: boolean
  note: string
}

function applySuggestionReplacement({
  matchedNodeKey,
  startOffset,
  endOffset,
  replacement,
}: {
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

  const suggestionId = randomId();
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
}: {
  postId: string
  token: string
  quote: string
  replacement: string
  mode: ReplaceMode
}): Promise<ReplaceResult> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "ReplaceText",
    callback: async ({ editor }) => {
      let replaced = false;
      let quoteFoundInDocument = false;

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

          replaced = applySuggestionReplacement({
            matchedNodeKey: selectionResult.matchedNodeKey,
            startOffset: selectionResult.startOffset,
            endOffset: selectionResult.endOffset,
            replacement,
          });
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
}

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = ReplaceTextRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, quote, replacement, mode } = parseResult.data;

  try {
    const { data } = await runQuery(
      HocuspocusAuthQuery,
      { postId, linkSharingKey: key ?? null },
      context
    );
    const token = data?.HocuspocusAuth?.token;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized to edit draft" }, { status: 403 });
    }

    const result = await replaceTextInMainDoc({
      postId,
      token,
      quote,
      replacement,
      mode,
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
