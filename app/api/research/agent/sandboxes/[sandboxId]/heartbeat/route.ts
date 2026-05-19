/**
 * POST /api/research/agent/sandboxes/:sandboxId/heartbeat
 *
 * Supervisor → backend periodic report (~every 10s). It drives the idle/roll
 * policy: on each heartbeat the backend resolves the live sandbox and either
 * re-arms its idle timeout (a turn is running) or rolls it (no turn, and the
 * session is near Vercel's 5h cap). The row is never written.
 *
 * `:sandboxId` is the persistent sandbox name (`research-{conversationId}`),
 * which must match the `sandboxId` claim of the supervisor's callback token.
 *
 * Auth: the same sandbox-callback bearer token the supervisor sends on its
 * events POST, received at provision time as `CALLBACK_TOKEN`.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureException } from "@/lib/sentryWrapper";
import { authorizeAgentRequest } from "../../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../../captureResearchAgentAnalytics";
import {
  conversationIdFromSandboxName,
  getRunningSandbox,
  maintainSandboxTimeout,
} from "@/server/research/sandbox/sandboxManager";

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

  const parseResult = heartbeatSchema.safeParse(await req.json());
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

  const conversationId = conversationIdFromSandboxName(sandboxId);
  if (!conversationId) {
    return NextResponse.json({ error: "Malformed sandbox name." }, { status: 400 });
  }

  try {
    const turnRunning = parseResult.data.conversations.some((c) => c.status === "running");
    // The heartbeat came from the supervisor, so the sandbox is running.
    const sandbox = await getRunningSandbox(conversationId);
    if (sandbox) {
      await maintainSandboxTimeout(sandbox, { turnRunning });
    }

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      projectId: payload.projectId,
      operationResult: `turnRunning=${turnRunning}`,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureResearchAgentApiFailure(ROUTE, error, { projectId: payload.projectId });
    return NextResponse.json(
      {
        error: "Failed to process heartbeat",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
