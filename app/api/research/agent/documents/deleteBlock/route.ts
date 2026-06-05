import { NextRequest, NextResponse } from "next/server";
import { $getRoot } from "lexical";
import { randomId } from "@/lib/random";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { waitForProviderFlush } from "../../../../agent/editorAgentUtil";
import {
  buildNodeMarkdownMapForSubtree,
  findBlockToOperateOnByPrefix,
  toPlainTextFilter,
} from "../../../../agent/mapMarkdownToLexical";
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

const ROUTE = "documents.deleteBlock";

interface DeleteBlockResult {
  deleted: boolean;
  note: string;
  deletionIndex?: number;
}

async function deleteMarkdownBlockInResearchDoc({
  documentId,
  hocuspocusToken,
  prefix,
}: {
  documentId: string;
  hocuspocusToken: string;
  prefix: string;
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
            const rootChildren = root.getChildren();
            const textFilter = toPlainTextFilter(prefix);
            const mapResult = buildNodeMarkdownMapForSubtree(root.getKey(), textFilter);
            const nodeToDelete = findBlockToOperateOnByPrefix({ rootChildren, prefix, mapResult, textFilter });
            if (!nodeToDelete) {
              result = {
                deleted: false,
                note: `No paragraph or list item markdown starts with locator text: ${prefix}`,
              };
              return;
            }
            const parent = nodeToDelete.getParent();
            if (!parent) {
              result = { deleted: false, note: "Matched block has no parent and cannot be deleted." };
              return;
            }
            const indexInParent = nodeToDelete.getIndexWithinParent();
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

  const { documentId, prefix } = parseResult.data;

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
      note: result.note,
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
