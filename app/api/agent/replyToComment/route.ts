import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Map as YMap, Array as YArray, Doc } from "yjs";
import { randomId } from "@/lib/random";
import { deriveAgentAuthor, waitForProviderFlush, waitForProviderSync } from "../editorAgentUtil";

import { createCollabComment } from "../commentOnDraft/route";
import { replyToCommentToolSchema } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";
import { getHocuspocusToken } from "../getHocuspocusToken";

function findThreadCommentsArray(
  commentsArray: YArray<unknown>,
  threadId: string,
): YArray<unknown> | null {
  for (let i = 0; i < commentsArray.length; i++) {
    const entry = commentsArray.get(i) as YMap<unknown>;
    if (entry.get("type") === "thread" && entry.get("id") === threadId) {
      return (entry.get("comments") as YArray<unknown> | undefined) ?? null;
    }
  }
  return null;
}

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
    const token = await getHocuspocusToken(context, postId, key);
    if (!token) {
      captureAgentApiEvent({ route: "replyToComment", postId, userId: context.currentUser?._id, agentName, status: "unauthorized" });
      return NextResponse.json(
        { error: "Unauthorized to comment on draft" },
        { status: 403 },
      );
    }

    const wsUrl = process.env.HOCUSPOCUS_URL;
    if (!wsUrl) {
      captureAgentApiEvent({ route: "replyToComment", postId, userId: context.currentUser?._id, agentName, status: "internal_error", errorCategory: "missing_config" });
      return NextResponse.json(
        { error: "HOCUSPOCUS_URL is not configured" },
        { status: 500 },
      );
    }

    const { authorId, authorName } = deriveAgentAuthor({ context, args: { agentName } });

    const doc = new Doc();
    const provider = new HocuspocusProvider({
      url: wsUrl,
      name: `post-${postId}/comments`,
      document: doc,
      token,
      connect: false,
    });

    try {
      await provider.connect();
      await waitForProviderSync(provider);

      const commentsArray = doc.get("comments", YArray);
      const threadComments = findThreadCommentsArray(commentsArray, threadId);
      if (!threadComments) {
        captureAgentApiEvent({ route: "replyToComment", postId, userId: context.currentUser?._id, agentName, status: "internal_error", errorCategory: "thread_not_found" });
        return NextResponse.json(
          { error: `Thread not found: ${threadId}` },
          { status: 400 },
        );
      }

      const commentId = randomId();
      const commentMap = createCollabComment({
        content: comment,
        author: authorName,
        authorId,
        id: commentId,
      });

      doc.transact(() => {
        threadComments.insert(threadComments.length, [commentMap]);
      }, "agent-reply-to-comment");

      await waitForProviderFlush(provider);

      captureAgentApiEvent({ route: "replyToComment", postId, userId: context.currentUser?._id, agentName, status: "success" });
      return NextResponse.json({
        ok: true,
        postId,
        threadId,
        commentId,
        note: "Reply added to thread.",
      });
    } finally {
      provider.destroy();
      doc.destroy();
    }
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
