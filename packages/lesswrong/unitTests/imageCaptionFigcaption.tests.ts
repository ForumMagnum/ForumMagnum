import { $getRoot, type LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $isImageNode, type ImageNode } from "@/components/lexical/nodes/ImageNode";
import { setupEditorWithHtml, walkLexicalNodes } from "./lexicalTestHelpers";

const IMG_SRC = "https://example.com/image.png";

function exportHtml(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
  });
  return html;
}

function countFigcaptions(html: string): number {
  return (html.match(/<figcaption/g) ?? []).length;
}

function getFirstImageCaptionText(editor: LexicalEditor): string | null {
  let captionText: string | null = null;
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node) => {
      if (captionText === null && $isImageNode(node)) {
        captionText = (node as ImageNode).getCaptionNode()?.getTextContent() ?? null;
      }
    });
  });
  return captionText;
}

describe("image caption figcaption export/import", () => {
  it("exports exactly one figcaption for a captioned image", async () => {
    const editor = await setupEditorWithHtml(
      `<figure class="image"><img src="${IMG_SRC}" alt=""><figcaption><p>My caption</p></figcaption></figure>`
    );

    const html = exportHtml(editor);
    expect(countFigcaptions(html)).toBe(1);
    expect(html).toContain("My caption");
  });

  it("exports no figcaption when the caption is empty", async () => {
    const editor = await setupEditorWithHtml(
      `<figure class="image"><img src="${IMG_SRC}" alt=""><figcaption><p></p></figcaption></figure>`
    );

    const html = exportHtml(editor);
    expect(html).toContain("<figure");
    expect(countFigcaptions(html)).toBe(0);
  });

  it("recovers the real caption from HTML with a spurious empty figcaption", async () => {
    const editor = await setupEditorWithHtml(
      `<figure class="image"><img src="${IMG_SRC}" alt="">` +
      `<figcaption class="image-caption-container"><p></p></figcaption>` +
      `<figcaption class="image-caption-container"><p>Real caption</p></figcaption>` +
      `</figure>`
    );

    expect(getFirstImageCaptionText(editor)).toBe("Real caption");

    const html = exportHtml(editor);
    expect(countFigcaptions(html)).toBe(1);
    expect(html).toContain("Real caption");
  });
});
