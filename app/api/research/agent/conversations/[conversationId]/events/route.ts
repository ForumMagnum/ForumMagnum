import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const POST_ROUTE = "conversations.events.post";

const eventKindSchema = z.enum([
  "user",
  "assistant",
  "tool_use",
  "tool_result",
  "thinking",
  "system",
  "error",
  // Per-turn metadata wrapper (`subtype`, `duration_ms`, `usage`,
  // `is_error`). Claude Code emits exactly one per turn, regardless of how
  // many intermediate events the turn produced, so we use it as a robust
  // turn-end signal in the UI. Skipped during `writeBootstrapJsonl` so it
  // never lands back in Claude's resume context.
  "result",
]);

/**
 * POST body shape — single event per request, contract owned jointly with T2.
 *
 * `rawJsonl` is the supervisor's verbatim JSONL line text and is the canonical
 * payload; we parse it server-side into the JSONB `payload` column. The
 * envelope fields (`kind`, `claudeMessageUuid`, `claudeSessionId`,
 * `supervisorEmittedAt`) are extracted by the supervisor for indexing and
 * could be re-derived from `rawJsonl` — they're sent alongside so the backend
 * doesn't need a JSONL parser of its own and `rawJsonl` parse failures don't
 * turn an indexable event into an unindexable one.
 *
 * Server assigns `seq` atomically (max+1 per conversation). Idempotent on
 * `(conversationId, claudeMessageUuid)` when the UUID is non-null — duplicate
 * POSTs return the existing row's seq with `deduplicated: true`.
 */
const postBodySchema = z.object({
  rawJsonl: z.string().min(1),
  kind: eventKindSchema,
  claudeMessageUuid: z.string().min(1),
  claudeSessionId: z.string().optional(),
  supervisorEmittedAt: z.string().datetime().optional(),
});

/**
 * POST `/api/research/agent/conversations/:conversationId/events`
 *
 * The supervisor's persistence callback. Inserts one ResearchConversationEvent
 * with server-assigned seq, idempotent on `(conversationId, claudeMessageUuid)`.
 * Bumps `lastActivityAt` on the conversation when a new row is written
 * (skipped on dedupe so we don't "renew" activity from a stale retry).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const auth = authorizeAgentRequest({ req, route: POST_ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  // `agent`-scope tokens are bound to one conversation and must match the
  // URL. `supervisor`-scope tokens are sandbox-wide — they can post for any
  // conversation in the project they authorize. We still validate that the
  // conversation actually lives in that project before accepting writes.
  if (payload.scope === "agent") {
    if (payload.conversationId !== conversationId) {
      captureResearchAgentApiEvent({
        route: POST_ROUTE,
        status: "forbidden",
        conversationId,
        projectId: payload.projectId,
        reason: "token_conversation_mismatch",
      });
      return NextResponse.json(
        { error: "Forbidden: the bearer token authorizes a different conversation." },
        { status: 403 },
      );
    }
  }

  try {
    const context = await getContextFromReqAndRes({ req, isSSR: false });
    const convAuth = await authorizeAgentResearchConversationAccess({
      route: POST_ROUTE,
      conversationId,
      payload,
      context,
    });
    if (convAuth.kind === "errorResponse") return convAuth.errorResponse;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      captureResearchAgentApiEvent({
        route: POST_ROUTE,
        status: "validation_error",
        conversationId,
        projectId: payload.projectId,
        reason: "invalid_json",
      });
      return NextResponse.json(
        { error: "Invalid request body: expected JSON" },
        { status: 400 },
      );
    }

    const parseResult = postBodySchema.safeParse(body);
    if (!parseResult.success) {
      captureResearchAgentApiEvent({
        route: POST_ROUTE,
        status: "validation_error",
        conversationId,
        projectId: payload.projectId,
      });
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 },
      );
    }

    const { rawJsonl, kind, claudeMessageUuid } = parseResult.data;

    // Parse the verbatim line into a JSON object for the JSONB column.
    // A parse failure means the supervisor sent a malformed line — return
    // 400 so the supervisor can drop (not retry) the bad event.
    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(rawJsonl);
    } catch {
      captureResearchAgentApiEvent({
        route: POST_ROUTE,
        status: "validation_error",
        conversationId,
        projectId: payload.projectId,
        reason: "rawJsonl_parse_failed",
      });
      return NextResponse.json(
        { error: "Invalid request body: rawJsonl is not valid JSON" },
        { status: 400 },
      );
    }

    const result = await context.repos.researchConversationEvents.persistEvent(
      conversationId,
      { claudeMessageUuid, kind, payload: parsedPayload },
    );

    if (!result.deduplicated) {
      await context.ResearchConversations.rawUpdateOne(
        { _id: conversationId },
        { $set: { lastActivityAt: new Date() } },
      );
    }

    captureResearchAgentApiEvent({
      route: POST_ROUTE,
      status: "success",
      conversationId,
      projectId: payload.projectId,
      operationResult: result.deduplicated ? "deduplicated" : "persisted",
    });

    return NextResponse.json({
      ok: true,
      seq: result.seq,
      deduplicated: result.deduplicated,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(POST_ROUTE, error, {
      conversationId,
      projectId: payload.projectId,
    });
    return NextResponse.json(
      {
        error: "Failed to persist conversation events",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

