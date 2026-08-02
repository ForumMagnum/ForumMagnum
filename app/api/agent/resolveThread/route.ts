import { captureException } from "@/lib/sentryWrapper";
import { CLIENT_ID_NEW_COOKIE } from "@/lib/cookies/cookies";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";
import { resolveCollabCommentThread } from "../collabCommentThreads";
import { authorizeAgentDraftAccess } from "../editorAgentUtil";
import { resolveThreadToolSchema } from "../toolSchemas";

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = resolveThreadToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "resolveThread", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { postId, key, agentName, threadId } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "resolveThread", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;

    const hasNewlyAssignedClientId = !!req.cookies.get(CLIENT_ID_NEW_COOKIE);
    const actorAuthorId = context.currentUser?._id
      ?? (hasNewlyAssignedClientId ? undefined : context.clientId ?? undefined);
    const actorAuthorName = agentName ?? context.currentUser?.displayName ?? undefined;
    const result = await resolveCollabCommentThread({
      collectionName: "Posts",
      documentId: postId,
      token: auth.token,
      threadId,
      actorAuthorId,
      actorAuthorName,
    });

    if (result.kind === "thread_not_found") {
      captureAgentApiEvent({ route: "resolveThread", postId, userId: context.currentUser?._id, agentName, status: "validation_error", errorCategory: "thread_not_found", threadId });
      return NextResponse.json({ error: `Thread not found: ${threadId}` }, { status: 404 });
    }
    if (result.kind === "wrong_thread_type") {
      captureAgentApiEvent({ route: "resolveThread", postId, userId: context.currentUser?._id, agentName, status: "validation_error", errorCategory: "wrong_thread_type", threadId });
      return NextResponse.json(
        { error: "Only comment threads can be resolved; suggestions must be accepted or rejected." },
        { status: 400 },
      );
    }
    if (result.kind === "not_open") {
      captureAgentApiEvent({ route: "resolveThread", postId, userId: context.currentUser?._id, agentName, status: "validation_error", errorCategory: "thread_not_open", threadId });
      return NextResponse.json(
        { error: `Thread is already ${result.status}.` },
        { status: 409 },
      );
    }
    if (result.kind === "forbidden") {
      captureAgentApiEvent({ route: "resolveThread", postId, userId: context.currentUser?._id, agentName, status: "unauthorized", errorCategory: result.reason, threadId });
      const error = result.reason === "agent_name_required"
        ? "Pass the same agentName that was used to create the thread."
        : "Agents may only resolve comment threads that they authored.";
      return NextResponse.json({ error }, { status: 403 });
    }

    captureAgentApiEvent({ route: "resolveThread", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: "archived", threadId });
    return NextResponse.json({
      ok: true,
      postId,
      threadId,
      note: "Comment thread resolved.",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("resolveThread", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to resolve comment thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
