import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, $isTextNode, type LexicalEditor } from "lexical";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { PLAYGROUND_TRANSFORMERS } from "@/components/lexical/plugins/MarkdownTransformers";
import { registerMarkdownShortcuts } from "@/lib/vendor/lexical-markdown/MarkdownShortcuts";
import { runEditorUpdate, walkLexicalNodes } from "./lexicalTestHelpers";

async function setupEditorWithMarkdownShortcuts(): Promise<LexicalEditor> {
  const editor = createHeadlessEditor("LexicalMarkdownShortcutsTest");
  editor.setEditable(true);

  await runEditorUpdate(editor, () => {
    const root = $getRoot();
    root.clear();

    const paragraph = $createParagraphNode();
    const textNode = $createTextNode("");
    paragraph.append(textNode);
    root.append(paragraph);
    textNode.select(0, 0);
  });

  registerMarkdownShortcuts(editor, PLAYGROUND_TRANSFORMERS);

  return editor;
}

async function typeText(editor: LexicalEditor, text: string): Promise<void> {
  for (const char of text) {
    await runEditorUpdate(editor, () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        throw new Error("Expected range selection while typing markdown shortcut test text");
      }

      selection.insertText(char);
    });
  }
}

function getTextContent(editor: LexicalEditor): string {
  let textContent = "";

  editor.getEditorState().read(() => {
    textContent = $getRoot().getTextContent();
  });

  return textContent;
}

function getItalicTextRuns(editor: LexicalEditor): string[] {
  const italicRuns: string[] = [];

  editor.getEditorState().read(() => {
    walkLexicalNodes($getRoot(), (node) => {
      if ($isTextNode(node) && node.hasFormat("italic")) {
        italicRuns.push(node.getTextContent());
      }
    });
  });

  return italicRuns;
}

describe("Lexical markdown shortcuts", () => {
  it("does not treat a word-final asterisk as opening emphasis", async () => {
    const editor = await setupEditorWithMarkdownShortcuts();

    await typeText(editor, "If* then *");

    expect(getTextContent(editor)).toBe("If* then *");
    expect(getItalicTextRuns(editor)).toEqual([]);
  });

  it("still formats ordinary asterisk emphasis", async () => {
    const editor = await setupEditorWithMarkdownShortcuts();

    await typeText(editor, "This is *fine*");

    expect(getTextContent(editor)).toBe("This is fine");
    expect(getItalicTextRuns(editor)).toEqual(["fine"]);
  });
});
