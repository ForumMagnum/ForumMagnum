import { Map as YMap, Array as YArray } from "yjs";
import { randomId } from "@/lib/random";
import { $createRangeSelection, $setSelection } from "lexical";
import { $wrapSelectionInMarkNode } from "@lexical/mark";
import type { ThreadType, ThreadStatus } from "@/components/lexical/commenting";
import YjsDocuments from "@/server/collections/yjsDocuments/collection";
import {
  normalizeText,
  waitForProviderFlush,
  withCommentsDocSession,
  withMainDocEditorSession,
} from "./editorAgentUtil";
import { $locateQuoteWithTextIndex } from "./textIndexQuoteLocator";

export function createCollabComment({
  content,
  author,
  authorId,
  id,
}: {
  content: string
  author: string
  authorId: string
  id: string
}): YMap<unknown> {
  const commentMap = new YMap<unknown>();
  commentMap.set("type", "comment");
  commentMap.set("id", id);
  commentMap.set("author", author);
  commentMap.set("authorId", authorId);
  commentMap.set("content", content);
  commentMap.set("deleted", false);
  commentMap.set("timeStamp", Date.now());
  return commentMap;
}

function createCollabThread({
  quote,
  firstComment,
  threadId,
}: {
  quote: string
  firstComment: YMap<unknown>
  threadId: string
}): YMap<unknown> {
  const commentsArray = new YArray<unknown>();
  commentsArray.insert(0, [firstComment]);

  const threadMap = new YMap<unknown>();
  threadMap.set("type", "thread");
  threadMap.set("id", threadId);
  threadMap.set("quote", quote);
  threadMap.set("threadType", "comment");
  threadMap.set("comments", commentsArray);
  return threadMap;
}

export interface QuoteMarkResult {
  quoteFoundInDocument: boolean
  markCreated: boolean
  /** Why locating failed (e.g. the quote is ambiguous), when it did. */
  locateFailureReason?: string
}

/**
 * Locate a markdown quote in the current editor state and wrap the matched
 * range in a MarkNode. Must be called inside a Lexical update context.
 */
export function $attachMarkToQuote(quote: string, markId: string): QuoteMarkResult {
  const result = $locateQuoteWithTextIndex(quote);
  if (!result.found || !result.anchor || !result.focus) {
    return { quoteFoundInDocument: result.found, markCreated: false, locateFailureReason: result.reason };
  }

  const selection = $createRangeSelection();
  selection.anchor.set(result.anchor.key, result.anchor.offset, result.anchor.type);
  selection.focus.set(result.focus.key, result.focus.offset, result.focus.type);
  $setSelection(selection);
  $wrapSelectionInMarkNode(selection, false, markId);
  return { quoteFoundInDocument: true, markCreated: true };
}

async function getMainDocQuoteMatchResult({
  collectionName,
  documentId,
  token,
  quote,
  markId,
}: {
  collectionName: string
  documentId: string
  token: string
  quote: string
  markId: string
}): Promise<{ quoteFoundInDocument: boolean, createdMarkId: string | null, locateFailureReason?: string }> {
  return withMainDocEditorSession({
    collectionName,
    documentId,
    token,
    operationLabel: "CommentOnDraftQuoteMatch",
    callback: async ({ editor, provider: mainDocProvider }) => {
      let quoteFoundInDocument = false;
      let createdMarkId: string | null = null;
      let locateFailureReason: string | undefined;

      await new Promise<void>((resolve) => {
        editor.update(() => {
          const markResult = $attachMarkToQuote(quote, markId);
          quoteFoundInDocument = markResult.quoteFoundInDocument;
          locateFailureReason = markResult.locateFailureReason;
          if (markResult.markCreated) {
            createdMarkId = markId;
          }
        }, { onUpdate: resolve });
      });

      if (createdMarkId) {
        await waitForProviderFlush(mainDocProvider);
      }

      return { quoteFoundInDocument, createdMarkId, locateFailureReason };
    },
  });
}

export type CommentAnchorStatus = "attached_by_quote_match" | "top_level_no_match" | "top_level_no_quote";

export async function insertCollabCommentThread({
  collectionName,
  documentId,
  token,
  comment,
  quote,
  author,
  authorId,
}: {
  collectionName: string
  documentId: string
  token: string
  comment: string
  quote: string
  author: string
  authorId: string
}): Promise<{
  threadId: string
  commentId: string
  anchorStatus: CommentAnchorStatus
  anchorNote: string
}> {
  const commentId = randomId();
  const threadId = randomId();
  const hasQuote = !!normalizeText(quote);

  // The comments-doc session wraps the whole operation so that its
  // connect/sync (the failure-prone part) happens BEFORE the quote-match
  // session mutates the main document. Otherwise a comments-doc failure
  // would leave a permanently orphaned highlight mark with no thread.
  return withCommentsDocSession({
    collectionName,
    documentId,
    token,
    callback: async ({ doc }) => {
      let anchorStatus: CommentAnchorStatus;
      let anchorNote: string;

      if (!hasQuote) {
        anchorStatus = "top_level_no_quote";
        anchorNote = "No quote provided; created top-level comment thread.";
      } else {
        const { quoteFoundInDocument, createdMarkId, locateFailureReason } = await getMainDocQuoteMatchResult({
          collectionName,
          documentId,
          token,
          quote,
          markId: threadId,
        });

        if (createdMarkId) {
          anchorStatus = "attached_by_quote_match";
          anchorNote = "Inserted a new text-range mark around quote text and attached the thread.";
        } else {
          anchorStatus = "top_level_no_match";
          const fallbackNote = quoteFoundInDocument
            ? "Quote text found in the document, but could not create a text-range anchor."
            : "Quote text was not found in the document.";
          anchorNote = `${locateFailureReason ?? fallbackNote} Created top-level comment thread.`;
        }
      }

      const comments = doc.get("comments", YArray<unknown>);
      const commentMap = createCollabComment({ content: comment, author, authorId, id: commentId });
      const threadMap = createCollabThread({ quote, firstComment: commentMap, threadId });
      doc.transact(() => {
        comments.insert(comments.length, [threadMap]);
      }, "agent-comment-on-draft");

      return { threadId, commentId, anchorStatus, anchorNote };
    },
  });
}

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

export type AppendReplyResult =
  | { kind: "thread_not_found" }
  | { kind: "success", commentId: string };

export async function appendReplyToCommentThread({
  collectionName,
  documentId,
  token,
  threadId,
  comment,
  author,
  authorId,
}: {
  collectionName: string
  documentId: string
  token: string
  threadId: string
  comment: string
  author: string
  authorId: string
}): Promise<AppendReplyResult> {
  return withCommentsDocSession({
    collectionName,
    documentId,
    token,
    callback: async ({ doc }) => {
      const commentsArray = doc.get("comments", YArray<unknown>);
      const threadComments = findThreadCommentsArray(commentsArray, threadId);
      if (!threadComments) {
        return { kind: "thread_not_found" };
      }

      const commentId = randomId();
      const commentMap = createCollabComment({
        content: comment,
        author,
        authorId,
        id: commentId,
      });

      doc.transact(() => {
        threadComments.insert(threadComments.length, [commentMap]);
      }, "agent-reply-to-comment");

      return { kind: "success", commentId };
    },
  });
}

export interface SerializedComment {
  author: string
  content: string
  timeStamp: number
  commentKind?: string
  deleted: boolean
}

export interface SerializedThread {
  id: string
  threadType: ThreadType
  quote: string
  status?: ThreadStatus
  comments: SerializedComment[]
}

function readThreadFromYMap(threadMap: YMap<unknown>): SerializedThread {
  const commentsArray = threadMap.get("comments") as YArray<unknown> | undefined;
  const serializedComments: SerializedComment[] = commentsArray?.toArray().map((comment: YMap<unknown>) => {
    return {
      author: (comment.get("author") as string) ?? "Unknown",
      content: (comment.get("content") as string) ?? "",
      timeStamp: (comment.get("timeStamp") as number) ?? 0,
      commentKind: comment.get("commentKind") as string | undefined,
      deleted: (comment.get("deleted") as boolean) ?? false,
    };
  }) ?? [];

  return {
    id: (threadMap.get("id") as string) ?? "",
    threadType: (threadMap.get("threadType") as ThreadType | undefined) ?? "comment",
    quote: (threadMap.get("quote") as string) ?? "",
    status: threadMap.get("status") as ThreadStatus | undefined,
    comments: serializedComments,
  };
}

export async function readOpenCommentThreads({
  collectionName,
  documentId,
  token,
}: {
  collectionName: string
  documentId: string
  token: string
}): Promise<SerializedThread[]> {
  if (!process.env.HOCUSPOCUS_URL) return [];

  // Most documents have never been commented on; skip the Hocuspocus
  // session (connect + auth + full subdoc sync) when no persisted comments
  // doc exists. Read-only connections never create the row, so absence is
  // authoritative — up to the Hocuspocus store-debounce window after the
  // very first comment, during which this can briefly report no threads.
  const persistedCommentsDoc = await YjsDocuments.findOne(
    { collectionName, documentId: `${documentId}/comments` },
    undefined,
    { _id: 1 },
  );
  if (!persistedCommentsDoc) return [];

  return withCommentsDocSession({
    collectionName,
    documentId,
    token,
    callback: async ({ doc }) => {
      const commentsArray = doc.get("comments", YArray<unknown>);
      const threads: SerializedThread[] = [];

      for (let i = 0; i < commentsArray.length; i++) {
        const threadMap = commentsArray.get(i) as YMap<unknown>;
        if (threadMap.get("type") !== "thread") continue;
        // Only include open threads (status undefined or "open")
        const status = threadMap.get("status") as ThreadStatus | undefined;
        if (status && status !== "open") continue;
        threads.push(readThreadFromYMap(threadMap));
      }

      return threads;
    },
  });
}
