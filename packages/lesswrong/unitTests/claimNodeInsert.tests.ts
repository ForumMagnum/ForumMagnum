import { $createRangeSelection, $getRoot, $isElementNode, $isTextNode, $setSelection, type LexicalEditor } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { $insertClaimNode, $isClaimNode } from "@/components/lexical/embeds/ElicitEmbed/ClaimNode";
import { runEditorUpdate, setupEditorWithHtml } from "./lexicalTestHelpers";

interface TopLevelSummary {
  type: string
  text: string
}

function summarizeTopLevel(editor: LexicalEditor): TopLevelSummary[] {
  return editor.getEditorState().read(() =>
    $getRoot().getChildren().map((child) => ({
      type: child.getType(),
      text: child.getTextContent(),
    }))
  );
}

/** Select the [start, end) character range within the first paragraph's only text node. */
function $selectInFirstParagraph(start: number, end: number) {
  const paragraph = $getRoot().getFirstChildOrThrow();
  if (!$isElementNode(paragraph)) throw new Error("Expected an element");
  const text = paragraph.getFirstChildOrThrow();
  if (!$isTextNode(text)) throw new Error("Expected a text node");
  const selection = $createRangeSelection();
  selection.anchor.set(text.getKey(), start, "text");
  selection.focus.set(text.getKey(), end, "text");
  $setSelection(selection);
}

describe("$insertClaimNode", () => {
  it("replaces selected text with a top-level claim, splitting the paragraph", async () => {
    const editor = await setupEditorWithHtml("<p>Before AI will be transformative after</p>", "ClaimInsertTest");

    await runEditorUpdate(editor, () => {
      $selectInFirstParagraph("Before ".length, "Before AI will be transformative".length);
      $insertClaimNode("claim123");
    });

    expect(summarizeTopLevel(editor)).toEqual([
      { type: "paragraph", text: "Before " },
      { type: "claim", text: "" },
      { type: "paragraph", text: " after" },
    ]);
    editor.getEditorState().read(() => {
      const claim = $getRoot().getChildAtIndex(1);
      expect($isClaimNode(claim) && claim.getClaimId()).toBe("claim123");
    });
  });

  it("inserts at a collapsed cursor without removing any text", async () => {
    const editor = await setupEditorWithHtml("<p>Some text</p>", "ClaimInsertTest");

    await runEditorUpdate(editor, () => {
      $selectInFirstParagraph("Some text".length, "Some text".length);
      $insertClaimNode("claim456");
    });

    const summary = summarizeTopLevel(editor);
    expect(summary[0]).toEqual({ type: "paragraph", text: "Some text" });
    expect(summary[1]).toEqual({ type: "claim", text: "" });
  });

  it("falls back to appending to the document when there is no selection", async () => {
    const editor = await setupEditorWithHtml("<p>Only paragraph</p>", "ClaimInsertTest");

    await runEditorUpdate(editor, () => {
      $setSelection(null);
      $insertClaimNode("claim789");
    });

    const summary = summarizeTopLevel(editor);
    expect(summary[0]).toEqual({ type: "paragraph", text: "Only paragraph" });
    expect(summary.some((child) => child.type === "claim")).toBe(true);
  });

  it("exports to the same HTML the CkEditor claims plugin produced", async () => {
    const editor = await setupEditorWithHtml("<p>x</p>", "ClaimInsertTest");

    await runEditorUpdate(editor, () => {
      $selectInFirstParagraph(0, 1);
      $insertClaimNode("abc");
    });

    const html = editor.getEditorState().read(() => withDomGlobals(() => $generateHtmlFromNodes(editor, null)));
    expect(html).toContain('<div class="elicit-binary-prediction" data-elicit-id="abc">Prediction</div>');
  });
});
