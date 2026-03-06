import { $getRoot, type LexicalEditor } from "lexical";
import { $applyEditReplacement, $applySuggestionReplacement } from "../../../app/api/agent/replaceText/route";
import { selectQuotedTextInEditor } from "../../../app/api/agent/editorAgentUtil";
import { getAllSuggestions, runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";
import { randomId } from "@/lib/random";

async function replaceTextAsSuggestion(
  editor: LexicalEditor,
  quote: string,
  replacement: string,
): Promise<boolean> {
  let replaced = false;
  await runEditorUpdate(editor, () => {
    const selectionResult = selectQuotedTextInEditor(quote);
    if (!selectionResult.selectionCreated) {
      return;
    }
    replaced = $applySuggestionReplacement({
      editor,
      matchedNodeKey: selectionResult.matchedNodeKey,
      startOffset: selectionResult.startOffset,
      endOffset: selectionResult.endOffset,
      replacement,
      suggestionId: randomId(),
    });
  });
  return replaced;
}

async function replaceTextInEditMode(
  editor: LexicalEditor,
  quote: string,
  replacement: string,
): Promise<boolean> {
  let replaced = false;
  await runEditorUpdate(editor, () => {
    const selectionResult = selectQuotedTextInEditor(quote);
    if (!selectionResult.selectionCreated) {
      return;
    }
    replaced = $applyEditReplacement({
      editor,
      matchedNodeKey: selectionResult.matchedNodeKey,
      startOffset: selectionResult.startOffset,
      endOffset: selectionResult.endOffset,
      replacement,
    });
  });
  return replaced;
}

function getPlainTextContent(editor: LexicalEditor): string {
  let text = "";
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent();
  });
  return text;
}

describe("replaceText suggest mode", () => {
  it("preserves markdown formatting in the replacement text", async () => {
    const editor = await setupEditorWithContent(
      "Hello Claude! This is a test post.\n\nThis is a second paragraph."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "This is a second paragraph.",
      "This is the **improved** second paragraph.",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    expect(suggestions.length).toBe(2);
    expect(suggestions[0].type).toBe("delete");
    expect(suggestions[0].textContent).toBe("This is a second paragraph.");
    expect(suggestions[1].type).toBe("insert");
    // Bold formatting is rendered as Lexical nodes, not literal asterisks,
    // so textContent contains the plain text without markdown syntax.
    expect(suggestions[1].textContent).toBe("This is the improved second paragraph.");
  });

  it("handles plain text replacement without markdown", async () => {
    const editor = await setupEditorWithContent(
      "First paragraph.\n\nSecond paragraph."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "Second paragraph.",
      "Replacement paragraph.",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    expect(suggestions.length).toBe(2);
    expect(suggestions[0].type).toBe("delete");
    expect(suggestions[0].textContent).toBe("Second paragraph.");
    expect(suggestions[1].type).toBe("insert");
    expect(suggestions[1].textContent).toBe("Replacement paragraph.");
  });

  it("handles multi-paragraph replacement in suggest mode", async () => {
    const editor = await setupEditorWithContent(
      "First paragraph.\n\nSecond paragraph.\n\nThird paragraph."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "Second paragraph.",
      "Replacement line one.\n\nReplacement line two.",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    // The delete suggestion should contain the original text
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");
    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("Second paragraph.");
    expect(insertSuggestions.length).toBe(1);
    // The insert suggestion should contain the full replacement text (both paragraphs)
    expect(insertSuggestions[0].textContent).toBe("Replacement line one.\n\nReplacement line two.");
  });
});

describe("replaceText edit mode", () => {
  it("parses markdown formatting in replacement text", async () => {
    const editor = await setupEditorWithContent(
      "Hello world. This is a test post."
    );

    const replaced = await replaceTextInEditMode(
      editor,
      "This is a test post.",
      "This is a **bold** test post.",
    );

    expect(replaced).toBe(true);

    // The replacement should be rendered as formatted Lexical nodes, not
    // literal markdown syntax. So the plain text should not contain asterisks.
    const text = getPlainTextContent(editor);
    expect(text).not.toContain("**");
    expect(text).toContain("bold");
  });
});

describe("getAllSuggestions finds suggestions inside nested structures", () => {
  it("finds suggestions inside list items", async () => {
    const editor = await setupEditorWithContent(
      "- First item\n- Second item\n- Third item"
    );

    // Replace text inside a list item with a suggestion
    const replaced = await replaceTextAsSuggestion(
      editor,
      "Second item",
      "Replaced item",
    );

    expect(replaced).toBe(true);

    // getAllSuggestions should find suggestions even when they're nested
    // inside list > listitem > text structure (3 levels deep)
    const suggestions = getAllSuggestions(editor);
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });
});
