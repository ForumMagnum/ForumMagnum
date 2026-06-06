import { Array as YArray, Doc, Map as YMap } from "yjs";
import { createCollabComment } from "../../../app/api/agent/commentOnDraft/route";
import { deleteDraftCommentFromCommentsArray } from "../../../app/api/agent/deleteComment/route";

function createThread({
  threadId,
  comments,
}: {
  threadId: string
  comments: YMap<unknown>[]
}): YMap<unknown> {
  const commentsArray = new YArray<unknown>();
  commentsArray.insert(0, comments);

  const threadMap = new YMap<unknown>();
  threadMap.set("type", "thread");
  threadMap.set("id", threadId);
  threadMap.set("quote", "");
  threadMap.set("threadType", "comment");
  threadMap.set("comments", commentsArray);
  return threadMap;
}

function getThreadComments(threadMap: YMap<unknown>): YArray<unknown> {
  const threadComments = threadMap.get("comments");
  if (!(threadComments instanceof YArray)) {
    throw new Error("Expected thread comments array");
  }
  return threadComments;
}

function getCommentMap(threadComments: YArray<unknown>, index: number): YMap<unknown> {
  const commentMap = threadComments.get(index);
  if (!(commentMap instanceof YMap)) {
    throw new Error("Expected comment map");
  }
  return commentMap;
}

function createCommentsArray(): YArray<unknown> {
  const doc = new Doc();
  return doc.get("comments", YArray<unknown>);
}

describe("deleteDraftCommentFromCommentsArray", () => {
  it("deletes a token-authorized single-comment thread", () => {
    const commentsArray = createCommentsArray();
    const comment = createCollabComment({
      content: "Mis-anchored comment",
      author: "Claude",
      authorId: "agent-1",
      id: "comment-1",
      deletionToken: "delete-token",
    });
    commentsArray.insert(0, [createThread({ threadId: "thread-1", comments: [comment] })]);

    const result = deleteDraftCommentFromCommentsArray({
      commentsArray,
      threadId: "thread-1",
      commentId: "comment-1",
      authorId: "different-client",
      deletionToken: "delete-token",
    });

    expect(result).toEqual({
      deleted: true,
      threadDeleted: true,
      note: "Deleted comment and removed the now-empty thread.",
    });
    expect(commentsArray.length).toBe(0);
  });

  it("soft-deletes a comment but keeps the thread when other replies remain", () => {
    const commentsArray = createCommentsArray();
    const agentComment = createCollabComment({
      content: "Agent comment",
      author: "Claude",
      authorId: "agent-1",
      id: "comment-1",
      deletionToken: "delete-token",
    });
    const userReply = createCollabComment({
      content: "User reply",
      author: "Post author",
      authorId: "user-1",
      id: "comment-2",
    });
    const thread = createThread({ threadId: "thread-1", comments: [agentComment, userReply] });
    commentsArray.insert(0, [thread]);

    const result = deleteDraftCommentFromCommentsArray({
      commentsArray,
      threadId: "thread-1",
      commentId: "comment-1",
      authorId: "different-client",
      deletionToken: "delete-token",
    });

    expect(result).toEqual({
      deleted: true,
      threadDeleted: false,
      note: "Deleted comment.",
    });
    expect(commentsArray.length).toBe(1);
    const threadComments = getThreadComments(thread);
    const deletedComment = getCommentMap(threadComments, 0);
    expect(deletedComment.get("deleted")).toBe(true);
    expect(deletedComment.get("content")).toBe("[Deleted Comment]");
    expect(getCommentMap(threadComments, 1).get("content")).toBe("User reply");
  });

  it("allows deletion by matching stored authorId without a deletion token", () => {
    const commentsArray = createCommentsArray();
    const comment = createCollabComment({
      content: "Old agent comment",
      author: "Claude",
      authorId: "agent-1",
      id: "comment-1",
    });
    commentsArray.insert(0, [createThread({ threadId: "thread-1", comments: [comment] })]);

    const result = deleteDraftCommentFromCommentsArray({
      commentsArray,
      threadId: "thread-1",
      commentId: "comment-1",
      authorId: "agent-1",
    });

    expect(result.deleted).toBe(true);
    expect(result.threadDeleted).toBe(true);
  });

  it("rejects deletion of another author's comment without its deletion token", () => {
    const commentsArray = createCommentsArray();
    const comment = createCollabComment({
      content: "User comment",
      author: "Post author",
      authorId: "user-1",
      id: "comment-1",
      deletionToken: "real-token",
    });
    const thread = createThread({ threadId: "thread-1", comments: [comment] });
    commentsArray.insert(0, [thread]);

    const result = deleteDraftCommentFromCommentsArray({
      commentsArray,
      threadId: "thread-1",
      commentId: "comment-1",
      authorId: "agent-1",
      deletionToken: "wrong-token",
    });

    expect(result).toEqual({
      deleted: false,
      threadDeleted: false,
      note: "Cannot delete a comment created by a different author without its deletion token.",
      failureReason: "forbidden",
    });
    expect(commentsArray.length).toBe(1);
    expect(comment.get("deleted")).toBe(false);
    expect(comment.get("content")).toBe("User comment");
  });
});
