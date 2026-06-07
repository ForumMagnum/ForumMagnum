import { $getRoot, $isElementNode, type LexicalNode } from "lexical";
import { $isMarkNode, $unwrapMarkNode, type MarkNode } from "@lexical/mark";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Array as YArray, Doc, Map as YMap } from "yjs";
import { NextRequest, NextResponse } from "next/server";
import { getContextFromReqAndRes } from "@/server/vulcan-lib/apollo-server/context";
import { captureException } from "@/lib/sentryWrapper";
import { authorizeAgentDraftAccess, waitForProviderFlush, waitForProviderSync, withMainDocEditorSession } from "../editorAgentUtil";
import { deleteCommentToolSchema } from "../toolSchemas";
import { captureAgentApiEvent, captureAgentApiFailure } from "../captureAgentAnalytics";

interface DeleteDraftCommentThreadResult {
  deleted: boolean
  markRemoved: boolean
  note: string
  markCleanupError?: string
}

export function deleteCommentThreadFromCommentsArray(
  commentsArray: YArray<YMap<unknown>>,
  threadId: string,
): boolean {
  for (let i = 0; i < commentsArray.length; i++) {
    const threadMap = commentsArray.get(i);
    if (threadMap.get("type") === "thread" && threadMap.get("id") === threadId) {
      commentsArray.delete(i);
      return true;
    }
  }
  return false;
}

export function $removeCommentThreadMark(threadId: string): boolean {
  const markNodes: MarkNode[] = [];

  function collectMatchingMarks(node: LexicalNode) {
    if ($isMarkNode(node) && node.getIDs().includes(threadId)) {
      markNodes.push(node);
    }

    if ($isElementNode(node)) {
      for (const child of node.getChildren()) {
        collectMatchingMarks(child);
      }
    }
  }

  collectMatchingMarks($getRoot());

  for (const node of markNodes) {
    node.deleteID(threadId);
    if (node.getIDs().length === 0) {
      $unwrapMarkNode(node);
    }
  }

  return markNodes.length > 0;
}

async function deleteCommentThreadFromCommentsDoc({
  postId,
  token,
  threadId,
}: {
  postId: string
  token: string
  threadId: string
}): Promise<boolean> {
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

    const commentsArray = doc.get("comments", YArray<YMap<unknown>>);
    const deleted = deleteCommentThreadFromCommentsArray(commentsArray, threadId);
    if (deleted) {
      await waitForProviderFlush(provider);
    }
    return deleted;
  } finally {
    provider.destroy();
    doc.destroy();
  }
}

async function removeCommentThreadMark({
  postId,
  token,
  threadId,
}: {
  postId: string
  token: string
  threadId: string
}): Promise<boolean> {
  return withMainDocEditorSession({
    postId,
    token,
    operationLabel: "DeleteCommentThreadMark",
    callback: async ({ editor, provider }) => {
      let markRemoved = false;

      await new Promise<void>((resolve) => {
        editor.update(() => {
          markRemoved = $removeCommentThreadMark(threadId);
        }, { onUpdate: resolve });
      });

      if (markRemoved) {
        await waitForProviderFlush(provider);
      }

      return markRemoved;
    },
  });
}

export async function deleteDraftCommentThread({
  postId,
  token,
  threadId,
}: {
  postId: string
  token: string
  threadId: string
}): Promise<DeleteDraftCommentThreadResult> {
  const deleted = await deleteCommentThreadFromCommentsDoc({ postId, token, threadId });
  if (!deleted) {
    return {
      deleted: false,
      markRemoved: false,
      note: `Comment thread not found: ${threadId}`,
    };
  }

  try {
    const markRemoved = await removeCommentThreadMark({ postId, token, threadId });
    return {
      deleted: true,
      markRemoved,
      note: markRemoved
        ? "Deleted comment thread and removed its inline highlight."
        : "Deleted comment thread. No matching inline highlight was present.",
    };
  } catch (error) {
    captureException(error);
    return {
      deleted: true,
      markRemoved: false,
      markCleanupError: error instanceof Error ? error.message : "Unknown error",
      note: "Deleted comment thread, but failed to remove its inline highlight.",
    };
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
    return NextResponse.json({ error: "Invalid request body", details: parseResult.error.format() }, { status: 400 });
  }

  const { postId, key, agentName, threadId } = parseResult.data;

  try {
    const auth = await authorizeAgentDraftAccess({ route: "deleteComment", postId, context, linkSharingKey: key, agentName });
    if ("errorResponse" in auth) return auth.errorResponse;
    const { token } = auth;

    const result = await deleteDraftCommentThread({ postId, token, threadId });
    const operationResult = result.deleted
      ? result.markCleanupError ? "deleted_mark_cleanup_failed" : "deleted"
      : "thread_not_found";
    captureAgentApiEvent({ route: "deleteComment", postId, userId: context.currentUser?._id, agentName, status: "success", operationResult, threadId });

    return NextResponse.json({
      ok: true,
      postId,
      threadId,
      deleted: result.deleted,
      markRemoved: result.markRemoved,
      note: result.note,
      markCleanupError: result.markCleanupError ?? null,
      mode: "lexical-collaboration-delete-comment-thread",
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    captureException(error);
    captureAgentApiFailure("deleteComment", error, { postId, userId: context.currentUser?._id, agentName });
    return NextResponse.json(
      {
        error: "Failed to delete comment thread from collaborative draft",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
