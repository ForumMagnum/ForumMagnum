import { Doc, Array as YArray, Map as YMap } from "yjs";
import { NextRequest } from "next/server";
import {
  readOpenCommentThreadsFromYArray,
  serializeThreadsToMarkdown,
} from "../../../app/api/(markdown)/editorMarkdownUtils";
import { GET as getEditPostComments } from "../../../app/api/(markdown)/editPost/comments/route";

function createCommentMap({
  id,
  author,
  content,
  timeStamp = 1710000000000,
  deleted = false,
}: {
  id: string
  author: string
  content: string
  timeStamp?: number
  deleted?: boolean
}): YMap<unknown> {
  const comment = new YMap<unknown>();
  comment.set("type", "comment");
  comment.set("id", id);
  comment.set("author", author);
  comment.set("content", content);
  comment.set("timeStamp", timeStamp);
  comment.set("deleted", deleted);
  return comment;
}

function createThreadMap({
  id,
  quote,
  comments,
  status,
}: {
  id: string
  quote: string
  comments: YMap<unknown>[]
  status?: string
}): YMap<unknown> {
  const threadComments = new YArray<unknown>();
  threadComments.insert(0, comments);

  const thread = new YMap<unknown>();
  thread.set("type", "thread");
  thread.set("id", id);
  thread.set("quote", quote);
  thread.set("threadType", "comment");
  thread.set("comments", threadComments);
  if (status) {
    thread.set("status", status);
  }
  return thread;
}

describe("draft comment thread markdown serialization", () => {
  it("includes thread replies and standalone top-level comments", () => {
    const doc = new Doc();
    try {
      const commentsArray = doc.getArray<unknown>("comments");
      commentsArray.insert(0, [
        createThreadMap({
          id: "thread-1",
          quote: "quoted draft text",
          comments: [
            createCommentMap({ id: "comment-1", author: "Agent", content: "Initial comment" }),
            createCommentMap({ id: "comment-2", author: "User", content: "User reply" }),
          ],
        }),
        createThreadMap({
          id: "closed-thread",
          quote: "resolved text",
          status: "accepted",
          comments: [
            createCommentMap({ id: "closed-comment", author: "Agent", content: "Resolved suggestion" }),
          ],
        }),
        createCommentMap({ id: "top-level-1", author: "User", content: "Standalone top-level comment" }),
      ]);

      const threads = readOpenCommentThreadsFromYArray(commentsArray);

      expect(threads).toHaveLength(2);
      expect(threads[0]).toMatchObject({
        id: "thread-1",
        quote: "quoted draft text",
        canReply: true,
      });
      expect(threads[0].comments.map((comment) => comment.content)).toEqual([
        "Initial comment",
        "User reply",
      ]);
      expect(threads[1]).toMatchObject({
        id: "top-level-1",
        canReply: false,
        isTopLevelComment: true,
      });
      expect(threads[1].comments[0].content).toBe("Standalone top-level comment");
    } finally {
      doc.destroy();
    }
  });

  it("documents the JSON endpoint and marks non-replyable top-level comments", () => {
    const markdown = serializeThreadsToMarkdown([
      {
        id: "top-level-1",
        threadType: "comment",
        quote: "",
        canReply: false,
        isTopLevelComment: true,
        comments: [
          {
            id: "comment-1",
            author: "User",
            content: "Please respond to this.",
            timeStamp: 1710000000000,
            deleted: false,
          },
        ],
      },
    ]);

    expect(markdown).toContain("GET /api/editPost/comments?postId=[id]&key=[linkSharingKey]");
    expect(markdown).toContain("top-level comment (not replyable by threadId)");
    expect(markdown).toContain("Please respond to this.");
  });
});

describe("/api/editPost/comments", () => {
  it("returns a JSON validation error without trying to authorize when postId is missing", async () => {
    const req = new NextRequest("https://www.lesswrong.com/api/editPost/comments?key=test-key");
    const response = await getEditPostComments(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store, max-age=0");
    expect(body).toEqual({ error: "No postId provided" });
  });
});
