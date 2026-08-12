import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { getMarkdownItNoMathjax } from "@/lib/utils/markdownItPlugins";
import { sanitize } from "@/lib/utils/sanitize";
import {
  authorizeAgentRequest,
  authorizeAgentResearchConversationAccess,
} from "../../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../../captureResearchAgentAnalytics";
import { setConversationPresentationSchema } from "../../../researchToolSchemas";

const ROUTE = "conversations.presentation.set";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  if (payload.conversationId !== conversationId) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "forbidden",
      conversationId,
      projectId: payload.projectId,
      reason: "presentation_for_foreign_conversation",
    });
    return NextResponse.json(
      { error: "A conversation can only set its own presentation" },
      { status: 403 },
    );
  }

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = setConversationPresentationSchema.safeParse(body);
  if (!parseResult.success) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "validation_error",
      conversationId,
      projectId: payload.projectId,
    });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { markdown } = parseResult.data;

  try {
    const convAuth = await authorizeAgentResearchConversationAccess({
      route: ROUTE,
      conversationId,
      payload,
      context,
    });
    if (convAuth.kind === "errorResponse") return convAuth.errorResponse;

    const trimmed = markdown?.trim() ?? "";
    const presentationHtml = trimmed.length > 0
      ? sanitize(getMarkdownItNoMathjax().render(trimmed))
      : null;

    await context.ResearchConversations.rawUpdateOne(
      { _id: conversationId },
      { $set: { presentationHtml } },
    );

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId,
      projectId: payload.projectId,
      operationResult: presentationHtml ? "set" : "cleared",
    });

    return NextResponse.json({
      ok: true,
      conversationId,
      cleared: presentationHtml === null,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error, {
      conversationId,
      projectId: payload.projectId,
    });
    return NextResponse.json(
      {
        error: "Failed to set conversation presentation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
