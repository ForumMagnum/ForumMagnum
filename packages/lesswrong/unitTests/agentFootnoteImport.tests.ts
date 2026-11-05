import { $createParagraphNode, $getRoot, $isLineBreakNode, $nodesOfType, type LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $dfs } from "@lexical/utils";
import { $insertMarkdownBlockInEditor, $postMarkdownToNodes } from "../../../app/api/agent/insertBlock/route";
import { $insertLLMBlockInEditor } from "../../../app/api/agent/insertLLMBlock/route";
import { $insertWidgetInEditor } from "../../../app/api/agent/insertWidget/route";
import { $applyEditModeReplacement } from "../../../app/api/agent/applyEditAtSelection";
import { $applySuggestionWithNarrowing } from "../../../app/api/agent/replaceText/route";
import { $locateQuoteWithTextIndex } from "../../../app/api/agent/textIndexQuoteLocator";
import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
import { $getFootnoteItems, $getFootnoteReferences, $getFootnoteSection } from "@/components/editor/lexicalPlugins/footnotes/helpers";
import { $isFootnoteContentNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteContentNode";
import { $isFootnoteSectionNode, FootnoteSectionNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode";
import { $isFootnoteItemNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteItemNode";
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

async function replaceOriginal(editor: LexicalEditor, mode: "edit" | "suggest", replacement: string) {
  await runEditorUpdate(editor, () => {
    const quote = "original";
    const result = $locateQuoteWithTextIndex(quote);
    if (!result.anchor || !result.focus) throw new Error("Quote not found");
    const args = {
      editor, anchor: result.anchor, focus: result.focus, quote, range: result.range, replacement,
      markdownIt: getMarkdownItForAgentPosts(),
    };
    const applied = mode === "edit"
      ? $applyEditModeReplacement(args)
      : $applySuggestionWithNarrowing({ ...args, suggestionId: "footnote-insertion" });
    expect(applied.replaced).toBe(true);
    // Narrowing could separate footnote syntax from what it belongs to.
    expect(applied.narrowedReplacement).toBe(replacement);
  });
}

/** Every footnote section in the document, including any nested below the top level. */
function $getAllFootnoteSections(): FootnoteSectionNode[] {
  return $dfs().map(({ node }) => node).filter($isFootnoteSectionNode);
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
    await replaceOriginal(
      editor, mode, "original[^note]\n\n[^note]: A **formatted** definition.\n\n    Second paragraph.",
    );
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

  it.each<"edit" | "suggest">(["edit", "suggest"])("imports inline footnotes in replaceText %s mode", async mode => {
    const editor = await setupEditorWithContent("Before original after.");
    await replaceOriginal(editor, mode, "original^[An inline note.]");
    editor.getEditorState().read(() => {
      const sections = $getAllFootnoteSections();
      expect(sections).toHaveLength(1);
      expect($getRoot().getLastChild()).toBe(sections[0]);
      expect(sections[0].getChildren().every($isFootnoteItemNode)).toBe(true);
      const items = $getFootnoteItems();
      expect(items).toHaveLength(1);
      const content = items[0].getChildren().find($isFootnoteContentNode);
      expect(content?.getChildren().map(node => node.getTextContent())).toEqual(["An inline note."]);
      expect($getFootnoteReferences().map(ref => ref.getFootnoteId())).toEqual([items[0].getFootnoteId()]);
      // The rendered footnote's newlines must not survive as line breaks.
      expect($dfs().some(({ node }) => $isLineBreakNode(node))).toBe(false);
    });
  });

  it("attaches insertLLMBlock definitions to the document's footnote section", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await insertFootnote(editor, "edit");
    await runEditorUpdate(editor, () => {
      expect($insertLLMBlockInEditor({
        editor, modelName: "test-model", location: "end", markdownToNodes: $postMarkdownToNodes,
        markdown: "Model output[^llm].\n\n[^llm]: Model definition.",
      }).inserted).toBe(true);
    });
    editor.getEditorState().read(() => {
      const sections = $getAllFootnoteSections();
      expect(sections).toHaveLength(1);
      expect($getRoot().getLastChild()).toBe(sections[0]);
      const items = $getFootnoteItems();
      expect(items.map(item => item.getFootnoteId())).toEqual($getFootnoteReferences().map(ref => ref.getFootnoteId()));
      expect(items.map(item => item.getTextContent())).toEqual([
        expect.stringContaining("A formatted definition."),
        expect.stringContaining("Model definition."),
      ]);
    });
  });

  it("inserts widgets above the footnote section", async () => {
    const editor = await setupEditorWithContent("Existing paragraph.");
    await insertFootnote(editor, "edit");
    await runEditorUpdate(editor, () => {
      expect($insertWidgetInEditor({ content: "<p>Widget</p>", location: "end" }).inserted).toBe(true);
    });
    editor.getEditorState().read(() => {
      expect($getRoot().getLastChild()).toBe($getFootnoteSection());
    });
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
