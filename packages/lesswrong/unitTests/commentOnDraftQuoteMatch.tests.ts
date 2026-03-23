import {
  type LexicalEditor,
  type LexicalNode,
  $isElementNode,
  $getRoot,
} from "lexical";
import { $isMarkNode } from "@lexical/mark";
import { $attachMarkToQuote, type QuoteMarkResult } from "../../../app/api/agent/commentOnDraft/route";
import { runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";
import { randomId } from "@/lib/random";

async function attachCommentMark(
  editor: LexicalEditor,
  quote: string,
  markId: string,
): Promise<QuoteMarkResult> {
  let result: QuoteMarkResult = { quoteFoundInDocument: false, markCreated: false };
  await runEditorUpdate(editor, () => {
    result = $attachMarkToQuote(quote, markId);
  });
  return result;
}

/** Collect all MarkNode IDs from the editor state. */
function getAllMarkIds(editor: LexicalEditor): string[] {
  const markIds: string[] = [];
  editor.getEditorState().read(() => {
    function walk(node: LexicalNode) {
      if ($isMarkNode(node)) {
        markIds.push(...node.getIDs());
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) {
          walk(child);
        }
      }
    }
    walk($getRoot());
  });
  return markIds;
}

/** Get the text content wrapped by a specific mark ID. */
function getMarkedTextContent(editor: LexicalEditor, markId: string): string | null {
  let result: string | null = null;
  editor.getEditorState().read(() => {
    function walk(node: LexicalNode) {
      if ($isMarkNode(node) && node.getIDs().includes(markId)) {
        result = node.getTextContent();
        return;
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) {
          walk(child);
        }
      }
    }
    walk($getRoot());
  });
  return result;
}

describe("commentOnDraft quote matching", () => {
  it("attaches a mark when quote is within a single text node", async () => {
    const editor = await setupEditorWithContent(
      "Hello world. This is a test post."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "This is a test post.",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
    expect(getMarkedTextContent(editor, markId)).toBe("This is a test post.");
  });

  it("attaches a mark when quote spans a link boundary", async () => {
    // This simulates a common pattern in the Zvi post: plain text followed
    // by link text, e.g. "Charles's frame of 'Anthropic stopped pretending..."
    const editor = await setupEditorWithContent(
      "I approve of Charles's frame of '[Anthropic stopped pretending](https://example.com)' as accurate."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "frame of 'Anthropic stopped pretending' as accurate",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  it("attaches a mark when quote spans bold formatting", async () => {
    const editor = await setupEditorWithContent(
      "This has **bold text** in the middle of the sentence."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "has bold text in the middle",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  it("attaches a mark when quote includes markdown formatting markers", async () => {
    // Agents may include markdown syntax in their quotes, e.g. **bold**.
    // The function should strip those and match on the plain text.
    const editor = await setupEditorWithContent(
      "This has **bold text** in the middle of the sentence."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "has **bold text** in the middle",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  it("attaches a mark when quote spans inline code", async () => {
    const editor = await setupEditorWithContent(
      "Share the `?key=` parameter with your AI assistant."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "the ?key= parameter with",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });
});
