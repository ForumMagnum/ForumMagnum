import { $createParagraphNode, $getRoot, $nodesOfType, type LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $insertMarkdownBlockInEditor, $postMarkdownToNodes } from "../../../app/api/agent/insertBlock/route";
import { $applyEditModeReplacement } from "../../../app/api/agent/applyEditAtSelection";
import { $applySuggestionWithNarrowing } from "../../../app/api/agent/replaceText/route";
import { $locateQuoteWithTextIndex } from "../../../app/api/agent/textIndexQuoteLocator";
import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
import { $getFootnoteItems, $getFootnoteReferences, $getFootnoteSection } from "@/components/editor/lexicalPlugins/footnotes/helpers";
import { $isFootnoteContentNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteContentNode";
import { FootnoteSectionNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode";
import { $createFootnoteReferenceNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteReferenceNode";
import { $createSuggestionNode, ProtonNode } from "@/components/editor/lexicalPlugins/suggestedEdits/ProtonNode";
import { $acceptSuggestion } from "@/components/editor/lexicalPlugins/suggestedEdits/acceptSuggestion";
import { $rejectSuggestion } from "@/components/editor/lexicalPlugins/suggestedEdits/rejectSuggestion";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";

async function insertFootnote(editor: LexicalEditor, mode: "edit" | "suggest", location: "start" | "end" = "end") {
  await runEditorUpdate(editor, () => {
    expect($insertMarkdownBlockInEditor({
      editor, mode, location, markdownToNodes: $postMarkdownToNodes,
      markdown: "New text[^note].\n\n[^note]: A **formatted** definition.\n\n    Second paragraph.",
    }).inserted).toBe(true);
  });
}

function checkFootnote(editor: LexicalEditor) {
  editor.getEditorState().read(() => {
    const items = $getFootnoteItems();
    expect(items).toHaveLength(1);
    expect($nodesOfType(FootnoteSectionNode)).toHaveLength(1);
    expect($getRoot().getLastChild()).toBe($getFootnoteSection());
    const content = items[0].getChildren().find($isFootnoteContentNode);
    expect(content?.getTextContent()).toContain("A formatted definition.");
    expect(content?.getTextContent()).toContain("Second paragraph.");
    expect(content?.getChildrenSize()).toBe(2);
    expect($getFootnoteReferences().map(ref => ref.getFootnoteId())).toEqual([items[0].getFootnoteId()]);
    const html = withDomGlobals(() => $generateHtmlFromNodes(editor));
    expect(html).toMatch(/<(strong|b)[^>]*>(<span[^>]*>)?formatted<\//);
    expect(html).not.toContain("↩");
  });
}

describe("agent Markdown footnote import", () => {
  it.each<"edit" | "suggest">(["edit", "suggest"])("preserves insertBlock definitions in %s mode", async mode => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await insertFootnote(editor, mode);
    checkFootnote(editor);
    if (mode === "suggest") {
      await runEditorUpdate(editor, () => {
        $acceptSuggestion($nodesOfType(ProtonNode)[0].getSuggestionIdOrThrow());
      });
      checkFootnote(editor);
    }
  });

  it("merges inserted definitions and orders them by reference, keeping the section last", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await insertFootnote(editor, "edit");
    await insertFootnote(editor, "edit", "start");
    await insertFootnote(editor, "edit");
    editor.getEditorState().read(() => {
      const items = $getFootnoteItems();
      const references = $getFootnoteReferences();
      expect(items).toHaveLength(3);
      expect($nodesOfType(FootnoteSectionNode)).toHaveLength(1);
      expect($getRoot().getLastChild()).toBe($getFootnoteSection());
      expect(items.map(item => item.getFootnoteId())).toEqual(references.map(ref => ref.getFootnoteId()));
      expect(references.map(ref => ref.getFootnoteIndex())).toEqual([1, 2, 3]);
    });
  });

  it("removes a rejected inserted footnote and preserves existing definitions", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await insertFootnote(editor, "edit");
    await insertFootnote(editor, "suggest", "start");
    await runEditorUpdate(editor, () => {
      $rejectSuggestion($nodesOfType(ProtonNode)[0].getSuggestionIdOrThrow());
    });
    checkFootnote(editor);
  });

  it("keeps a definition when rejecting only one of its references", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await insertFootnote(editor, "edit");
    await runEditorUpdate(editor, () => {
      const item = $getFootnoteItems()[0];
      const suggestion = $createSuggestionNode("extra-reference", "insert");
      suggestion.append($createFootnoteReferenceNode(item.getFootnoteId(), 1));
      $getRoot().getFirstChildOrThrow().insertAfter($createParagraphNode().append(suggestion));
    });
    await runEditorUpdate(editor, () => { $rejectSuggestion("extra-reference"); });
    checkFootnote(editor);
  });

  it("preserves tables and repeated references in imported definitions", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await runEditorUpdate(editor, () => {
      expect($insertMarkdownBlockInEditor({
        editor, mode: "edit", location: "end", markdownToNodes: $postMarkdownToNodes,
        markdown: "First[^note], again[^note].\n\n[^note]: Table:\n\n    | Left | Right |\n    | --- | --- |\n    | Alpha | Beta |",
      }).inserted).toBe(true);
    });
    editor.getEditorState().read(() => {
      const items = $getFootnoteItems();
      expect(items).toHaveLength(1);
      expect($getFootnoteReferences().map(ref => ref.getFootnoteId())).toEqual([items[0].getFootnoteId(), items[0].getFootnoteId()]);
      const content = items[0].getChildren().find($isFootnoteContentNode);
      expect(content?.getChildren().map(node => node.getType())).toEqual(["paragraph", "table"]);
      expect(content?.getTextContent()).toContain("Alpha");
      expect(content?.getTextContent()).toContain("Beta");
    });
  });

  it.each<"edit" | "suggest">(["edit", "suggest"])("preserves replaceText definitions in %s mode", async mode => {
    const editor = await setupEditorWithContent("Before original after.");
    await runEditorUpdate(editor, () => {
      const quote = "original";
      const result = $locateQuoteWithTextIndex(quote);
      if (!result.anchor || !result.focus) throw new Error("Quote not found");
      const args = {
        editor, anchor: result.anchor, focus: result.focus, quote, range: result.range,
        replacement: "original[^note]\n\n[^note]: A **formatted** definition.\n\n    Second paragraph.",
        markdownIt: getMarkdownItForAgentPosts(),
      };
      const applied = mode === "edit"
        ? $applyEditModeReplacement(args)
        : $applySuggestionWithNarrowing({ ...args, suggestionId: "footnote-insertion" });
      expect(applied.replaced).toBe(true);
    });
    checkFootnote(editor);
    if (mode === "suggest") {
      await runEditorUpdate(editor, () => { $rejectSuggestion("footnote-insertion"); });
      editor.getEditorState().read(() => {
        expect($getFootnoteItems()).toHaveLength(0);
        expect($getFootnoteReferences()).toHaveLength(0);
        expect($getRoot().getTextContent()).toBe("Before original after.");
      });
    }
  });

  it("does not attach definitions when the insertion locator fails", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await runEditorUpdate(editor, () => {
      expect($insertMarkdownBlockInEditor({
        editor, mode: "edit", location: { after: "Missing paragraph" }, markdownToNodes: $postMarkdownToNodes,
        markdown: "New[^note]\n\n[^note]: Definition",
      }).inserted).toBe(false);
    });
    editor.getEditorState().read(() => {
      expect($getRoot().getTextContent()).toBe("Existing paragraph.");
      expect($getFootnoteItems()).toHaveLength(0);
    });
  });
});
