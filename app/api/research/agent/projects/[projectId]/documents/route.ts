import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import { computeContextFromUser, getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { Users } from "@/server/collections/users/collection";
import { createResearchDocument } from "@/server/collections/researchDocuments/mutations";
import {
  authorizeAgentRequest,
  authorizeAgentResearchProjectAccess,
} from "../../../researchAgentAuth";
import { issueResearchDocumentHocuspocusToken } from "../../../researchHocuspocusToken";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../../captureResearchAgentAnalytics";
import { createResearchDocSchema } from "../../../researchToolSchemas";
import { validateMentionsOrRespond } from "../../../researchMentionValidation";
import { insertMarkdownBlockInResearchDoc } from "../../../documents/insertBlock/insertMarkdownBlockInResearchDoc";

const ROUTE = "projects.documents.index";
const CREATE_ROUTE = "projects.documents.create";

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
      count: documents.length,
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

/**
 * POST `/api/research/agent/projects/:projectId/documents`
 *
 * Agent-scope only. `bootstrapResearchDocumentYjsState` runs inside
 * `createResearchDocument` to seed an empty paragraph; with `initialMarkdown`
 * we insert at "start" so that seeded paragraph ends up as the doc's trailing
 * empty paragraph (matching Lexical's normal layout).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;

  const auth = authorizeAgentRequest({ req, route: CREATE_ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  const projectAuth = authorizeAgentResearchProjectAccess({
    route: CREATE_ROUTE, projectId, payload, requireAgentScope: true,
  });
  if (projectAuth.kind === "errorResponse") return projectAuth.errorResponse;

  // Agent requests have no login cookie, so the user must be resolved from
  // the (already-verified) agent token's `payload.userId` rather than from
  // the request. Build the context with that user up front so downstream
  // mutations' `currentUser` checks and `userOwns(user, project)` permission
  // checks see the right user.
  const [body, agentUser] = await Promise.all([
    req.json(),
    Users.findOne({ _id: payload.userId }),
  ]);
  if (!agentUser) {
    return NextResponse.json(
      { error: "Agent token references a user that no longer exists." },
      { status: 403 },
    );
  }
  const context = computeContextFromUser({
    user: agentUser,
    headers: req.headers,
    searchParams: req.nextUrl.searchParams,
    cookies: req.cookies.getAll(),
    isSSR: false,
  });

  const parseResult = createResearchDocSchema.safeParse(body);
  if (!parseResult.success) {
    captureResearchAgentApiEvent({
      route: CREATE_ROUTE,
      status: "validation_error",
      conversationId: payload.conversationId,
      projectId,
    });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { title, initialMarkdown } = parseResult.data;

  try {
    let canonicalMarkdown: string | null = null;
    if (initialMarkdown !== undefined && initialMarkdown.length > 0) {
      const mentionResult = await validateMentionsOrRespond({
        markdown: initialMarkdown, context, route: CREATE_ROUTE, payload,
      });
      if (!mentionResult.ok) return mentionResult.response;
      canonicalMarkdown = mentionResult.markdown;
    }

    const newDocument = await createResearchDocument({
      data: { projectId, title },
    }, context);

    let initialContentInserted = false;
    if (canonicalMarkdown !== null) {
      const hocuspocusToken = await issueResearchDocumentHocuspocusToken({
        documentId: newDocument._id,
        userId: payload.userId,
      });
      const insertResult = await insertMarkdownBlockInResearchDoc({
        documentId: newDocument._id,
        hocuspocusToken,
        location: "start",
        markdown: canonicalMarkdown,
        mode: "edit",
      });
      initialContentInserted = insertResult.inserted;
    }

    captureResearchAgentApiEvent({
      route: CREATE_ROUTE,
      status: "success",
      conversationId: payload.conversationId,
      projectId,
      documentId: newDocument._id,
      operationResult: initialContentInserted ? "created_with_content" : "created",
    });

    return NextResponse.json({
      ok: true,
      documentId: newDocument._id,
      title: newDocument.title ?? null,
      initialContentInserted,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(CREATE_ROUTE, error, {
      conversationId: payload.conversationId,
      projectId,
    });
    return NextResponse.json(
      {
        error: "Failed to create research document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
