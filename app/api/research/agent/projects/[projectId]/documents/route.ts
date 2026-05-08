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

const ROUTE = "projects.documents.index";

const DOCUMENTS_LIMIT = 500;

/**
 * GET `/api/research/agent/projects/:projectId/documents`
 *
 * Lightweight document handles for the project. The agent fetches a
 * specific document's contents via `/documents/:id`. Returned newest-first
 * by `createdAt`.
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
    const documents = await context.ResearchDocuments.find(
      { projectId },
      { sort: { createdAt: -1 }, limit: DOCUMENTS_LIMIT },
      { _id: 1, title: 1, createdAt: 1 },
    ).fetch();

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId,
      operationResult: `documents=${documents.length}`,
    });

    return NextResponse.json({
      ok: true,
      projectId,
      documents: documents.map((doc) => ({
        id: doc._id,
        kind: "document" as const,
        title: doc.title ?? null,
        createdAt: doc.createdAt ?? null,
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
        error: "Failed to load project documents",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
