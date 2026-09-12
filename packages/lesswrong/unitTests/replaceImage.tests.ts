import { $getRoot, type LexicalEditor } from "lexical";
import { $isImageNode } from "@/components/lexical/nodes/ImageNode";
import { $replaceImageInEditor } from "../../../app/api/agent/replaceImage/route";
import {
  runEditorUpdate,
  setupEditorWithHtml,
  walkLexicalNodes,
} from "./lexicalTestHelpers";

const CURRENT_SRC = "https://example.com/current.png";
const REPLACEMENT_SRC = "https://example.com/replacement.png";

interface ImageSnapshot {
  src: string;
  srcset: string | null;
  altText: string;
  caption: string | null;
  width: "inherit" | number;
  widthPercent: number | null;
}

function getImageSnapshots(editor: LexicalEditor): ImageSnapshot[] {
  const images: ImageSnapshot[] = [];
  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node) => {
      if ($isImageNode(node)) {
        images.push({
          src: node.getSrc(),
          srcset: node.getSrcset(),
          altText: node.getAltText(),
          caption: node.getCaptionNode()?.getTextContent() ?? null,
          width: node.getWidth(),
          widthPercent: node.getWidthPercent(),
        });
      }
    });
  });
  return images;
}

describe("replaceImage agent edit", () => {
  it("replaces the source while preserving caption, alt text, and display size", async () => {
    const editor = await setupEditorWithHtml(
      `<figure class="image image_resized" style="width:65%">` +
      `<img src="${CURRENT_SRC}" srcset="${CURRENT_SRC} 2x" alt="Existing alt" width="420">` +
      `<figcaption><p>Keep this caption</p></figcaption>` +
      `</figure>`,
    );

    let replaced = false;
    await runEditorUpdate(editor, () => {
      const result = $replaceImageInEditor({
        currentSrc: CURRENT_SRC,
        replacementSrc: REPLACEMENT_SRC,
      });
      replaced = result.replaced;
    });

    expect(replaced).toBe(true);
    expect(getImageSnapshots(editor)).toEqual([{
      src: REPLACEMENT_SRC,
      srcset: null,
      altText: "Existing alt",
      caption: "Keep this caption",
      width: 420,
      widthPercent: 65,
    }]);
  });

  it("can update alt text without changing the caption", async () => {
    const editor = await setupEditorWithHtml(
      `<figure class="image"><img src="${CURRENT_SRC}" alt="Old alt">` +
      `<figcaption><p>Caption text</p></figcaption></figure>`,
    );

    await runEditorUpdate(editor, () => {
      $replaceImageInEditor({
        currentSrc: CURRENT_SRC,
        replacementSrc: REPLACEMENT_SRC,
        altText: "New alt",
      });
    });

    expect(getImageSnapshots(editor)[0]).toMatchObject({
      src: REPLACEMENT_SRC,
      altText: "New alt",
      caption: "Caption text",
    });
  });

  it("does not replace when the current source is ambiguous", async () => {
    const editor = await setupEditorWithHtml(
      `<p><img src="${CURRENT_SRC}" alt="First"></p>` +
      `<p><img src="${CURRENT_SRC}" alt="Second"></p>`,
    );

    let result = { replaced: true, matchCount: 0 };
    await runEditorUpdate(editor, () => {
      result = $replaceImageInEditor({
        currentSrc: CURRENT_SRC,
        replacementSrc: REPLACEMENT_SRC,
      });
    });

    expect(result).toMatchObject({ replaced: false, matchCount: 2 });
    expect(getImageSnapshots(editor).map((image) => image.src)).toEqual([
      CURRENT_SRC,
      CURRENT_SRC,
    ]);
  });
});
