import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAgentDraftAccess } from "../editorAgentUtil";
import { resolveCollabCommentThread } from "../collabCommentThreads";
import { resolveCommentThreadToolSchema } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = resolveCommentThreadToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "resolveCommentThread", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { postId, key, agentName, threadId } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "resolveCommentThread", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;

    const result = await resolveCollabCommentThread({
      collectionName: "Posts",
      documentId: postId,
      token,
      threadId,
    });

    switch (result.kind) {
      case "thread_not_found":
        captureAgentApiEvent({ route: "resolveCommentThread", postId, userId: context.currentUser?._id, agentName, status: "internal_error", errorCategory: "thread_not_found" });
        return NextResponse.json(
          { error: `Thread not found: ${threadId}` },
          { status: 400 },
        );
      case "not_a_comment_thread":
        captureAgentApiEvent({ route: "resolveCommentThread", postId, userId: context.currentUser?._id, agentName, status: "internal_error", errorCategory: "not_a_comment_thread" });
        return NextResponse.json(
          { error: `Thread ${threadId} is a suggestion thread. Suggestions are accepted or rejected by the author in the editor, not resolved.` },
          { status: 400 },
        );
      case "already_closed":
        captureAgentApiEvent({ route: "resolveCommentThread", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: "already_closed" });
        return NextResponse.json({
          ok: true,
          postId,
          threadId,
          resolved: false,
          note: `Thread is not open (status: ${result.status}); nothing to do.`,
        });
      case "success":
        captureAgentApiEvent({ route: "resolveCommentThread", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: "resolved" });
        return NextResponse.json({
          ok: true,
          postId,
          threadId,
          resolved: true,
          note: "Thread resolved and its highlight removed. Users can still see it among resolved threads in the editor.",
        });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("resolveCommentThread", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to resolve comment thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
