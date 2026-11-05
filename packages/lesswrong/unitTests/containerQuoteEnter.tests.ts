import { JSDOM } from "jsdom";
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isElementNode, $isRangeSelection, $isTextNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $createContainerQuoteNode, $isContainerQuoteNode, type ContainerQuoteNode } from "@/components/editor/lexicalPlugins/quote/ContainerQuoteNode";
import { $handleEnterInQuote } from "@/components/editor/lexicalPlugins/quote/ContainerQuotePlugin";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { runEditorUpdate } from "./lexicalTestHelpers";

const EMPTY = "";
const shiftEnterEvent = new (new JSDOM("").window.KeyboardEvent)("keydown", { key: "Enter", shiftKey: true });

function $describeNode(node: LexicalNode): string {
  if ($isTextNode(node)) {
    return node.getTextContent();
  }
  if (!$isElementNode(node)) {
    return node.getType();
  }
  const children = node.getChildren().map($describeNode).join(",");
  return $isContainerQuoteNode(node) ? `quote[${children}]` : `p(${children})`;
}

function describeDocument(editor: LexicalEditor): string {
  return editor.getEditorState().read(() => $getRoot().getChildren().map($describeNode).join(" "));
}

function $createQuote(paragraphTexts: string[]): ContainerQuoteNode {
  const paragraphs = paragraphTexts.map((text) => {
    const paragraph = $createParagraphNode();
    return text === EMPTY ? paragraph : paragraph.append($createTextNode(text));
  });
  return $createContainerQuoteNode().append(...paragraphs);
}

interface EnterResult {
  editor: LexicalEditor
  handled: boolean
}

async function pressEnterInQuoteParagraph(paragraphTexts: string[], cursorIndex: number, event: KeyboardEvent | null = null): Promise<EnterResult> {
  const editor = createHeadlessEditor("ContainerQuoteEnterTest");
  let handled = false;
  await runEditorUpdate(editor, () => {
    const quote = $createQuote(paragraphTexts);
    $getRoot().clear().append(quote);
    quote.getChildAtIndex(cursorIndex)?.selectEnd();
    handled = $handleEnterInQuote(event);
  });
  return { editor, handled };
}

describe("$handleEnterInQuote", () => {
  it("splits the quote when the empty paragraph is between two siblings", async () => {
    const { editor, handled } = await pressEnterInQuoteParagraph(["a", "b", EMPTY, "c", "d"], 2);

    expect(handled).toBe(true);
    expect(describeDocument(editor)).toBe("quote[p(a),p(b)] p() quote[p(c),p(d)]");
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const paragraph = $getRoot().getChildAtIndex(1);
      expect($isRangeSelection(selection) && selection.anchor.key).toBe(paragraph?.getKey());
    });
  });

  it("moves an empty first paragraph out before the quote", async () => {
    const { editor, handled } = await pressEnterInQuoteParagraph([EMPTY, "a"], 0);

    expect(handled).toBe(true);
    expect(describeDocument(editor)).toBe("p() quote[p(a)]");
  });

  it("moves an empty last paragraph out after the quote", async () => {
    const { editor, handled } = await pressEnterInQuoteParagraph(["a", EMPTY], 1);

    expect(handled).toBe(true);
    expect(describeDocument(editor)).toBe("quote[p(a)] p()");
  });

  it("carries the quote's alignment over to the new quote when splitting", async () => {
    const editor = createHeadlessEditor("ContainerQuoteEnterTest");
    await runEditorUpdate(editor, () => {
      const quote = $createQuote(["a", EMPTY, "b"]).setFormat("center");
      $getRoot().clear().append(quote);
      quote.getChildAtIndex(1)?.selectEnd();
      $handleEnterInQuote(null);
    });

    const formats = editor.getEditorState().read(() =>
      $getRoot().getChildren().filter($isContainerQuoteNode).map((quote) => quote.getFormatType())
    );
    expect(formats).toEqual(["center", "center"]);
  });

  it.each([
    ["only child", [EMPTY], 0, null],
    ["non-empty paragraph", ["a", "b", "c"], 1, null],
    ["shift+enter", ["a", EMPTY, "b"], 1, shiftEnterEvent],
  ] as const)("leaves the document alone for %s", async (_label, paragraphTexts, cursorIndex, event) => {
    const { editor, handled } = await pressEnterInQuoteParagraph([...paragraphTexts], cursorIndex, event);
    const expected = `quote[${paragraphTexts.map((text) => `p(${text})`).join(",")}]`;

    expect(handled).toBe(false);
    expect(describeDocument(editor)).toBe(expected);
  });
});
