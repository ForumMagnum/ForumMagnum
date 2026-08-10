import { NextRequest, NextResponse } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { captureException } from "@/lib/sentryWrapper";
import { authorizeAgentDraftAccess, deriveAgentAuthor } from "../editorAgentUtil";
import { resolveCollabCommentThread } from "../collabCommentThreads";
import { resolveCommentToolSchema } from "../toolSchemas";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = resolveCommentToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "resolveComment", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { postId, key, agentName, threadId } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "resolveComment", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;

    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });
    const allowAuthorNameFallback = !context.currentUser && !context.clientId && !!agentName;
    const result = await resolveCollabCommentThread({
      collectionName: "Posts",
      documentId: postId,
      token: auth.token,
      threadId,
      authorId,
      authorName,
      allowAuthorNameFallback,
    });

    if (result.kind === "thread_not_found") {
      captureAgentApiEvent({ route: "resolveComment", postId, userId: context.currentUser?._id, agentName, status: "internal_error", errorCategory: "thread_not_found", threadId });
      return NextResponse.json(
        { error: `Thread not found: ${threadId}` },
        { status: 404 },
      );
    }
    if (result.kind === "not_comment_thread") {
      captureAgentApiEvent({ route: "resolveComment", postId, userId: context.currentUser?._id, agentName, status: "validation_error", errorCategory: "not_comment_thread", threadId });
      return NextResponse.json(
        { error: "Only comment threads can be resolved with this endpoint." },
        { status: 400 },
      );
    }
    if (result.kind === "not_author") {
      captureAgentApiEvent({ route: "resolveComment", postId, userId: context.currentUser?._id, agentName, status: "unauthorized", errorCategory: "not_thread_author", threadId });
      return NextResponse.json(
        { error: "This endpoint can only resolve a comment thread created by the same agent identity." },
        { status: 403 },
      );
    }

    const operationResult = result.alreadyResolved ? "already_resolved" : "resolved";
    captureAgentApiEvent({ route: "resolveComment", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult, threadId });
    return NextResponse.json({
      ok: true,
      postId,
      threadId,
      resolved: !result.alreadyResolved,
      note: result.alreadyResolved
        ? "Comment thread was already resolved."
        : "Comment thread resolved.",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("resolveComment", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to resolve comment thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
