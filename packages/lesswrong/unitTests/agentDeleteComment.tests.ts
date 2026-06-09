import { Array as YArray, Doc, Map as YMap } from "yjs";
import { createCollabComment } from "../../../app/api/agent/commentOnDraft/route";
import { deleteCommentFromCommentsArray } from "../../../app/api/agent/deleteComment/route";

function asYMap(value: unknown): YMap<unknown> {
  if (!(value instanceof YMap)) {
    throw new Error("Expected YMap");
  }
  return value;
}

function asYArray(value: unknown): YArray<unknown> {
  if (!(value instanceof YArray)) {
    throw new Error("Expected YArray");
  }
  return value;
}

function createTestThread(threadId: string, commentIds: string[]): YMap<unknown> {
  const commentsArray = new YArray<unknown>();
  commentsArray.insert(0, commentIds.map((commentId) => createCollabComment({
    content: `Comment ${commentId}`,
    author: "Test Agent",
    authorId: "agent-id",
    id: commentId,
  })));

  const threadMap = new YMap<unknown>();
  threadMap.set("type", "thread");
  threadMap.set("id", threadId);
  threadMap.set("quote", "quoted text");
  threadMap.set("threadType", "comment");
  threadMap.set("comments", commentsArray);
  return threadMap;
}

describe("deleteCommentFromCommentsArray", () => {
  it("deletes an entire thread when commentId is omitted", () => {
    const doc = new Doc();
    const commentsArray = doc.get("comments", YArray<unknown>);
    commentsArray.insert(0, [
      createTestThread("thread-a", ["comment-a"]),
      createTestThread("thread-b", ["comment-b"]),
    ]);

    const result = deleteCommentFromCommentsArray({ commentsArray, threadId: "thread-a" });

    expect(result).toMatchObject({
      deleted: true,
      threadDeleted: true,
      threadId: "thread-a",
    });
    expect(commentsArray.length).toBe(1);
    expect(asYMap(commentsArray.get(0)).get("id")).toBe("thread-b");
  });

  it("removes the thread when deleting its last comment", () => {
    const doc = new Doc();
    const commentsArray = doc.get("comments", YArray<unknown>);
    commentsArray.insert(0, [createTestThread("thread-a", ["comment-a"])]);

    const result = deleteCommentFromCommentsArray({
      commentsArray,
      threadId: "thread-a",
      commentId: "comment-a",
    });

    expect(result).toMatchObject({
      deleted: true,
      threadDeleted: true,
      deletedCommentId: "comment-a",
    });
    expect(commentsArray.length).toBe(0);
  });

  it("marks a single comment deleted when other thread comments remain", () => {
    const doc = new Doc();
    const commentsArray = doc.get("comments", YArray<unknown>);
    commentsArray.insert(0, [createTestThread("thread-a", ["comment-a", "comment-b"])]);

    const result = deleteCommentFromCommentsArray({
      commentsArray,
      threadId: "thread-a",
      commentId: "comment-a",
    });

    expect(result).toMatchObject({
      deleted: true,
      threadDeleted: false,
      deletedCommentId: "comment-a",
      remainingThreadCommentCount: 2,
    });

    const threadMap = asYMap(commentsArray.get(0));
    const threadComments = asYArray(threadMap.get("comments"));
    const deletedComment = asYMap(threadComments.get(0));
    const untouchedComment = asYMap(threadComments.get(1));
    expect(deletedComment.get("id")).toBe("comment-a");
    expect(deletedComment.get("deleted")).toBe(true);
    expect(deletedComment.get("content")).toBe("[Deleted Comment]");
    expect(untouchedComment.get("id")).toBe("comment-b");
    expect(untouchedComment.get("deleted")).toBe(false);
  });

  it("returns not deleted when the target is absent", () => {
    const doc = new Doc();
    const commentsArray = doc.get("comments", YArray<unknown>);
    commentsArray.insert(0, [createTestThread("thread-a", ["comment-a"])]);

    const result = deleteCommentFromCommentsArray({
      commentsArray,
      threadId: "thread-a",
      commentId: "missing-comment",
    });

    expect(result).toMatchObject({
      deleted: false,
      threadDeleted: false,
      note: "Comment not found in thread: missing-comment",
    });
    expect(commentsArray.length).toBe(1);
  });
});
