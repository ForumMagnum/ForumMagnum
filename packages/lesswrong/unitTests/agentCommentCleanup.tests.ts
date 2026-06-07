import { $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $isMarkNode } from "@lexical/mark";
import { Array as YArray, Doc, Map as YMap } from "yjs";
import { createCollabComment, $attachMarkToQuote } from "../../../app/api/agent/commentOnDraft/route";
import { $removeCommentThreadMark, deleteCommentThreadFromCommentsArray } from "../../../app/api/agent/deleteComment/route";
import { runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";

function createCollabThread(threadId: string, commentId: string): YMap<unknown> {
  const comments = new YArray<YMap<unknown>>();
  comments.insert(0, [
    createCollabComment({
      content: `Comment for ${threadId}`,
      author: "Test Agent",
      authorId: "test-agent",
      id: commentId,
    }),
  ]);

  const thread = new YMap<unknown>();
  thread.set("type", "thread");
  thread.set("id", threadId);
  thread.set("quote", "");
  thread.set("threadType", "comment");
  thread.set("comments", comments);
  return thread;
}

function getThreadIds(comments: YArray<YMap<unknown>>): unknown[] {
  const ids: unknown[] = [];
  for (let i = 0; i < comments.length; i++) {
    ids.push(comments.get(i).get("id"));
  }
  return ids;
}

function getAllMarkIds(editor: LexicalEditor): string[] {
  const markIds: string[] = [];
  editor.getEditorState().read(() => {
    function walk(node: LexicalNode) {
      if ($isMarkNode(node)) {
        markIds.push(...node.getIDs());
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) {
          walk(child);
        }
      }
    }
    walk($getRoot());
  });
  return markIds;
}

describe("agent comment cleanup", () => {
  it("deletes the requested draft comment thread from the comments Yjs array", () => {
    const doc = new Doc();
    const comments = doc.get("comments", YArray<YMap<unknown>>);
    comments.insert(0, [
      createCollabThread("thread-a", "comment-a"),
      createCollabThread("thread-b", "comment-b"),
      createCollabThread("thread-c", "comment-c"),
    ]);

    expect(deleteCommentThreadFromCommentsArray(comments, "thread-b")).toBe(true);

    expect(getThreadIds(comments)).toEqual(["thread-a", "thread-c"]);
  });

  it("leaves the comments Yjs array unchanged when the thread is absent", () => {
    const doc = new Doc();
    const comments = doc.get("comments", YArray<YMap<unknown>>);
    comments.insert(0, [
      createCollabThread("thread-a", "comment-a"),
      createCollabThread("thread-b", "comment-b"),
    ]);

    expect(deleteCommentThreadFromCommentsArray(comments, "missing-thread")).toBe(false);

    expect(getThreadIds(comments)).toEqual(["thread-a", "thread-b"]);
  });

  it("removes the inline mark for a deleted comment thread without changing text", async () => {
    const editor = await setupEditorWithContent("The quote to clean up is inside this paragraph.");
    await runEditorUpdate(editor, () => {
      const result = $attachMarkToQuote("quote to clean up", "thread-to-delete");
      expect(result.markCreated).toBe(true);
    });

    expect(getAllMarkIds(editor)).toContain("thread-to-delete");

    let removed = false;
    await runEditorUpdate(editor, () => {
      removed = $removeCommentThreadMark("thread-to-delete");
    });

    expect(removed).toBe(true);
    expect(getAllMarkIds(editor)).not.toContain("thread-to-delete");
    editor.getEditorState().read(() => {
      expect($getRoot().getTextContent()).toBe("The quote to clean up is inside this paragraph.");
    });
  });

  it("reports no mark removal when the inline mark is absent", async () => {
    const editor = await setupEditorWithContent("No comment marks here.");

    let removed = true;
    await runEditorUpdate(editor, () => {
      removed = $removeCommentThreadMark("missing-thread");
    });

    expect(removed).toBe(false);
    expect(getAllMarkIds(editor)).toEqual([]);
  });
});
