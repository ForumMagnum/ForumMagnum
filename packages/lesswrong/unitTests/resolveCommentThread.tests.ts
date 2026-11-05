import { type LexicalEditor, $getRoot } from "lexical";
import { $dfs } from "@lexical/utils";
import { $isMarkNode } from "@lexical/mark";
import { Doc, Map as YMap, Array as YArray } from "yjs";
import {
  $attachMarkToQuote,
  $removeCommentThreadMarks,
  archiveThreadMap,
  checkThreadResolvable,
} from "../../../app/api/agent/collabCommentThreads";
import { runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";

function getAllMarkIds(editor: LexicalEditor): string[] {
  const markIds: string[] = [];
  editor.getEditorState().read(() => {
    for (const { node } of $dfs()) {
      if ($isMarkNode(node)) {
        markIds.push(...node.getIDs());
      }
    }
  });
  return markIds;
}

function getRootText(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => $getRoot().getTextContent());
}

async function attachMark(editor: LexicalEditor, quote: string, markId: string): Promise<void> {
  await runEditorUpdate(editor, () => {
    const result = $attachMarkToQuote(quote, markId);
    if (!result.markCreated) throw new Error(`Failed to attach mark for quote: ${quote}`);
  });
}

async function removeMarks(editor: LexicalEditor, markId: string): Promise<number> {
  let removedCount = 0;
  await runEditorUpdate(editor, () => {
    removedCount = $removeCommentThreadMarks(markId);
  });
  return removedCount;
}

function addThread(doc: Doc, fields: Record<string, unknown>): void {
  const threadMap = new YMap<unknown>();
  threadMap.set("type", "thread");
  threadMap.set("comments", new YArray<unknown>());
  for (const [key, value] of Object.entries(fields)) {
    threadMap.set(key, value);
  }
  doc.get("comments", YArray<unknown>).push([threadMap]);
}

describe("resolveCommentThread mark removal", () => {
  it("removes a thread's highlight without changing the text", async () => {
    const editor = await setupEditorWithContent("The quick brown fox jumps over the lazy dog.");
    const textBefore = getRootText(editor);
    await attachMark(editor, "brown fox", "thread1");
    expect(getAllMarkIds(editor)).toEqual(["thread1"]);

    expect(await removeMarks(editor, "thread1")).toBe(1);
    expect(getAllMarkIds(editor)).toEqual([]);
    expect(getRootText(editor)).toBe(textBefore);
  });

  it("removes every piece of a highlight that spans paragraphs", async () => {
    const editor = await setupEditorWithContent("First paragraph ends here.\n\nSecond paragraph starts now.");
    await attachMark(editor, "ends here.\n\nSecond paragraph", "thread1");
    expect(getAllMarkIds(editor).length).toBeGreaterThan(1);

    await removeMarks(editor, "thread1");
    expect(getAllMarkIds(editor)).toEqual([]);
  });

  it("leaves other threads' highlights on overlapping text intact", async () => {
    const editor = await setupEditorWithContent("The quick brown fox jumps over the lazy dog.");
    await attachMark(editor, "quick brown fox", "thread1");
    await attachMark(editor, "brown fox jumps", "thread2");

    await removeMarks(editor, "thread1");
    const remaining = getAllMarkIds(editor);
    expect(remaining).not.toContain("thread1");
    expect(remaining).toContain("thread2");
  });

  it("does nothing when the thread has no highlight (e.g. its anchor text was deleted)", async () => {
    const editor = await setupEditorWithContent("Some text.");
    await attachMark(editor, "Some", "other");
    expect(await removeMarks(editor, "thread1")).toBe(0);
    expect(getAllMarkIds(editor)).toEqual(["other"]);
  });
});

describe("resolveCommentThread status update", () => {
  it("archives an open comment thread and clears statusBeforeReopen", () => {
    const doc = new Doc();
    addThread(doc, { id: "t1", threadType: "comment", statusBeforeReopen: "archived" });
    const check = checkThreadResolvable(doc.get("comments", YArray<unknown>), "t1");
    if (check.kind !== "resolvable") throw new Error(`Expected resolvable, got ${check.kind}`);

    archiveThreadMap(doc, check.threadMap);
    expect(check.threadMap.get("status")).toBe("archived");
    expect(check.threadMap.has("statusBeforeReopen")).toBe(false);
  });

  it("treats threads with no threadType as comment threads", () => {
    const doc = new Doc();
    addThread(doc, { id: "t1" });
    expect(checkThreadResolvable(doc.get("comments", YArray<unknown>), "t1").kind).toBe("resolvable");
  });

  it("rejects missing threads, suggestion threads, and already-closed threads", () => {
    const doc = new Doc();
    addThread(doc, { id: "suggestion", threadType: "suggestion" });
    addThread(doc, { id: "archived", threadType: "comment", status: "archived" });
    addThread(doc, { id: "open", threadType: "comment", status: "open" });
    const comments = doc.get("comments", YArray<unknown>);

    expect(checkThreadResolvable(comments, "missing")).toEqual({ kind: "thread_not_found" });
    expect(checkThreadResolvable(comments, "suggestion")).toEqual({ kind: "not_a_comment_thread" });
    expect(checkThreadResolvable(comments, "archived")).toEqual({ kind: "already_closed", status: "archived" });
    expect(checkThreadResolvable(comments, "open").kind).toBe("resolvable");
  });
});
