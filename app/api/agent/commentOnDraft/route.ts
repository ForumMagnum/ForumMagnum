import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { authorizeAgentDraftAccess, deriveAgentAuthor } from "../editorAgentUtil";
import { insertCollabCommentThread } from "../collabCommentThreads";
import { commentOnDraftToolSchema } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false })
  ]);

  const parseResult = commentOnDraftToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "commentOnDraft", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, quote, comment } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "commentOnDraft", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;
    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });
    const threadQuote = quote ?? "";

    const { threadId, commentId, anchorStatus, anchorNote } = await insertCollabCommentThread({
      collectionName: "Posts",
      documentId: postId,
      token,
      comment,
      quote: threadQuote,
      author: authorName,
      authorId,
    });

    captureAgentApiEvent({ route: "commentOnDraft", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult: anchorStatus, threadId });
    return NextResponse.json({
      ok: true,
      postId,
      threadId,
      commentId,
      anchorStatus,
      anchorNote,
      mode: "lexical-collaboration-comment-thread",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("commentOnDraft", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to write comment to collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
