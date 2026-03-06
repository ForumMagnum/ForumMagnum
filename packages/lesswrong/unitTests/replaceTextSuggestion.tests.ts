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
});
