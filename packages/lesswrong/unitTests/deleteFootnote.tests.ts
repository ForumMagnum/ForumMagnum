import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from "lexical";
import { $createFootnoteContentNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteContentNode";
import { $createFootnoteItemNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteItemNode";
import { $createFootnoteReferenceNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteReferenceNode";
import { $createFootnoteSectionNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode";
import { $getFootnoteItems, $getFootnoteReferences, $getFootnoteSection } from "@/components/editor/lexicalPlugins/footnotes/helpers";
import { $deleteFootnoteByPrefix } from "../../../app/api/agent/deleteFootnote";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { runEditorUpdate } from "./lexicalTestHelpers";

async function setupFootnotes(ids: string[] = ["first", "second"], text = "Definition"): Promise<LexicalEditor> {
  const editor = createHeadlessEditor("DeleteFootnoteTest");
  await runEditorUpdate(editor, () => {
    const paragraph = $createParagraphNode().append($createTextNode("Body text."));
    const section = $createFootnoteSectionNode();
    for (const [index, id] of ids.entries()) {
      paragraph.append($createFootnoteReferenceNode(id, index + 1));
      const content = $createFootnoteContentNode().append(
        $createParagraphNode().append($createTextNode(text)),
      );
      section.append($createFootnoteItemNode(id, index + 1).append(content));
    }
    $getRoot().append(paragraph, section);
  });
  return editor;
}

describe("deleteBlock footnote definitions", () => {
  it("removes the targeted definition and repeated references, preserving and renumbering others", async () => {
    const editor = await setupFootnotes();
    await runEditorUpdate(editor, () => {
      $getRoot().append($createParagraphNode().append(
        $createTextNode("Another citation"),
        $createFootnoteReferenceNode("first", 1),
      ));
      expect($deleteFootnoteByPrefix("[^first]: Definition", "edit")).toEqual({
        deleted: true,
        note: "Deleted footnote definition and its references.",
        deletionIndex: 0,
      });
    });
    editor.getEditorState().read(() => {
      expect($getFootnoteItems().map(item => [item.getFootnoteId(), item.getFootnoteIndex()]))
        .toEqual([["second", 1]]);
      expect($getFootnoteReferences().map(ref => [ref.getFootnoteId(), ref.getFootnoteIndex(), ref.getTextContent()]))
        .toEqual([["second", 1, "[1]"]]);
      expect($getRoot().getTextContent()).toContain("Body text.");
      expect($getRoot().getTextContent()).toContain("Another citation");
    });
  });

  it("deletes an empty definition by ID and removes the final footnote section", async () => {
    const editor = await setupFootnotes(["empty"], "");
    await runEditorUpdate(editor, () => {
      expect($deleteFootnoteByPrefix("[^empty]:", "edit")?.deleted).toBe(true);
    });
    editor.getEditorState().read(() => {
      expect($getFootnoteSection()).toBeNull();
      expect($getFootnoteReferences()).toEqual([]);
      expect($getRoot().getTextContent()).toBe("Body text.");
    });
  });

  it("does not fall back to text matching for an unknown ID", async () => {
    const editor = await setupFootnotes();
    const before = editor.getEditorState().toJSON();
    await runEditorUpdate(editor, () => {
      expect($deleteFootnoteByPrefix("[^missing]: Definition", "edit")).toEqual({
        deleted: false,
        note: 'No footnote has ID "missing".',
      });
    });
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });

  it("refuses duplicate IDs without modifying the draft", async () => {
    const editor = await setupFootnotes(["duplicate", "duplicate"]);
    const before = editor.getEditorState().toJSON();
    await runEditorUpdate(editor, () => {
      expect($deleteFootnoteByPrefix("[^duplicate]:", "edit")).toEqual({
        deleted: false,
        note: 'Ambiguous footnote ID "duplicate": 2 definitions found.',
      });
    });
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });

  it("rejects suggest mode without removing references or partially marking the definition", async () => {
    const editor = await setupFootnotes();
    const before = editor.getEditorState().toJSON();
    await runEditorUpdate(editor, () => {
      const result = $deleteFootnoteByPrefix("[^first]: Definition", "suggest");
      expect(result?.deleted).toBe(false);
      expect(result?.note).toContain('mode "edit"');
    });
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });

  it("leaves ordinary block prefixes and inline footnote citations to the block matcher", async () => {
    const editor = await setupFootnotes();
    const before = editor.getEditorState().toJSON();
    await runEditorUpdate(editor, () => {
      expect($deleteFootnoteByPrefix("Body text.", "edit")).toBeNull();
      expect($deleteFootnoteByPrefix("[^first]", "edit")).toBeNull();
    });
    expect(editor.getEditorState().toJSON()).toEqual(before);
  });
});
