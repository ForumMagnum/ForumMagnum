/**
 * GET /api/research/conversations/:conversationId/stream-info
 *
 * The discovery hop the client uses to find the live SSE endpoint for a
 * conversation. Distinct from the `/api/research/agent/*` family — this one
 * uses normal user-session auth, not the supervisor's signed callback token.
 *
 * Returns:
 *   { sseUrl: string, token: string, expiresAt: string }
 *     when a sandbox is currently hosting the conversation. The client should
 *     open `${sseUrl}?token=${token}` and reconnect via this endpoint when
 *     the connection drops or the token is near expiry.
 *   { sseUrl: null, token: null, expiresAt: null }
 *     when no live sandbox serves the conversation. The client falls back to
 *     reading `ResearchConversationEvents` and polls/refreshes for a future
 *     sandbox to come up (e.g. after a `continueResearchConversation` call).
 *
 * The minted token uses the per-sandbox `supervisorSecret` (stored on the
 * `ResearchSandboxSessions` row at provision time). The supervisor inside the
 * sandbox validates incoming tokens against the env-injected copy of the
 * same secret.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getUserFromReq } from "@/server/vulcan-lib/apollo-server/getUserFromReq";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { signSupervisorToken } from "@/server/research/sandbox/supervisor/auth";

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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const project = await context.ResearchProjects.findOne({ _id: conversation.projectId });
  if (!project || project.userId !== currentUser._id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Pick the most-recently-active live sandbox for this user/project. The
  // `byUserAndProject` view sorts by lastUsedAt desc; we filter to active rows
  // in code rather than at the view layer to keep that view simple.
  const sessions = await context.ResearchSandboxSessions.find(
    {
      userId: currentUser._id,
      projectId: conversation.projectId,
      status: "active",
    },
    { sort: { lastUsedAt: -1 }, limit: 5 },
  ).fetch();

  if (sessions.length === 0) {
    return NextResponse.json(idle);
  }

  // Live state of "which conversation is on which sandbox" lives in supervisor
  // memory (per design doc); the DB doesn't track it. For the prototype, we
  // pick the freshest active sandbox; the client sends along the conversationId
  // and the supervisor returns 404 if it isn't actually hosting it. In that
  // case the client falls back to idle.
  const session = sessions[0];

  const expiresAt = Date.now() + STREAM_TOKEN_TTL_MS;
  const token = signSupervisorToken(
    {
      sandboxId: session.vercelSandboxId,
      expiresAt,
      scope: conversationId,
    },
    session.supervisorSecret,
  );
  const sseUrl = `${session.endpointUrl.replace(/\/$/, "")}/sse/${encodeURIComponent(conversationId)}`;

  const response: StreamInfoLive = {
    sseUrl,
    token,
    expiresAt: new Date(expiresAt).toISOString(),
  };
  return NextResponse.json(response);
}
