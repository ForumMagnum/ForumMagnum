import { $nodesOfType } from "@lexical/utils";
import { MarkNode } from "@lexical/mark";
import { Array as YArray, Doc, Map as YMap } from "yjs";
import {
  $attachMarkToQuote,
  $removeCommentMark,
  createCollabComment,
  resolveOwnCommentThreadInDoc,
} from "../../../app/api/agent/collabCommentThreads";
import { runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";

function addCommentThread({
  doc,
  threadId,
  threadType = "comment",
  status,
  author,
  authorId,
}: {
  doc: Doc
  threadId: string
  threadType?: "comment" | "suggestion"
  status?: "open" | "archived"
  author: string
  authorId: string
}) {
  const comment = createCollabComment({
    content: "Review comment",
    author,
    authorId,
    id: `${threadId}-comment`,
  });
  const threadComments = new YArray<unknown>();
  threadComments.insert(0, [comment]);

  const thread = new YMap<unknown>();
  thread.set("type", "thread");
  thread.set("id", threadId);
  thread.set("quote", "quoted text");
  thread.set("threadType", threadType);
  thread.set("comments", threadComments);
  if (status) {
    thread.set("status", status);
  }

  doc.get("comments", YArray<unknown>).insert(0, [thread]);
  return thread;
}

describe("resolveOwnCommentThreadInDoc", () => {
  it("archives a comment thread created by the same author ID", () => {
    const doc = new Doc();
    const thread = addCommentThread({
      doc,
      threadId: "thread-1",
      author: "Claude",
      authorId: "user-1",
    });

    const result = resolveOwnCommentThreadInDoc({
      doc,
      threadId: "thread-1",
      authorId: "user-1",
      authorName: "Different display name",
      allowAuthorNameFallback: false,
    });

    expect(result).toEqual({ kind: "success", alreadyResolved: false });
    expect(thread.get("status")).toBe("archived");
  });

  it("does not resolve another author's thread", () => {
    const doc = new Doc();
    const thread = addCommentThread({
      doc,
      threadId: "thread-1",
      author: "Claude",
      authorId: "user-1",
    });

    const result = resolveOwnCommentThreadInDoc({
      doc,
      threadId: "thread-1",
      authorId: "user-2",
      authorName: "Claude",
      allowAuthorNameFallback: false,
    });

    expect(result).toEqual({ kind: "not_author" });
    expect(thread.get("status")).toBeUndefined();
  });

  it("supports an explicit agent-name fallback for stateless requests", () => {
    const doc = new Doc();
    addCommentThread({
      doc,
      threadId: "thread-1",
      author: "Claude Opus",
      authorId: "agent-old-random-id",
    });

    const result = resolveOwnCommentThreadInDoc({
      doc,
      threadId: "thread-1",
      authorId: "agent-new-random-id",
      authorName: "Claude Opus",
      allowAuthorNameFallback: true,
    });

    expect(result).toEqual({ kind: "success", alreadyResolved: false });
  });

  it("rejects suggestion threads", () => {
    const doc = new Doc();
    addCommentThread({
      doc,
      threadId: "thread-1",
      threadType: "suggestion",
      author: "Claude",
      authorId: "user-1",
    });

    const result = resolveOwnCommentThreadInDoc({
      doc,
      threadId: "thread-1",
      authorId: "user-1",
      authorName: "Claude",
      allowAuthorNameFallback: false,
    });

    expect(result).toEqual({ kind: "not_comment_thread" });
  });

  it("is idempotent for an already archived thread", () => {
    const doc = new Doc();
    addCommentThread({
      doc,
      threadId: "thread-1",
      status: "archived",
      author: "Claude",
      authorId: "user-1",
    });

    const result = resolveOwnCommentThreadInDoc({
      doc,
      threadId: "thread-1",
      authorId: "user-1",
      authorName: "Claude",
      allowAuthorNameFallback: false,
    });

    expect(result).toEqual({ kind: "success", alreadyResolved: true });
  });
});

describe("$removeCommentMark", () => {
  it("removes only the resolved thread ID from overlapping marks", async () => {
    const editor = await setupEditorWithContent("A uniquely marked phrase appears here.");
    await runEditorUpdate(editor, () => {
      $attachMarkToQuote("uniquely marked phrase", "resolved-thread");
      $attachMarkToQuote("uniquely marked phrase", "other-thread");
    });

    let removed = false;
    await runEditorUpdate(editor, () => {
      removed = $removeCommentMark("resolved-thread");
    });

    let remainingIds: string[] = [];
    editor.getEditorState().read(() => {
      remainingIds = $nodesOfType(MarkNode).flatMap((node) => node.getIDs());
    });
    expect(removed).toBe(true);
    expect(remainingIds).not.toContain("resolved-thread");
    expect(remainingIds).toContain("other-thread");
  });
});
