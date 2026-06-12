import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { appendReplyToCommentThread } from "../../../../agent/collabCommentThreads";
import {
  authorizeAgentRequest,
  authorizeAgentResearchDocumentAccess,
  forbiddenAgentScopeResponse,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";
import { replyToResearchDocCommentSchema } from "../../researchToolSchemas";
import { RESEARCH_AGENT_AUTHOR_NAME } from "../../researchSuggestionThreads";

const ROUTE = "documents.replyToComment";

/**
 * POST `/api/research/agent/documents/replyToComment`
 *
 * Append a reply to an existing comment/suggestion thread in a research
 * document's `/comments` Yjs subdocument. Thread IDs come from the
 * "Comment Threads" section of the fetch-doc response.
 */
export async function POST(req: NextRequest) {
  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = replyToResearchDocCommentSchema.safeParse(body);
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

  const { documentId, threadId, comment } = parseResult.data;
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

    const result = await appendReplyToCommentThread({
      collectionName: "ResearchDocuments",
      documentId,
      token: hocuspocusToken,
      threadId,
      comment,
      author: RESEARCH_AGENT_AUTHOR_NAME,
      authorId: conversationId,
    });

    if (result.kind === "thread_not_found") {
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "not_found",
        conversationId,
        projectId: payload.projectId,
        documentId,
        reason: "thread_not_found",
      });
      return NextResponse.json(
        { error: `Thread not found: ${threadId}` },
        { status: 400 },
      );
    }

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId,
      projectId: payload.projectId,
      documentId,
    });

    return NextResponse.json({
      ok: true,
      documentId,
      threadId,
      commentId: result.commentId,
      note: "Reply added to thread.",
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
        error: "Failed to reply to comment thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
