import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { NextRequest, NextResponse } from "next/server";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Array as YArray, Doc, Map as YMap } from "yjs";
import { $getRoot, $isElementNode, type LexicalNode } from "lexical";
import { $isMarkNode, $unwrapMarkNode } from "@lexical/mark";
import { authorizeAgentDraftAccess, deriveAgentAuthor, waitForProviderFlush, waitForProviderSync, withMainDocEditorSession } from "../editorAgentUtil";
import { deleteCommentToolSchema } from "../toolSchemas";
import { captureException } from "@/lib/sentryWrapper";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";
import { AGENT_COMMENT_DELETION_TOKEN_FIELD } from "../commentOnDraft/route";

const DELETED_COMMENT_CONTENT = "[Deleted Comment]";

export interface DeleteDraftCommentResult {
  deleted: boolean
  threadDeleted: boolean
  note: string
  failureReason?: "thread_not_found" | "comment_not_found" | "already_deleted" | "forbidden"
}

function getYMapEntry(array: YArray<unknown>, index: number): YMap<unknown> | null {
  const entry = array.get(index);
  return entry instanceof YMap ? entry : null;
}

function findThreadIndex(commentsArray: YArray<unknown>, threadId: string): number {
  for (let i = 0; i < commentsArray.length; i++) {
    const entry = getYMapEntry(commentsArray, i);
    if (entry?.get("type") === "thread" && entry.get("id") === threadId) {
      return i;
    }
  }
  return -1;
}

function findCommentIndex(threadComments: YArray<unknown>, commentId: string): number {
  for (let i = 0; i < threadComments.length; i++) {
    const entry = getYMapEntry(threadComments, i);
    if (entry?.get("type") === "comment" && entry.get("id") === commentId) {
      return i;
    }
  }
  return -1;
}

function canDeleteComment({
  commentMap,
  authorId,
  deletionToken,
}: {
  commentMap: YMap<unknown>
  authorId: string
  deletionToken?: string
}): boolean {
  const commentDeletionToken = commentMap.get(AGENT_COMMENT_DELETION_TOKEN_FIELD);
  if (deletionToken && commentDeletionToken === deletionToken) {
    return true;
  }
  return commentMap.get("authorId") === authorId;
}

function hasVisibleComments(threadComments: YArray<unknown>): boolean {
  for (let i = 0; i < threadComments.length; i++) {
    const entry = getYMapEntry(threadComments, i);
    if (entry?.get("type") === "comment" && entry.get("deleted") !== true) {
      return true;
    }
  }
  return false;
}

export function deleteDraftCommentFromCommentsArray({
  commentsArray,
  threadId,
  commentId,
  authorId,
  deletionToken,
}: {
  commentsArray: YArray<unknown>
  threadId: string
  commentId: string
  authorId: string
  deletionToken?: string
}): DeleteDraftCommentResult {
  const threadIndex = findThreadIndex(commentsArray, threadId);
  if (threadIndex < 0) {
    return {
      deleted: false,
      threadDeleted: false,
      note: `Thread not found: ${threadId}`,
      failureReason: "thread_not_found",
    };
  }

  const threadMap = getYMapEntry(commentsArray, threadIndex);
  const threadComments = threadMap?.get("comments");
  if (!(threadComments instanceof YArray)) {
    return {
      deleted: false,
      threadDeleted: false,
      note: `Thread has no comments array: ${threadId}`,
      failureReason: "thread_not_found",
    };
  }

  const commentIndex = findCommentIndex(threadComments, commentId);
  if (commentIndex < 0) {
    return {
      deleted: false,
      threadDeleted: false,
      note: `Comment not found: ${commentId}`,
      failureReason: "comment_not_found",
    };
  }

  const commentMap = getYMapEntry(threadComments, commentIndex);
  if (!commentMap) {
    return {
      deleted: false,
      threadDeleted: false,
      note: `Comment not found: ${commentId}`,
      failureReason: "comment_not_found",
    };
  }

  if (!canDeleteComment({ commentMap, authorId, deletionToken })) {
    return {
      deleted: false,
      threadDeleted: false,
      note: "Cannot delete a comment created by a different author without its deletion token.",
      failureReason: "forbidden",
    };
  }

  if (commentMap.get("deleted") === true) {
    return {
      deleted: false,
      threadDeleted: false,
      note: "Comment was already deleted.",
      failureReason: "already_deleted",
    };
  }

  commentMap.set("content", DELETED_COMMENT_CONTENT);
  commentMap.set("deleted", true);

  if (!hasVisibleComments(threadComments)) {
    commentsArray.delete(threadIndex);
    return {
      deleted: true,
      threadDeleted: true,
      note: "Deleted comment and removed the now-empty thread.",
    };
  }

  return {
    deleted: true,
    threadDeleted: false,
    note: "Deleted comment.",
  };
}

function $removeMarkIdFromNode(node: LexicalNode, markId: string) {
  if ($isMarkNode(node)) {
    node.deleteID(markId);
    if (node.getIDs().length === 0) {
      $unwrapMarkNode(node);
      return;
    }
  }

  if ($isElementNode(node)) {
    for (const child of node.getChildren()) {
      $removeMarkIdFromNode(child, markId);
    }
  }
}

async function removeThreadMarkFromMainDoc({
  postId,
  token,
  threadId,
}: {
  postId: string
  token: string
  threadId: string
}) {
  await withMainDocEditorSession({
    postId,
    token,
    operationLabel: "DeleteCommentRemoveThreadMark",
    callback: async ({ editor, provider }) => {
      await new Promise<void>((resolve) => {
        editor.update(() => {
          $removeMarkIdFromNode($getRoot(), threadId);
        }, { onUpdate: resolve });
      });
      await waitForProviderFlush(provider);
    },
  });
}

export async function deleteDraftComment({
  postId,
  token,
  threadId,
  commentId,
  authorId,
  deletionToken,
}: {
  postId: string
  token: string
  threadId: string
  commentId: string
  authorId: string
  deletionToken?: string
}): Promise<DeleteDraftCommentResult> {
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
    const result = deleteDraftCommentFromCommentsArray({
      commentsArray,
      threadId,
      commentId,
      authorId,
      deletionToken,
    });

    if (result.deleted) {
      await waitForProviderFlush(provider);
      if (result.threadDeleted) {
        await removeThreadMarkFromMainDoc({ postId, token, threadId });
      }
    }

    return result;
  } finally {
    provider.destroy();
    doc.destroy();
  }
}

function statusCodeForFailure(reason: DeleteDraftCommentResult["failureReason"]): number {
  switch (reason) {
    case "forbidden":
      return 403;
    case "thread_not_found":
    case "comment_not_found":
      return 400;
    case "already_deleted":
    default:
      return 200;
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

  const { postId, key, agentName, threadId, commentId, deletionToken } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "deleteComment", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;
    const { authorId } = deriveAgentAuthor({ context, args: { agentName } });

    const result = await deleteDraftComment({
      postId,
      token,
      threadId,
      commentId,
      authorId,
      deletionToken,
    });

    const status = result.failureReason === "forbidden"
      ? "unauthorized"
      : result.failureReason && result.failureReason !== "already_deleted"
        ? "internal_error"
        : "success";
    captureAgentApiEvent({
      route: "deleteComment",
      postId,
      userId: context.currentUser?._id,
      agentName,
      status,
      operationResult: result.failureReason ?? (result.threadDeleted ? "thread_deleted" : "comment_deleted"),
      threadId,
    });

    return NextResponse.json({
      ok: !result.failureReason || result.failureReason === "already_deleted",
      postId,
      threadId,
      commentId,
      ...result,
    }, { status: statusCodeForFailure(result.failureReason) });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("deleteComment", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to delete comment from collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
