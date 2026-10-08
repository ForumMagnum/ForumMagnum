import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { insertCollabCommentThread } from "../../../../agent/collabCommentThreads";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
  forbiddenAgentScopeResponse,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { commentOnResearchDocSchema } from "../../researchToolSchemas";
import { RESEARCH_AGENT_AUTHOR_NAME } from "../../researchSuggestionThreads";

const ROUTE = "documents.commentOnDocument";

/**
 * POST `/api/research/agent/documents/commentOnDocument`
 *
 * Create a comment thread on a research document, optionally anchored to a
 * quote (which gets wrapped in a MarkNode in the main document, exactly like
 * the Posts-side `commentOnDraft`). The thread lands in the document's
 * `/comments` Yjs subdocument and shows up live in the research editor's
 * comments panel.
 */
export async function POST(req: NextRequest) {
  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = commentOnResearchDocSchema.safeParse(body);
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

  const { documentId, quote, comment } = parseResult.data;
  const conversationId = payload.conversationId;
  if (!conversationId) {
    return forbiddenAgentScopeResponse();
  }

  try {
    const docAuth = await authorizeAgentResearchDocumentAccess({
      route: ROUTE,
      documentId,
      payload,
      context,
    });
    if (docAuth.kind === "errorResponse") return docAuth.errorResponse;
    const { hocuspocusToken } = docAuth;

    const { threadId, commentId, anchorStatus, anchorNote } = await insertCollabCommentThread({
      collectionName: "ResearchDocuments",
      documentId,
      token: hocuspocusToken,
      comment,
      quote: quote ?? "",
      author: RESEARCH_AGENT_AUTHOR_NAME,
      authorId: conversationId,
    });

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId,
      projectId: payload.projectId,
      documentId,
      operationResult: anchorStatus,
    });

    return NextResponse.json({
      ok: true,
      documentId,
      threadId,
      commentId,
      anchorStatus,
      anchorNote,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error, {
      conversationId,
      projectId: payload.projectId,
      documentId,
    });
    return NextResponse.json(
      {
        error: "Failed to write comment to research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
