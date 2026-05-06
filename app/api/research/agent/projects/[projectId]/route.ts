import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import {
  authorizeAgentRequest,
  authorizeAgentResearchProjectAccess,
} from "../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../captureResearchAgentAnalytics";

const ROUTE = "projects.index";

const PROJECT_INDEX_LIMIT = 500;

/**
 * GET `/api/research/agent/projects/:projectId`
 *
 * The project-level index. Returns lightweight handles for the documents and
 * conversations in the project — just the metadata an agent needs to decide
 * what to fetch in detail next. Agents fetch document contents via
 * `/documents/:id` and conversation events via `/conversations/:id/events`.
 *
 * The handle shape:
 *   document:     { id, kind: 'document', title, createdAt }
 *   conversation: { id, kind: 'conversation', title, lastActivityAt, entrypoint }
 *
 * Documents only carry `createdAt`, not `lastActivityAt`: nothing currently
 * writes a per-document activity timestamp. The Hocuspocus autosave path
 * (`hocuspocusCallbacks.ts:saveOrUpdateLexicalRevision`) early-returns for
 * non-Posts collections, and the Revisions-backed `contents` path doesn't
 * touch the row either. When a research-doc edit path bumps a real per-doc
 * timestamp, add the column and the response field together.
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
    const [documents, conversations] = await Promise.all([
      context.ResearchDocuments.find(
        { projectId },
        { sort: { createdAt: -1 }, limit: PROJECT_INDEX_LIMIT },
        { _id: 1, title: 1, createdAt: 1 },
      ).fetch(),
      context.ResearchConversations.find(
        { projectId },
        { sort: { lastActivityAt: -1 }, limit: PROJECT_INDEX_LIMIT },
        { _id: 1, title: 1, lastActivityAt: 1, entrypoint: 1 },
      ).fetch(),
    ]);

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId,
      operationResult: `documents=${documents.length},conversations=${conversations.length}`,
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
      conversations: conversations.map((conv) => ({
        id: conv._id,
        kind: "conversation" as const,
        title: conv.title ?? null,
        lastActivityAt: conv.lastActivityAt ?? null,
        entrypoint: conv.entrypoint ?? null,
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
        error: "Failed to load project index",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
