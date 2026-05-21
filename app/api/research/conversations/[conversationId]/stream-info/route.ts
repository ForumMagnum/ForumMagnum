/**
 * GET /api/research/conversations/:conversationId/stream-info
 *
 * The discovery hop the client uses to find the live SSE endpoint for a
 * conversation. Distinct from the `/api/research/agent/*` family — this one
 * uses normal user-session auth, not the supervisor's signed callback token.
 *
 * Returns:
 *   { sseUrl, token, expiresAt }
 *     when the conversation's sandbox is currently running. The client opens
 *     `${sseUrl}?token=${token}` and re-fetches this endpoint when the
 *     connection drops or the token nears expiry.
 *   { sseUrl: null, token: null, expiresAt: null }
 *     when the sandbox is stopped or was never provisioned. The client falls
 *     back to reading persisted `ResearchConversationEvents`.
 *
 * The supervisor's public URL changes every session, so it is derived live
 * from the sandbox handle, never read from a stored column. The minted token
 * uses the per-sandbox `supervisorSecret` from the `ResearchSandboxSessions`
 * row; the supervisor validates it against its env-injected copy.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { signSupervisorToken } from "@/server/research/sandbox/supervisor/auth";
import {
  getRunningSandbox,
  sandboxNameForConversation,
  supervisorUrlForSandbox,
} from "@/server/research/sandbox/sandboxManager";

const STREAM_TOKEN_TTL_MS = 5 * 60 * 1000;

interface StreamInfoLive {
  sseUrl: string;
  token: string;
  expiresAt: string;
}

interface StreamInfoIdle {
  sseUrl: null;
  token: null;
  expiresAt: null;
}

const idle: StreamInfoIdle = { sseUrl: null, token: null, expiresAt: null };

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const currentUser = await getUserFromReq(req);
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await getContextFromReqAndRes({ req, isSSR: false });

  const conversation = await context.ResearchConversations.findOne({ _id: conversationId });
  if (!conversation) {
    // Inline /query creates an AgentBlock with a client-generated conversation id
    // before the mutation has inserted the row. Treat that short window as idle
    // so the client can poll without surfacing a transient error.
    return NextResponse.json(idle);
  }
  const project = await context.ResearchProjects.findOne({ _id: conversation.projectId });
  if (!project || project.userId !== currentUser._id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The conversation's sandbox is reachable only while it is running. If it is
  // stopped or was never provisioned, report idle — the client reads persisted
  // events and re-polls this endpoint when a future turn brings a sandbox up.
  const sandbox = await getRunningSandbox(conversationId);
  if (!sandbox) {
    return NextResponse.json(idle);
  }

  const session = await context.ResearchSandboxSessions.findOne({ conversationId });
  if (!session) {
    return NextResponse.json(idle);
  }

  const expiresAt = Date.now() + STREAM_TOKEN_TTL_MS;
  const token = signSupervisorToken(
    {
      sandboxId: sandboxNameForConversation(conversationId),
      expiresAt,
      scope: conversationId,
    },
    session.supervisorSecret,
  );
  const sseUrl = `${supervisorUrlForSandbox(sandbox)}/sse/${encodeURIComponent(conversationId)}`;

  const response: StreamInfoLive = {
    sseUrl,
    token,
    expiresAt: new Date(expiresAt).toISOString(),
  };
  return NextResponse.json(response);
}
