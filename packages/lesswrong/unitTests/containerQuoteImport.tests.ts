import { $createRangeSelection, $getRoot, $getSelection, $isParagraphNode, $isRangeSelection, $isTextNode, $setSelection, type LexicalEditor, type LexicalNode } from "lexical";
import { $isListNode } from "@lexical/list";
import { ContainerQuoteNode, $createContainerQuoteNode, $isContainerQuoteNode } from "@/components/editor/lexicalPlugins/quote/ContainerQuoteNode";
import { $normalizeQuoteChildren } from "@/components/editor/lexicalPlugins/quote/ContainerQuotePlugin";
import { formatQuote } from "@/components/lexical/plugins/ToolbarPlugin/utils";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { runEditorUpdate, setupEditorWithHtml, walkLexicalNodes } from "./lexicalTestHelpers";

function findQuoteNodes(editor: import("lexical").LexicalEditor): ContainerQuoteNode[] {
  const quotes: ContainerQuoteNode[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node: LexicalNode) => {
      if ($isContainerQuoteNode(node)) {
        quotes.push(node);
      }
    });
  });
  return quotes;
}

async function runFormatQuote(editor: LexicalEditor): Promise<void> {
  await new Promise<void>((resolve) => {
    const unregister = editor.registerUpdateListener(() => {
      unregister();
      resolve();
    });
    formatQuote(editor, "paragraph");
  });
}

describe("ContainerQuoteNode HTML import", () => {
  it("drops an empty <blockquote> (Chrome triple-click clipboard payload)", async () => {
    // Chrome serializes a triple-click selection that ends at the start of a
    // following blockquote as: the paragraph, an empty <blockquote>, and an
    // Apple-interchange-newline marker.
    const editor = await setupEditorWithHtml(
      `<meta charset='utf-8'><p style="margin-top: 1em;">Yes, this is something I can do.</p>` +
      `<blockquote style="margin: 0px 0px 0px 12px;"></blockquote>` +
      `<br class="Apple-interchange-newline">`
    );

    expect(findQuoteNodes(editor)).toHaveLength(0);
    editor.getEditorState().read(() => {
      expect($getRoot().getTextContent()).toContain("Yes, this is something I can do.");
    });
  });

  it("drops a whitespace-only <blockquote>", async () => {
    const editor = await setupEditorWithHtml(`<p>before</p><blockquote>\n   \n</blockquote><p>after</p>`);
    expect(findQuoteNodes(editor)).toHaveLength(0);
  });

  it("drops an empty <blockquote> nested inside a non-empty one", async () => {
    const editor = await setupEditorWithHtml(
      `<blockquote><p>quoted text</p><blockquote></blockquote></blockquote>`
    );

    const quotes = findQuoteNodes(editor);
    expect(quotes).toHaveLength(1);
    editor.getEditorState().read(() => {
      expect(quotes[0].getTextContent()).toBe("quoted text");
    });
  });

  it("still imports a blockquote with inline content as a quote with a paragraph child", async () => {
    const editor = await setupEditorWithHtml(`<blockquote>some <strong>inline</strong> content</blockquote>`);

    const quotes = findQuoteNodes(editor);
    expect(quotes).toHaveLength(1);
    editor.getEditorState().read(() => {
      const children = quotes[0].getChildren();
      expect(children.length).toBeGreaterThan(0);
      expect(children.every((child) => $isParagraphNode(child))).toBe(true);
      expect(quotes[0].getTextContent()).toBe("some inline content");
    });
  });
});

describe("$normalizeQuoteChildren", () => {
  it("gives a childless quote an empty paragraph so it stays editable", async () => {
    const editor = createHeadlessEditor("ContainerQuoteImportTest");
    const removeTransform = editor.registerNodeTransform(ContainerQuoteNode, $normalizeQuoteChildren);

    await runEditorUpdate(editor, () => {
      $getRoot().clear().append($createContainerQuoteNode());
    });

    const quotes = findQuoteNodes(editor);
    expect(quotes).toHaveLength(1);
    editor.getEditorState().read(() => {
      const children = quotes[0].getChildren();
      expect(children).toHaveLength(1);
      expect($isParagraphNode(children[0])).toBe(true);
    });
    removeTransform();
  });
});

describe("formatQuote", () => {
  it("wraps a mixed paragraph and list selection in a single container quote", async () => {
    const editor = await setupEditorWithHtml(
      `<p>First paragraph</p><ul><li>First item</li><li>Second item</li></ul><p>Last paragraph</p>`
    );
    const removeTransform = editor.registerNodeTransform(ContainerQuoteNode, $normalizeQuoteChildren);

    await runEditorUpdate(editor, () => {
      const root = $getRoot();
      const firstParagraph = root.getFirstChildOrThrow();
      const lastParagraph = root.getLastChildOrThrow();
      const firstText = firstParagraph.getFirstDescendant();
      const lastText = lastParagraph.getFirstDescendant();
      if (!$isTextNode(firstText) || !$isTextNode(lastText)) {
        throw new Error("Expected paragraph text nodes");
      }

      const selection = $createRangeSelection();
      selection.anchor.set(firstText.getKey(), 0, "text");
      selection.focus.set(lastText.getKey(), lastText.getTextContentSize(), "text");
      $setSelection(selection);
    });

    await runFormatQuote(editor);

    const quotes = findQuoteNodes(editor);
    expect(quotes).toHaveLength(1);
    editor.getEditorState().read(() => {
      const children = quotes[0].getChildren();
      expect(children).toHaveLength(3);
      expect($isParagraphNode(children[0])).toBe(true);
      expect($isListNode(children[1])).toBe(true);
      expect($isParagraphNode(children[2])).toBe(true);
      expect(quotes[0].getTextContent()).toBe("First paragraph\n\nFirst item\n\nSecond item\n\nLast paragraph");
    });
    removeTransform();
  });

  it("wraps a whole-document element selection in a single container quote", async () => {
    const editor = await setupEditorWithHtml(
      `<p>First paragraph</p><ul><li>First item</li><li>Second item</li></ul><p>Last paragraph</p>`
    );
    const removeTransform = editor.registerNodeTransform(ContainerQuoteNode, $normalizeQuoteChildren);

    await runEditorUpdate(editor, () => {
      const root = $getRoot();
      const selection = $createRangeSelection();
      selection.anchor.set(root.getKey(), 0, "element");
      selection.focus.set(root.getKey(), root.getChildrenSize(), "element");
      $setSelection(selection);
    });

    await runFormatQuote(editor);

    const quotes = findQuoteNodes(editor);
    expect(quotes).toHaveLength(1);
    editor.getEditorState().read(() => {
      const children = quotes[0].getChildren();
      expect(children).toHaveLength(3);
      expect($isParagraphNode(children[0])).toBe(true);
      expect($isListNode(children[1])).toBe(true);
      expect($isParagraphNode(children[2])).toBe(true);
      const selection = $getSelection();
      expect($isRangeSelection(selection)).toBe(true);
      if (!$isRangeSelection(selection)) {
        throw new Error("Expected quote selection");
      }
      expect(selection.anchor.key).toBe(quotes[0].getKey());
      expect(selection.anchor.offset).toBe(0);
      expect(selection.focus.key).toBe(quotes[0].getKey());
      expect(selection.focus.offset).toBe(3);
    });
    removeTransform();
  });
});
