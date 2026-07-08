import { NextRequest, NextResponse } from "next/server";
import { captureException } from "@/lib/sentryWrapper";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { execInConversationSandbox } from "@/server/research/sandbox/execInSandbox";
import {
  authorizeAgentRequest,
  authorizeAgentResearchConversationAccess,
  forbiddenAgentScopeResponse,
} from "../../../researchAgentAuth";
import {
  captureResearchAgentApiEvent,
  captureResearchAgentApiFailure,
} from "../../../captureResearchAgentAnalytics";
import { execInSandboxSchema } from "../../../researchToolSchemas";

const ROUTE = "conversations.exec";

/**
 * Run a one-shot shell command in a conversation's sandbox. Unlike most agent
 * endpoints this is deliberately *cross-conversation within a project*: the
 * caller may target any conversation whose sandbox lives in the token's project,
 * so an instance can shell into a wedged sibling sandbox to inspect it (`ps`)
 * and reap a runaway (`kill`/`pkill`) without restarting that conversation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const auth = authorizeAgentRequest({ req, route: ROUTE });
  if (auth.kind === "errorResponse") return auth.errorResponse;
  const { payload } = auth;

  // Exec is powerful; require a real conversation-scoped agent token (not a
  // sandbox-wide supervisor token). Project membership is still checked below.
  if (payload.scope !== "agent") {
    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "forbidden",
      conversationId,
      projectId: payload.projectId,
      reason: "agent_scope_required",
    });
    return forbiddenAgentScopeResponse();
  }

  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = execInSandboxSchema.safeParse(body);
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

  try {
    const convAuth = await authorizeAgentResearchConversationAccess({
      route: ROUTE,
      conversationId,
      payload,
      context,
    });
    if (convAuth.kind === "errorResponse") return convAuth.errorResponse;

    const { cmd, args, cwd, sudo, timeoutMs, resumeIfStopped } = parseResult.data;
    const result = await execInConversationSandbox(conversationId, {
      cmd,
      args,
      cwd,
      sudo,
      timeoutMs,
      resumeIfStopped,
    });

    if (result.kind === "notRunning") {
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "success",
        conversationId,
        projectId: payload.projectId,
        operationResult: "not_running",
      });
      return NextResponse.json({
        ok: false,
        conversationId,
        status: "not_running",
        note: "The target sandbox is not currently running. Pass resumeIfStopped to boot it from its snapshot — but note a stopped sandbox has no live process to kill, and resuming starts a fresh session.",
      });
    }

    if (result.kind === "notFound") {
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "not_found",
        conversationId,
        projectId: payload.projectId,
      });
      return NextResponse.json({
        ok: false,
        conversationId,
        status: "not_found",
        note: "No sandbox exists for this conversation (never provisioned, or its snapshot expired).",
      });
    }

    if (result.kind === "timedOut") {
      captureResearchAgentApiEvent({
        route: ROUTE,
        status: "success",
        conversationId,
        projectId: payload.projectId,
        operationResult: "timed_out",
      });
      return NextResponse.json({
        ok: false,
        conversationId,
        status: "timed_out",
        timeoutMs: result.timeoutMs,
        resumed: result.resumed,
      });
    }

    captureResearchAgentApiEvent({
      route: ROUTE,
      status: "success",
      conversationId,
      projectId: payload.projectId,
      operationResult: "ran",
      charCount: result.stdout.length + result.stderr.length,
    });
    return NextResponse.json({
      ok: true,
      conversationId,
      status: "ran",
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      truncated: result.truncated,
      resumed: result.resumed,
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
        error: "Failed to exec in sandbox",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
