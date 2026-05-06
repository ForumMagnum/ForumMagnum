/**
 * POST /api/research/agent/sandboxes/:sandboxId/heartbeat
 *
 * Supervisor → backend periodic report. The receiving side writes the freshest
 * supervisor-reported numbers (`concurrencyCount`, pressure metrics) onto the
 * `ResearchSandboxSessions` row so `sandboxManager`'s spillover decision uses
 * authoritative data instead of stale or in-memory state.
 *
 * Auth: same sandbox-callback bearer token T3 uses on the events POST. The
 * supervisor receives the token at provision time as `CALLBACK_TOKEN` and
 * sends it on every outbound request. The token's `sandboxId` claim must
 * match the URL `:sandboxId` to prevent one sandbox impersonating another.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { authorizeAgentRequest } from "../../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../../captureResearchAgentAnalytics";

const ROUTE = "sandboxes.heartbeat.post";

const conversationStateSchema = z.object({
  conversationId: z.string(),
  status: z.enum(["idle", "running", "completed", "errored", "cancelled"]),
  startedAt: z.number().optional(),
  endedAt: z.number().optional(),
  bytesEmitted: z.number().optional(),
});

const heartbeatSchema = z.object({
  sandboxId: z.string(),
  reportedAt: z.string(),
  activeConversationCount: z.number().int().nonnegative(),
  conversations: z.array(conversationStateSchema),
  memoryPressure: z.number().min(0).max(1),
  cpuPressure: z.number().min(0).max(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> },
) {
  const { sandboxId } = await params;

  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  if (payload.sandboxId !== sandboxId) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "forbidden",
      projectId: payload.projectId,
      conversationId: payload.conversationId,
      reason: "token_sandbox_mismatch",
    });
    return NextResponse.json(
      { error: "Forbidden: the bearer token authorizes a different sandbox." },
      { status: 403 },
    );
  }

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = heartbeatSchema.safeParse(body);
  if (!parseResult.success) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "validation_error",
      projectId: payload.projectId,
    });
    return NextResponse.json(
      { error: "Invalid heartbeat body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  if (parseResult.data.sandboxId !== sandboxId) {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "validation_error",
      projectId: payload.projectId,
      reason: "body_sandbox_mismatch",
    });
    return NextResponse.json(
      { error: "Heartbeat body sandboxId does not match URL." },
      { status: 400 },
    );
  }

  try {
    const session = await context.ResearchSandboxSessions.findOne({
      vercelSandboxId: sandboxId,
      userId: payload.userId,
      projectId: payload.projectId,
    });
    if (!session) {
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "not_found",
        projectId: payload.projectId,
      });
      return NextResponse.json(
        { error: "Sandbox session row not found for this token." },
        { status: 404 },
      );
    }

    await context.ResearchSandboxSessions.rawUpdateOne(
      { _id: session._id },
      {
        $set: {
          concurrencyCount: parseResult.data.activeConversationCount,
          lastUsedAt: new Date(parseResult.data.reportedAt),
        },
      },
    );

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      projectId: payload.projectId,
      operationResult: `concurrency=${parseResult.data.activeConversationCount},mem=${parseResult.data.memoryPressure.toFixed(
        2,
      )},cpu=${parseResult.data.cpuPressure.toFixed(2)}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error, {
      projectId: payload.projectId,
    });
    return NextResponse.json(
      {
        error: "Failed to record heartbeat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
