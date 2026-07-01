import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { deriveAgentAuthor, authorizeAgentDraftAccess } from "../editorAgentUtil";
import { appendReplyToCommentThread } from "../collabCommentThreads";
import { replyToCommentToolSchema } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = replyToCommentToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "replyToComment", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { postId, key, agentName, threadId, comment } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "replyToComment", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;

    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });

    const result = await appendReplyToCommentThread({
      collectionName: "Posts",
      documentId: postId,
      token,
      threadId,
      comment,
      author: authorName,
      authorId,
    });

    if (result.kind === "thread_not_found") {
      captureAgentApiEvent({ route: "replyToComment", postId, userId: context.currentUser?._id, agentName, status: "internal_error", errorCategory: "thread_not_found" });
      return NextResponse.json(
        { error: `Thread not found: ${threadId}` },
        { status: 400 },
      );
    }

    captureAgentApiEvent({ route: "replyToComment", postId, userId: context.currentUser?._id, agentName, status: "success" });
    return NextResponse.json({
      ok: true,
      postId,
      threadId,
      commentId: result.commentId,
      note: "Reply added to thread.",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("replyToComment", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to reply to comment thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
