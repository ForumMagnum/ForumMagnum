import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import {
  authorizeAgentRequest,
  authorizeAgentResearchProjectAccess,
} from "../../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../../captureResearchAgentAnalytics";

const ROUTE = "projects.conversations.index";

const CONVERSATIONS_LIMIT = 500;

/**
 * GET `/api/research/agent/projects/:projectId/conversations`
 *
 * Lightweight conversation handles for the project. Returned newest-first
 * by `lastActivityAt`. Includes the entrypoint discriminator so the agent
 * can distinguish chat conversations from document-anchored ones.
 *
 * The bearer token's authorized projectId must match the URL projectId; an
 * agent cannot pivot to other projects via this endpoint.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  const projectAuth = authorizeAgentResearchProjectAccess({ route: ROUTE, projectId, payload });
  if (projectAuth.kind === "errorResponse") return projectAuth.errorResponse;

  try {
    const context = await getContextFromReqAndRes({ req, isSSR: false });
    const conversations = await context.ResearchConversations.find(
      { projectId },
      { sort: { lastActivityAt: -1 }, limit: CONVERSATIONS_LIMIT },
      { _id: 1, title: 1, lastActivityAt: 1, entrypointKind: 1 },
    ).fetch();

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId,
      count: conversations.length,
    });

    return NextResponse.json({
      ok: true,
      projectId,
      conversations: conversations.map((conv) => ({
        id: conv._id,
        kind: "conversation" as const,
        title: conv.title ?? null,
        lastActivityAt: conv.lastActivityAt ?? null,
        entrypoint: conv.entrypointKind,
      })),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error, {
      conversationId: payload.conversationId,
      projectId,
    });
    return NextResponse.json(
      {
        error: "Failed to load project conversations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
