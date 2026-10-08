/**
 * GET /api/research/conversations/:conversationId/events/stream
 *
 * The single live channel the client uses for conversation events: a
 * Server-Sent Events stream of persisted `ResearchConversationEvents` rows in
 * `seq` order, as they land. History is loaded separately via the
 * `researchConversationTranscript` query; this stream carries only the tail
 * (`seq > cursor`).
 *
 * Cursor: the browser's native `Last-Event-ID` (we set each frame's `id:` to
 * the row's `seq`) takes precedence so automatic reconnects resume exactly
 * where they left off; otherwise the `?since` query param; otherwise from the
 * start. Fan-out across all the instance's open streams is handled by the
 * per-instance `eventStreamCoordinator` (one batched DB tail per tick).
 *
 * Auth: normal user-session auth (not the supervisor callback token); the
 * caller must own the conversation (or be an admin).
 */
import { NextRequest } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { getEventStreamCoordinator } from "@/server/research/eventStreamCoordinator";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";

const KEEPALIVE_MS = 20_000;

// Close proactively before the platform's function-lifetime cap (~800s) so the
// client reconnects cleanly via Last-Event-ID rather than hitting a hard
// mid-frame cutoff.
const MAX_STREAM_LIFETIME_MS = 700_000;

function parseCursor(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;

  const context = await getContextFromReqAndRes({ req, isSSR: false });
  const currentUser = context.currentUser;
  if (!currentUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const conversation = await context.ResearchConversations.findOne({ _id: conversationId });
  if (!conversation) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (conversation.userId !== currentUser._id && !userIsAdmin(currentUser)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Browser auto-reconnect resends the last `id:` as Last-Event-ID; prefer it
  // so a reconnect resumes from exactly where the dropped stream left off.
  const sinceSeq =
    parseCursor(req.headers.get("last-event-id")) ??
    parseCursor(req.nextUrl.searchParams.get("since")) ??
    -1;

  const encoder = new TextEncoder();
  const coordinator = getEventStreamCoordinator();

  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const safeEnqueue = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          // Controller already closed (client gone) — tear down.
          cleanup();
        }
      };

      // Hint the browser's auto-reconnect backoff.
      safeEnqueue("retry: 3000\n\n");

      const unsubscribe = coordinator.subscribe(conversationId, sinceSeq, (rows) => {
        for (const row of rows) {
          safeEnqueue(`id: ${row.seq}\ndata: ${JSON.stringify(row)}\n\n`);
        }
      });

      // Comment frames keep intermediaries from closing an idle connection and
      // surface a dead socket (enqueue throws → cleanup).
      const keepalive = setInterval(() => safeEnqueue(": ping\n\n"), KEEPALIVE_MS);
      const lifetime = setTimeout(() => cleanup(), MAX_STREAM_LIFETIME_MS);
      const onAbort = () => cleanup();
      req.signal.addEventListener("abort", onAbort);

      cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        clearInterval(keepalive);
        clearTimeout(lifetime);
        req.signal.removeEventListener("abort", onAbort);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      // Disable proxy buffering so frames flush immediately.
      "X-Accel-Buffering": "no",
    },
  });
}
