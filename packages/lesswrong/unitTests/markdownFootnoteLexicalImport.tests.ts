import { $generateHtmlFromNodes } from "@lexical/html";
import type { LexicalEditor } from "lexical";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $getFootnoteItems } from "@/components/editor/lexicalPlugins/footnotes/helpers";
import { $isFootnoteBackLinkNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteBackLinkNode";
import { $isFootnoteContentNode } from "@/components/editor/lexicalPlugins/footnotes/FootnoteContentNode";
import { setupEditorWithContent, setupEditorWithHtml } from "./lexicalTestHelpers";

interface FootnoteItemSummary {
  childTypes: string[]
  contentBlockTypes: string[]
  contentText: string
}

function getFootnoteItemSummaries(editor: LexicalEditor): FootnoteItemSummary[] {
  return editor.getEditorState().read(() => $getFootnoteItems().map((item) => {
    const children = item.getChildren();
    const content = children.find($isFootnoteContentNode);
    return {
      childTypes: children.map((child) => child.getType()),
      contentBlockTypes: content?.getChildren().map((child) => child.getType()) ?? [],
      contentText: content?.getTextContent() ?? "",
    };
  }));
}

function exportMarkdown(editor: LexicalEditor): string {
  const html = editor.getEditorState().read(() => withDomGlobals(() => $generateHtmlFromNodes(editor, null)));
  return htmlToMarkdown(html);
}

describe("importing markdown footnotes into Lexical", () => {
  it("puts footnote bodies inside a footnote content node", async () => {
    const editor = await setupEditorWithContent(
      "Hello world[^1] and more[^2].\n\n[^1]: First note with **bold**.\n\n[^2]: Second note.\n\n    Second paragraph.\n"
    );

    expect(getFootnoteItemSummaries(editor)).toEqual([
      {
        childTypes: ["footnote-back-link", "footnote-content"],
        contentBlockTypes: ["paragraph"],
        contentText: "First note with bold.",
      },
      {
        childTypes: ["footnote-back-link", "footnote-content"],
        contentBlockTypes: ["paragraph", "paragraph"],
        contentText: "Second note.\n\nSecond paragraph.",
      },
    ]);
  });

  it("keeps footnote text when exported back to markdown", async () => {
    const editor = await setupEditorWithContent("Body text[^a].\n\n[^a]: The footnote text.\n");
    const markdown = exportMarkdown(editor);

    expect(markdown).toContain("The footnote text.");
    expect(markdown).not.toContain("↩");
  });

  it("wraps bare inline footnote content in a paragraph", async () => {
    const editor = await setupEditorWithHtml(`
      <p>Body<span data-footnote-reference="" data-footnote-index="1" data-footnote-id="x" class="footnote-reference"><sup><a href="#fnx">[1]</a></sup></span></p>
      <ol data-footnote-section="" class="footnote-section footnotes">
        <li data-footnote-item="" data-footnote-index="1" data-footnote-id="x" class="footnote-item">Plain <em>inline</em> note</li>
      </ol>
    `);

    expect(getFootnoteItemSummaries(editor)).toEqual([{
      childTypes: ["footnote-back-link", "footnote-content"],
      contentBlockTypes: ["paragraph"],
      contentText: "Plain inline note",
    }]);
  });

  it("leaves footnotes that already have a content node unchanged", async () => {
    const editor = await setupEditorWithHtml(`
      <p>Body<span data-footnote-reference="" data-footnote-index="1" data-footnote-id="y" class="footnote-reference"><sup><a href="#fny">[1]</a></sup></span></p>
      <ol data-footnote-section="" class="footnote-section footnotes">
        <li data-footnote-item="" data-footnote-index="1" data-footnote-id="y" class="footnote-item">
          <span data-footnote-back-link="" data-footnote-id="y" class="footnote-back-link"><sup><strong><a href="#fnrefy">^</a></strong></sup></span>
          <div data-footnote-content="" class="footnote-content"><p>Existing note</p></div>
        </li>
      </ol>
    `);

    expect(getFootnoteItemSummaries(editor)).toEqual([{
      childTypes: ["footnote-back-link", "footnote-content"],
      contentBlockTypes: ["paragraph"],
      contentText: "Existing note",
    }]);
    const backLinkCount = editor.getEditorState().read(() =>
      $getFootnoteItems().flatMap((item) => item.getChildren()).filter($isFootnoteBackLinkNode).length
    );
    expect(backLinkCount).toBe(1);
  });
});
