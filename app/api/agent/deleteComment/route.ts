import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Array as YArray, Doc, Map as YMap } from "yjs";
import { $getRoot, $isElementNode, type LexicalNode } from "lexical";
import { $isMarkNode, $unwrapMarkNode } from "@lexical/mark";
import {
  authorizeAgentDraftAccess,
  waitForProviderFlush,
  waitForProviderSync,
  withMainDocEditorSession,
} from "../editorAgentUtil";
import { deleteCommentToolSchema } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

export interface DeleteDraftCommentResult {
  deleted: boolean
  threadId: string
  commentId?: string
  threadDeleted: boolean
  deletedCommentId?: string
  remainingThreadCommentCount?: number
  note: string
}

function getStringField(map: YMap<unknown>, fieldName: string): string | null {
  const value = map.get(fieldName);
  return typeof value === "string" ? value : null;
}

function markCommentDeleted(commentMap: YMap<unknown>): void {
  commentMap.set("content", "[Deleted Comment]");
  commentMap.set("deleted", true);
}

function findThreadIndex(commentsArray: YArray<unknown>, threadId: string): number | null {
  for (let i = 0; i < commentsArray.length; i++) {
    const entry = commentsArray.get(i);
    if (entry instanceof YMap && getStringField(entry, "type") === "thread" && getStringField(entry, "id") === threadId) {
      return i;
    }
  }
  return null;
}

function findCommentIndex(threadComments: YArray<unknown>, commentId: string): number | null {
  for (let i = 0; i < threadComments.length; i++) {
    const entry = threadComments.get(i);
    if (entry instanceof YMap && getStringField(entry, "type") === "comment" && getStringField(entry, "id") === commentId) {
      return i;
    }
  }
  return null;
}

export function deleteCommentFromCommentsArray({
  commentsArray,
  threadId,
  commentId,
}: {
  commentsArray: YArray<unknown>
  threadId: string
  commentId?: string
}): DeleteDraftCommentResult {
  const threadIndex = findThreadIndex(commentsArray, threadId);
  if (threadIndex === null) {
    return {
      deleted: false,
      threadId,
      commentId,
      threadDeleted: false,
      note: `Thread not found: ${threadId}`,
    };
  }

  if (!commentId) {
    commentsArray.delete(threadIndex);
    return {
      deleted: true,
      threadId,
      threadDeleted: true,
      note: "Deleted the thread.",
    };
  }

  const threadMap = commentsArray.get(threadIndex);
  if (!(threadMap instanceof YMap)) {
    return {
      deleted: false,
      threadId,
      commentId,
      threadDeleted: false,
      note: `Thread not found: ${threadId}`,
    };
  }

  const threadComments = threadMap.get("comments");
  if (!(threadComments instanceof YArray)) {
    return {
      deleted: false,
      threadId,
      commentId,
      threadDeleted: false,
      note: `Thread has no comment list: ${threadId}`,
    };
  }

  const commentIndex = findCommentIndex(threadComments, commentId);
  if (commentIndex === null) {
    return {
      deleted: false,
      threadId,
      commentId,
      threadDeleted: false,
      note: `Comment not found in thread: ${commentId}`,
    };
  }

  if (threadComments.length === 1) {
    commentsArray.delete(threadIndex);
    return {
      deleted: true,
      threadId,
      commentId,
      threadDeleted: true,
      deletedCommentId: commentId,
      note: "Deleted the last comment and removed the empty thread.",
    };
  }

  const commentMap = threadComments.get(commentIndex);
  if (!(commentMap instanceof YMap)) {
    return {
      deleted: false,
      threadId,
      commentId,
      threadDeleted: false,
      note: `Comment not found in thread: ${commentId}`,
    };
  }

  markCommentDeleted(commentMap);
  return {
    deleted: true,
    threadId,
    commentId,
    threadDeleted: false,
    deletedCommentId: commentId,
    remainingThreadCommentCount: threadComments.length,
    note: "Marked the comment deleted and left the rest of the thread in place.",
  };
}

function $removeMarkIdFromNodeTree(node: LexicalNode, markId: string): number {
  let removed = 0;
  if ($isMarkNode(node) && node.getIDs().includes(markId)) {
    node.deleteID(markId);
    removed++;
    if (node.getIDs().length === 0) {
      $unwrapMarkNode(node);
    }
    return removed;
  }

  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      removed += $removeMarkIdFromNodeTree(child, markId);
    }
  }
  return removed;
}

async function removeThreadMarkFromMainDoc({
  postId,
  token,
  threadId,
}: {
  postId: string
  token: string
  threadId: string
}): Promise<number> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "DeleteDraftCommentThreadMark",
    callback: async ({ editor, provider: mainDocProvider }) => {
      let removedCount = 0;
      await new Promise<void>((resolve) => {
        editor.update(() => {
          removedCount = $removeMarkIdFromNodeTree($getRoot(), threadId);
        }, { onUpdate: resolve });
      });

      if (removedCount > 0) {
        await waitForProviderFlush(mainDocProvider);
      }
      return removedCount;
    },
  });
}

export async function deleteDraftCommentOrThread({
  postId,
  token,
  threadId,
  commentId,
}: {
  postId: string
  token: string
  threadId: string
  commentId?: string
}): Promise<DeleteDraftCommentResult & { removedMarkCount: number }> {
  const wsUrl = process.env.HOCUSPOCUS_URL;
  if (!wsUrl) {
    throw new Error("HOCUSPOCUS_URL is not configured");
  }

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

    const commentsArray = doc.get("comments", YArray<unknown>);
    const result = deleteCommentFromCommentsArray({ commentsArray, threadId, commentId });
    if (result.deleted) {
      await waitForProviderFlush(provider);
    }

    const removedMarkCount = result.threadDeleted
      ? await removeThreadMarkFromMainDoc({ postId, token, threadId })
      : 0;

    return { ...result, removedMarkCount };
  } finally {
    provider.destroy();
    doc.destroy();
  }
}

export async function POST(req: NextRequest) {
  const [body, context] = await Promise.all([
    req.json(),
    getContextFromReqAndRes({ req, isSSR: false }),
  ]);

  const parseResult = deleteCommentToolSchema.safeParse(body);
  if (!parseResult.success) {
    captureAgentApiEvent({ route: "deleteComment", postId: body?.postId, userId: context.currentUser?._id, agentName: body?.agentName, status: "validation_error" });
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { postId, key, agentName, threadId, commentId } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "deleteComment", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;

    const result = await deleteDraftCommentOrThread({
      postId,
      token: auth.token,
      threadId,
      commentId,
    });

    captureAgentApiEvent({
      route: "deleteComment",
      postId,
      userId: context.currentUser?._id,
      agentName,
      status: result.deleted ? "success" : "internal_error",
      operationResult: result.deleted ? (result.threadDeleted ? "thread_deleted" : "comment_deleted") : "not_found",
      threadId,
    });

    const status = result.deleted ? 200 : 404;
    return NextResponse.json({ ok: result.deleted, postId, ...result }, { status });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("deleteComment", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to delete comment thread",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
