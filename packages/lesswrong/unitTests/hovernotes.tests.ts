import { $generateHtmlFromNodes } from "@lexical/html";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $getRoot, type LexicalEditor } from "lexical";
import { $isHovernoteNode, HovernoteNode } from "@/components/editor/lexicalPlugins/hovernotes/HovernoteNode";
import { walkLexicalNodes, setupEditorWithHtml, runEditorUpdate } from "./lexicalTestHelpers";
import { $getFootnoteAnchors, $getFootnoteItems, $removeFootnote } from "@/components/editor/lexicalPlugins/footnotes/helpers";

const HOVERNOTE_DOC_HTML = [
  '<p>Before <span class="hovernote" data-hovernote="" data-footnote-id="abc123" role="doc-noteref" id="fnrefabc123">highlighted text</span> after.</p>',
  '<p>Also a regular footnote<span class="footnote-reference" data-footnote-reference="" data-footnote-id="def456" data-footnote-index="2" role="doc-noteref" id="fnrefdef456"><sup><a href="#fndef456">[2]</a></sup></span>.</p>',
  '<ol class="footnote-section footnotes" data-footnote-section="" role="doc-endnotes">',
  '<li class="footnote-item" data-footnote-item="" data-footnote-id="abc123" data-footnote-index="1" role="doc-endnote" id="fnabc123">',
  '<span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="abc123"><sup><strong><a href="#fnrefabc123">^</a></strong></sup></span>',
  '<div class="footnote-content" data-footnote-content=""><p>The hovernote body.</p></div></li>',
  '<li class="footnote-item" data-footnote-item="" data-footnote-id="def456" data-footnote-index="2" role="doc-endnote" id="fndef456">',
  '<span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="def456"><sup><strong><a href="#fnrefdef456">^</a></strong></sup></span>',
  '<div class="footnote-content" data-footnote-content=""><p>The regular footnote body.</p></div></li>',
  '</ol>',
].join('');

function findHovernotes(editor: LexicalEditor): HovernoteNode[] {
  const hovernotes: HovernoteNode[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node) => {
      if ($isHovernoteNode(node)) {
        hovernotes.push(node);
      }
    });
  });
  return hovernotes;
}

describe("hovernotes", () => {
  it("imports a hovernote span from HTML and exports it back", async () => {
    const editor = await setupEditorWithHtml(HOVERNOTE_DOC_HTML);

    const hovernotes = findHovernotes(editor);
    expect(hovernotes).toHaveLength(1);
    editor.getEditorState().read(() => {
      expect(hovernotes[0].getFootnoteId()).toBe("abc123");
      expect(hovernotes[0].getTextContent()).toBe("highlighted text");
    });

    // Unlike plain MarkNodes (which are excluded from HTML generation), the
    // hovernote span must survive the export that saves the document.
    const html = withDomGlobals(() => editor.getEditorState().read(() => $generateHtmlFromNodes(editor, null)));
    expect(html).toContain('data-hovernote');
    expect(html).toContain('data-footnote-id="abc123"');
    expect(html).toContain('id="fnrefabc123"');
    expect(html).toContain('class="hovernote"');
  });

  it("counts hovernotes as footnote anchors, ordered with references", async () => {
    const editor = await setupEditorWithHtml(HOVERNOTE_DOC_HTML);
    editor.getEditorState().read(() => {
      const anchors = $getFootnoteAnchors();
      expect(anchors.map((anchor) => anchor.getFootnoteId())).toEqual(["abc123", "def456"]);
    });
  });

  it("unwraps the hovernote (keeping its text) when its footnote is removed", async () => {
    const editor = await setupEditorWithHtml(HOVERNOTE_DOC_HTML);
    await runEditorUpdate(editor, () => {
      const item = $getFootnoteItems().find((i) => i.getFootnoteId() === "abc123");
      expect(item).toBeTruthy();
      $removeFootnote(item!);
    });

    expect(findHovernotes(editor)).toHaveLength(0);
    editor.getEditorState().read(() => {
      expect($getRoot().getTextContent()).toContain("Before highlighted text after.");
      // The other footnote survives and is renumbered to 1
      const items = $getFootnoteItems();
      expect(items).toHaveLength(1);
      expect(items[0].getFootnoteId()).toBe("def456");
      expect(items[0].getFootnoteIndex()).toBe(1);
    });
  });
});
