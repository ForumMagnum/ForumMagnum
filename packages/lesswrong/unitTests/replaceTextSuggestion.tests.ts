import type { LexicalEditor } from "lexical";
import { $applySuggestionReplacement } from "../../../app/api/agent/replaceText/route";
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
    const deleteSuggestion = suggestions.find(s => s.type === "delete");
    const insertSuggestion = suggestions.find(s => s.type === "insert");

    expect(deleteSuggestion).toBeDefined();
    expect(deleteSuggestion!.textContent).toBe("This is a second paragraph.");

    expect(insertSuggestion).toBeDefined();
    // The replacement should contain "improved" as text content (formatting
    // nodes like bold don't appear in textContent, but the text should not
    // contain literal asterisks)
    expect(insertSuggestion!.textContent).toBe("This is the improved second paragraph.");
    expect(insertSuggestion!.textContent).not.toContain("**");
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
    const insertSuggestion = suggestions.find(s => s.type === "insert");
    expect(insertSuggestion).toBeDefined();
    expect(insertSuggestion!.textContent).toBe("Replacement paragraph.");
  });
});
