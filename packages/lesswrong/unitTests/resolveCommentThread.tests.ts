import { $getRoot, $nodesOfType } from "lexical";
import { MarkNode } from "@lexical/mark";
import { Array as YArray, Doc, Map as YMap } from "yjs";
import {
  $attachMarkToQuote,
  $removeCommentThreadMark,
  createCollabComment,
  resolveThreadInCommentsDoc,
} from "../../../app/api/agent/collabCommentThreads";
import { runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";

function createCommentsDoc({
  threadId = "thread-1",
  author = "Test Agent",
  authorId = "agent-1",
  threadType = "comment",
  status,
}: {
  threadId?: string
  author?: string
  authorId?: string
  threadType?: "comment" | "suggestion"
  status?: "open" | "accepted" | "rejected" | "archived"
} = {}) {
  const doc = new Doc();
  const comments = doc.get("comments", YArray<unknown>);
  const threadComments = new YArray<unknown>();
  threadComments.insert(0, [
    createCollabComment({
      content: "Please revise this.",
      author,
      authorId,
      id: "comment-1",
    }),
  ]);

  const threadMap = new YMap<unknown>();
  threadMap.set("type", "thread");
  threadMap.set("id", threadId);
  threadMap.set("quote", "quoted text");
  threadMap.set("threadType", threadType);
  threadMap.set("comments", threadComments);
  if (status) {
    threadMap.set("status", status);
  }
  threadMap.set("statusBeforeReopen", "open");
  comments.insert(0, [threadMap]);
  return { doc, threadMap };
}

const sessionArgs = {
  collectionName: "Posts",
  documentId: "post-1",
  token: "token",
  threadId: "thread-1",
};

describe("resolveThreadInCommentsDoc", () => {
  it("archives an open comment thread authored by the same collaborator", async () => {
    const { doc, threadMap } = createCommentsDoc();
    const removeThreadMark = jest.fn(async () => 2);

    const result = await resolveThreadInCommentsDoc({
      doc,
      ...sessionArgs,
      actorAuthorId: "agent-1",
    }, removeThreadMark);

    expect(result).toEqual({ kind: "success", removedMarkCount: 2 });
    expect(removeThreadMark).toHaveBeenCalledWith(sessionArgs);
    expect(threadMap.get("status")).toBe("archived");
    expect(threadMap.has("statusBeforeReopen")).toBe(false);
  });

  it("does not mutate a thread authored by a different collaborator", async () => {
    const { doc, threadMap } = createCommentsDoc();
    const removeThreadMark = jest.fn(async () => 1);

    const result = await resolveThreadInCommentsDoc({
      doc,
      ...sessionArgs,
      actorAuthorId: "different-agent",
      actorAuthorName: "Test Agent",
    }, removeThreadMark);

    expect(result).toEqual({ kind: "forbidden", reason: "not_thread_author" });
    expect(removeThreadMark).not.toHaveBeenCalled();
    expect(threadMap.get("status")).toBeUndefined();
  });

  it("uses the original agent name when no stable collaborator id is available", async () => {
    const { doc, threadMap } = createCommentsDoc();
    const removeThreadMark = jest.fn(async () => 0);

    const result = await resolveThreadInCommentsDoc({
      doc,
      ...sessionArgs,
      actorAuthorName: "Test Agent",
      allowAuthorNameFallback: true,
    }, removeThreadMark);

    expect(result).toEqual({ kind: "success", removedMarkCount: 0 });
    expect(threadMap.get("status")).toBe("archived");
  });

  it("rejects suggestion threads and already-resolved threads", async () => {
    const suggestion = createCommentsDoc({ threadType: "suggestion" });
    const archived = createCommentsDoc({ status: "archived" });
    const removeThreadMark = jest.fn(async () => 0);

    await expect(resolveThreadInCommentsDoc({
      doc: suggestion.doc,
      ...sessionArgs,
      actorAuthorId: "agent-1",
    }, removeThreadMark)).resolves.toEqual({ kind: "wrong_thread_type" });
    await expect(resolveThreadInCommentsDoc({
      doc: archived.doc,
      ...sessionArgs,
      actorAuthorId: "agent-1",
    }, removeThreadMark)).resolves.toEqual({ kind: "not_open", status: "archived" });
    expect(removeThreadMark).not.toHaveBeenCalled();
  });
});

describe("$removeCommentThreadMark", () => {
  it("removes the thread highlight without changing its text", async () => {
    const editor = await setupEditorWithContent("Some uniquely quoted text remains.");
    await runEditorUpdate(editor, () => {
      $attachMarkToQuote("uniquely quoted text", "thread-1");
    });

    await runEditorUpdate(editor, () => {
      expect($removeCommentThreadMark("thread-1")).toBe(1);
    });

    editor.getEditorState().read(() => {
      expect($nodesOfType(MarkNode)).toHaveLength(0);
      expect($getRoot().getTextContent()).toBe("Some uniquely quoted text remains.");
    });
  });
});
