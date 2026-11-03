import { JSDOM } from "jsdom";
import { $createParagraphNode, $createTextNode, $getRoot, $getSelection, $isRangeSelection, type LexicalNode } from "lexical";
import { $createLinkNode } from "@lexical/link";
import { $createMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import { $createSentinelParagraphNode, $isSentinelParagraphNode } from "@/components/editor/lexicalPlugins/blockCursorNavigation/SentinelParagraphNode";
import { $handleSentinelBackspace } from "@/components/editor/lexicalPlugins/blockCursorNavigation/BlockCursorNavigationPlugin";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import { runEditorUpdate } from "./lexicalTestHelpers";

const { KeyboardEvent } = new JSDOM().window;

interface BackspaceResult {
  handled: boolean
  defaultPrevented: boolean
  selectionInSentinel: boolean
}

/**
 * Builds [display equation, sentinel, paragraph(...leadingNodes, "text")],
 * puts a collapsed cursor at offset 0 of the trailing text node, and runs the
 * sentinel backspace handler.
 */
async function backspaceBeforeText(createLeadingNodes: () => LexicalNode[]): Promise<BackspaceResult> {
  const editor = createHeadlessEditor("sentinelBackspace");
  const event = new KeyboardEvent("keydown", { key: "Backspace", cancelable: true });
  let handled = false;
  let selectionInSentinel = false;
  await runEditorUpdate(editor, () => {
    const textNode = $createTextNode("text");
    const paragraph = $createParagraphNode().append(...createLeadingNodes(), textNode);
    $getRoot().append($createMathNode("E = mc^2", false), $createSentinelParagraphNode(), paragraph);
    textNode.select(0, 0);

    handled = $handleSentinelBackspace(event);

    const selection = $getSelection();
    selectionInSentinel = $isRangeSelection(selection) && $isSentinelParagraphNode(selection.anchor.getNode());
  });
  return { handled, defaultPrevented: event.defaultPrevented, selectionInSentinel };
}

describe("$handleSentinelBackspace", () => {
  it("moves the cursor into the sentinel when backspacing at the start of a paragraph", async () => {
    const result = await backspaceBeforeText(() => []);
    expect(result).toEqual({ handled: true, defaultPrevented: true, selectionInSentinel: true });
  });

  it("leaves backspace to the default handler when the cursor is right after a leading inline equation", async () => {
    const result = await backspaceBeforeText(() => [$createMathNode("x", true)]);
    expect(result).toEqual({ handled: false, defaultPrevented: false, selectionInSentinel: false });
  });

  it("leaves backspace to the default handler when the cursor is right after a leading link", async () => {
    const result = await backspaceBeforeText(() => [$createLinkNode("https://example.com").append($createTextNode("link"))]);
    expect(result).toEqual({ handled: false, defaultPrevented: false, selectionInSentinel: false });
  });
});
