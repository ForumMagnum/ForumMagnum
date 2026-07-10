import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import {
  authorizeAgentRequest,
  authorizeAgentResearchConversationAccess,
} from "../../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../../captureResearchAgentAnalytics";
import {
  getAgentTranscriptTurns,
  isTurnInFlight,
  type TranscriptOptions,
} from "@/components/research/conversationEventFormat";

const ROUTE = "conversations.transcript.get";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  const url = new URL(req.url);
  const options: TranscriptOptions = {
    withThinking: parseBoolFlag(url.searchParams.get("withThinking")),
    withToolPayloads: parseBoolFlag(url.searchParams.get("withToolPayloads")),
  };

  try {
    const context = await getContextFromReqAndRes({ req, isSSR: false });
    const convAuth = await authorizeAgentResearchConversationAccess({
      route: ROUTE,
      conversationId,
      payload,
      context,
    });
    if (convAuth.kind === "errorResponse") return convAuth.errorResponse;
    const { conversation } = convAuth;

    if (parseBoolFlag(url.searchParams.get("danglingCheck"))) {
      const incompleteTurn = await context.repos.researchConversationEvents.hasIncompleteTurn(conversationId);
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "success",
        conversationId,
        projectId: payload.projectId,
        operationResult: "danglingCheck",
      });
      return NextResponse.json({
        ok: true,
        conversationId,
        incompleteTurn,
      });
    }

    const events = await context.ResearchConversationEvents.find(
      { conversationId },
      { sort: { seq: 1 }, limit: 5000 },
    ).fetch();

    const turns = getAgentTranscriptTurns(events, options);
    const incompleteTurn = isTurnInFlight(events, Date.now());

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId,
      projectId: payload.projectId,
      count: turns.length,
    });

    return NextResponse.json({
      ok: true,
      conversationId,
      title: conversation.title ?? null,
      turns,
      incompleteTurn,
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
        error: "Failed to read conversation transcript",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

function parseBoolFlag(raw: string | null): boolean {
  if (raw === null) return false;
  return raw === "1" || raw.toLowerCase() === "true";
}
