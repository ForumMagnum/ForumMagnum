import { $getRoot, $isElementNode, $isTextNode, type LexicalEditor, type LexicalNode, type TextNode } from "lexical";
import { applyBlockTypeChange } from "@/components/lexical/plugins/ToolbarPlugin/utils";
import { runEditorUpdate, setupEditorWithHtml, walkLexicalNodes } from "./lexicalTestHelpers";

const nestedQuoteHtml =
  `<p>before</p>` +
  `<blockquote><p>outer</p><blockquote><p>inner</p></blockquote><p>outer tail</p></blockquote>` +
  `<p>after</p>`;

function $findTextNode(text: string): TextNode {
  const matches: TextNode[] = [];
  walkLexicalNodes($getRoot(), (node) => {
    if ($isTextNode(node) && node.getTextContent() === text) {
      matches.push(node);
    }
  });
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one text node "${text}", found ${matches.length}`);
  }
  return matches[0];
}

function describeTree(node: LexicalNode): string {
  if ($isElementNode(node)) {
    return `${node.getType()}(${node.getChildren().map(describeTree).join(",")})`;
  }
  return JSON.stringify(node.getTextContent());
}

async function toggleQuoteOverSelection(editor: LexicalEditor, anchorText: string, focusText: string): Promise<string> {
  await runEditorUpdate(editor, () => {
    const anchorNode = $findTextNode(anchorText);
    const focusNode = $findTextNode(focusText);
    const selection = anchorNode.select(0, 0);
    selection.focus.set(focusNode.getKey(), focusNode.getTextContentSize(), "text");
    applyBlockTypeChange(editor, "quote");
  });
  return editor.getEditorState().read(() => describeTree($getRoot()));
}

describe("toggling a block quote over a selection spanning nested quotes", () => {
  it("wraps the outer quote when selecting backwards from after it into the nested quote", async () => {
    const editor = await setupEditorWithHtml(nestedQuoteHtml);

    const tree = await toggleQuoteOverSelection(editor, "after", "inner");

    expect(tree).toBe(
      `root(paragraph("before"),quote(quote(paragraph("outer"),quote(paragraph("inner")),paragraph("outer tail")),paragraph("after")))`
    );
  });

  it("wraps the outer quote intact when selecting from before it into the nested quote", async () => {
    const editor = await setupEditorWithHtml(nestedQuoteHtml);

    const tree = await toggleQuoteOverSelection(editor, "before", "inner");

    expect(tree).toBe(
      `root(quote(paragraph("before"),quote(paragraph("outer"),quote(paragraph("inner")),paragraph("outer tail"))),paragraph("after"))`
    );
  });
});
