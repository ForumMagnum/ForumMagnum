import { registerMarkdownShortcuts } from "@lexical/markdown";
import { $createLineBreakNode, $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isElementNode, $isLineBreakNode, $isRangeSelection, $isTextNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $isContainerQuoteNode } from "@/components/editor/lexicalPlugins/quote/ContainerQuoteNode";
import { PLAYGROUND_TRANSFORMERS } from "@/components/lexical/plugins/MarkdownTransformers";
import { registerLineBreakElementShortcuts } from "@/components/lexical/plugins/MarkdownShortcutPlugin/lineBreakElementShortcuts";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { runEditorUpdate } from "./lexicalTestHelpers";

function $describeNode(node: LexicalNode): string {
  if ($isTextNode(node)) {
    return node.getTextContent();
  }
  if ($isLineBreakNode(node)) {
    return "br";
  }
  if (!$isElementNode(node)) {
    return node.getType();
  }
  const children = node.getChildren().map($describeNode).join(",");
  if ($isContainerQuoteNode(node)) {
    return `quote[${children}]`;
  }
  return `${node.getType()}(${children})`;
}

function describeDocument(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => $getRoot().getChildren().map($describeNode).join(" "));
}

async function typeAfterLineBreak(textBeforeBreak: string, textAfterBreak: string, typed: string, textAfterCursor = ""): Promise<LexicalEditor> {
  const editor = createHeadlessEditor("LineBreakMarkdownShortcutsTest");
  editor.setEditable(true);
  registerMarkdownShortcuts(editor, PLAYGROUND_TRANSFORMERS);
  registerLineBreakElementShortcuts(editor, PLAYGROUND_TRANSFORMERS);

  await runEditorUpdate(editor, () => {
    const lineText = $createTextNode(textAfterBreak + textAfterCursor);
    const paragraph = $createParagraphNode().append($createTextNode(textBeforeBreak), $createLineBreakNode(), lineText);
    $getRoot().clear().append(paragraph);
    lineText.select(textAfterBreak.length, textAfterBreak.length);
  });
  await runEditorUpdate(editor, () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      throw new Error("Expected a range selection");
    }
    selection.insertText(typed);
  });
  await runEditorUpdate(editor, () => {});
  return editor;
}

describe("markdown block shortcuts after a soft line break", () => {
  it("turns the line after Shift+Enter into a quote when typing '> '", async () => {
    const editor = await typeAfterLineBreak("first line", ">", " ");

    expect(describeDocument(editor)).toBe("paragraph(first line) quote[paragraph()]");
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const quote = $getRoot().getLastChildOrThrow<LexicalNode>();
      expect($isContainerQuoteNode(quote)).toBe(true);
      expect($isRangeSelection(selection) && selection.anchor.getNode().getParent()?.is(quote)).toBe(true);
    });
  });

  it("keeps text after the cursor in the new block", async () => {
    const editor = await typeAfterLineBreak("first line", ">", " ", "quoted");

    expect(describeDocument(editor)).toBe("paragraph(first line) quote[paragraph(quoted)]");
  });

  it("applies heading shortcuts after a line break", async () => {
    const editor = await typeAfterLineBreak("first line", "#", " ");

    expect(describeDocument(editor)).toBe("paragraph(first line) heading()");
  });

  it("does nothing when the shortcut is not at the start of the line", async () => {
    const editor = await typeAfterLineBreak("first line", "a >", " ");

    expect(describeDocument(editor)).toBe("paragraph(first line,br,a > )");
  });
});
