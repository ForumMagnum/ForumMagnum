import { $getRoot, $isParagraphNode, type LexicalNode } from "lexical";
import { ContainerQuoteNode, $createContainerQuoteNode, $isContainerQuoteNode } from "@/components/editor/lexicalPlugins/quote/ContainerQuoteNode";
import { $normalizeQuoteChildren } from "@/components/editor/lexicalPlugins/quote/ContainerQuotePlugin";
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
