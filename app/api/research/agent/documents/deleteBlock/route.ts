import { NextRequest, NextResponse } from "next/server";
import { $getRoot } from "lexical";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { waitForProviderFlush } from "../../../../agent/editorAgentUtil";
import { $locateBlockByPrefix } from "../../../../agent/textIndexQuoteLocator";
import { $wrapBlockAsDeletionSuggestion } from "../../../../agent/deleteBlock/route";
import type { ReplaceMode } from "../../../../agent/toolSchemas";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { withResearchDocEditorSession } from "../../researchEditorSession";
import { deleteBlockInResearchDocSchema } from "../../researchToolSchemas";
import { maybeCreateResearchSuggestionThread } from "../../researchSuggestionThreads";

const ROUTE = "documents.deleteBlock";

interface DeleteBlockResult {
  deleted: boolean;
  note: string;
  deletionIndex?: number;
  suggestionId?: string;
}

async function deleteMarkdownBlockInResearchDoc({
  documentId,
  hocuspocusToken,
  prefix,
  mode,
}: {
  documentId: string;
  hocuspocusToken: string;
  prefix: string;
  mode: ReplaceMode;
}): Promise<DeleteBlockResult> {
  return withResearchDocEditorSession({
    documentId,
    token: hocuspocusToken,
    operationLabel: "ResearchDeleteBlock",
    callback: async ({ editor, provider }) => {
      let result: DeleteBlockResult = { deleted: false, note: "No deletion performed." };
      await new Promise<void>((resolve) => {
        editor.update(
          () => {
            const root = $getRoot();
            const blockResult = $locateBlockByPrefix(prefix);
            const nodeToDelete = blockResult.node;
            if (!nodeToDelete) {
              result = {
                deleted: false,
                note: blockResult.reason ?? `No block starts with locator text: ${prefix}`,
              };
              return;
            }
            const parent = nodeToDelete.getParent();
            if (!parent) {
              result = { deleted: false, note: "Matched block has no parent and cannot be deleted." };
              return;
            }
            const indexInParent = nodeToDelete.getIndexWithinParent();

            if (mode === "edit") {
              nodeToDelete.remove();
              // If we just removed the last list item from a list, drop the
              // (now-empty) list too — leaving an empty list behind looks like
              // a rendering glitch in the editor.
              if (parent !== root && parent.getChildrenSize() === 0) {
                parent.remove();
              }
              result = {
                deleted: true,
                note: "Deleted markdown block from research document.",
                deletionIndex: indexInParent,
              };
              return;
            }

            const suggestionId = randomId();
            if (!$wrapBlockAsDeletionSuggestion(nodeToDelete, suggestionId)) {
              result = {
                deleted: false,
                note: "This block type cannot be wrapped as a deletion suggestion. Retry with mode \"edit\" to delete it directly.",
              };
              return;
            }
            result = {
              deleted: true,
              note: "Marked markdown block as a deletion suggestion.",
              deletionIndex: indexInParent,
              suggestionId,
            };
          },
          { onUpdate: resolve },
        );
      });
      if (result.deleted) {
        await waitForProviderFlush(provider);
      }
      return result;
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = deleteBlockInResearchDocSchema.safeParse(body);
  if (!parseResult.success) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "validation_error",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
    });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { documentId, prefix, mode } = parseResult.data;

  try {
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { hocuspocusToken } = docAuth;

    const result = await deleteMarkdownBlockInResearchDoc({
      documentId,
      hocuspocusToken,
      prefix,
      mode,
    });

    const { threadCreationFailed } = await maybeCreateResearchSuggestionThread({
      mode,
      documentId,
      hocuspocusToken,
      suggestionId: result.suggestionId,
      conversationId: payload.conversationId,
      summaryItems: [{
        type: "delete",
        content: prefix,
      }],
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
      operationResult: result.deleted ? "deleted" : "block_not_found",
    });

    return NextResponse.json({
      ok: true,
      documentId,
      deleted: result.deleted,
      deletionIndex: result.deletionIndex ?? null,
      note: threadCreationFailed
        ? `${result.note} Warning: the suggestion was applied, but its review thread could not be created. Do not retry this edit.`
        : result.note,
      mode,
      suggestionId: result.suggestionId ?? null,
      threadCreationFailed,
      requestId: randomId(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error, {
      conversationId: payload.conversationId,
      projectId: payload.projectId,
      documentId,
    });
    return NextResponse.json(
      {
        error: "Failed to delete markdown block in research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
