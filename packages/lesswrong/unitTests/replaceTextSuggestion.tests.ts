import { $getRoot, type LexicalEditor } from "lexical";
import {
  $applyEditReplacement,
  $applyEditReplacementMultiNode,
  $applySuggestionReplacement,
  $applySuggestionReplacementMultiNode,
} from "../../../app/api/agent/replaceText/route";
import { locateMarkdownQuoteSelectionInSubtree } from "../../../app/api/agent/mapMarkdownToLexical";
import { getAllSuggestions, runEditorUpdate, setupEditorWithContent } from "./lexicalTestHelpers";
import { randomId } from "@/lib/random";

async function replaceTextAsSuggestion(
  editor: LexicalEditor,
  quote: string,
  replacement: string,
): Promise<boolean> {
  let replaced = false;
  await runEditorUpdate(editor, () => {
    const root = $getRoot();
    const result = locateMarkdownQuoteSelectionInSubtree({
      rootNodeKey: root.getKey(),
      markdownQuote: quote,
    });
    if (!result.found || !result.anchor || !result.focus) return;

    const { anchor, focus } = result;
    const sameTextNode = anchor.key === focus.key && anchor.type === "text" && focus.type === "text";

    if (sameTextNode) {
      replaced = $applySuggestionReplacement({
        editor,
        matchedNodeKey: anchor.key,
        startOffset: anchor.offset,
        endOffset: focus.offset,
        replacement,
        suggestionId: randomId(),
      });
    } else {
      replaced = $applySuggestionReplacementMultiNode({
        editor, anchor, focus, replacement, suggestionId: randomId(),
      });
    }
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
    const root = $getRoot();
    const result = locateMarkdownQuoteSelectionInSubtree({
      rootNodeKey: root.getKey(),
      markdownQuote: quote,
    });
    if (!result.found || !result.anchor || !result.focus) return;

    const { anchor, focus } = result;
    const sameTextNode = anchor.key === focus.key && anchor.type === "text" && focus.type === "text";

    if (sameTextNode) {
      replaced = $applyEditReplacement({
        editor,
        matchedNodeKey: anchor.key,
        startOffset: anchor.offset,
        endOffset: focus.offset,
        replacement,
      });
    } else {
      replaced = $applyEditReplacementMultiNode({
        editor, anchor, focus, replacement,
      });
    }
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

describe("replaceText edit mode when quote starts at beginning of text node", () => {
  it("replaces text correctly when quote matches from the start of a paragraph", async () => {
    const editor = await setupEditorWithContent(
      "Hello world. This is a test post."
    );

    // Quote starts at position 0 of the text node but does not cover the entire node
    const replaced = await replaceTextInEditMode(
      editor,
      "Hello world.",
      "Goodbye world.",
    );

    expect(replaced).toBe(true);

    const text = getPlainTextContent(editor);
    expect(text).toContain("Goodbye world.");
    expect(text).toContain("This is a test post.");
    // The original "Hello world." should no longer be present
    expect(text).not.toContain("Hello world.");
  });

  it("replaces text correctly in suggest mode when quote starts at beginning of text node", async () => {
    const editor = await setupEditorWithContent(
      "Hello world. This is a test post."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "Hello world.",
      "Goodbye world.",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    expect(suggestions.length).toBe(2);
    expect(suggestions[0].type).toBe("delete");
    expect(suggestions[0].textContent).toBe("Hello world.");
    expect(suggestions[1].type).toBe("insert");
    expect(suggestions[1].textContent).toBe("Goodbye world.");
  });
});

describe("replaceText when quote spans formatting boundaries", () => {
  it("replaces text spanning plain text and inline code in edit mode", async () => {
    const editor = await setupEditorWithContent(
      "Share the `?key=` parameter with your AI assistant."
    );

    const replaced = await replaceTextInEditMode(
      editor,
      "the `?key=` parameter",
      "the link",
    );

    expect(replaced).toBe(true);

    const text = getPlainTextContent(editor);
    expect(text).toContain("the link");
    expect(text).not.toContain("?key=");
  });

  it("replaces text spanning plain text and bold in suggest mode", async () => {
    const editor = await setupEditorWithContent(
      "This has **bold text** in the middle."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "has **bold text** in",
      "has improved content in",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");
    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("has bold text in");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("has improved content in");
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
