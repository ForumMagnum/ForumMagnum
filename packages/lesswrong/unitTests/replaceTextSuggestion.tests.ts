import { $getRoot, type LexicalEditor } from "lexical";
import {
  $applyEditReplacement,
  $applyEditReplacementMultiNode,
  $applySuggestionWithNarrowing,
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
    replaced = $applySuggestionWithNarrowing({
      editor, anchor, focus, quote, replacement, suggestionId: randomId(),
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
    // Narrowing strips the common prefix ("This is ") and suffix
    // (" second paragraph."), leaving only the actual diff.
    expect(suggestions.length).toBe(2);
    expect(suggestions[0].type).toBe("delete");
    expect(suggestions[0].textContent).toBe("a");
    expect(suggestions[1].type).toBe("insert");
    // Bold formatting is rendered as Lexical nodes, not literal asterisks,
    // so textContent contains the plain text without markdown syntax.
    expect(suggestions[1].textContent).toBe("the improved");
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
    // Narrowing strips the common suffix (" paragraph."), leaving only the diff.
    expect(suggestions.length).toBe(2);
    expect(suggestions[0].type).toBe("delete");
    expect(suggestions[0].textContent).toBe("Second");
    expect(suggestions[1].type).toBe("insert");
    expect(suggestions[1].textContent).toBe("Replacement");
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
    // Narrowing strips the common suffix ("."), leaving only the diff.
    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("Second paragraph");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("Replacement line one.\n\nReplacement line two");
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
    // Narrowing strips the common suffix (" world."), leaving only the diff.
    expect(suggestions.length).toBe(2);
    expect(suggestions[0].type).toBe("delete");
    expect(suggestions[0].textContent).toBe("Hello");
    expect(suggestions[1].type).toBe("insert");
    expect(suggestions[1].textContent).toBe("Goodbye");
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
    // Narrowing at the markdown level strips the common prefix ("has ")
    // and suffix (" in"). The suffix stops at 3 markdown chars because
    // the quote's "**" markers break the match before "t", avoiding
    // mid-word splits.
    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("bold text");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("improved content");
  });
});

describe("replaceText narrowing across multi-node matches", () => {
  // These tests verify that when quote and replacement share a common
  // prefix/suffix, the suggestion nodes are narrowed to only the actual
  // diff rather than wrapping the entire quoted range.

  it("narrows to a pure insertion when only new text is added in the middle", async () => {
    const editor = await setupEditorWithContent(
      "This has **bold text** in the middle."
    );

    // The quote spans bold→plain nodes. The replacement adds "right "
    // before "in", so narrowing should produce an empty delete and a
    // small insert of just "right ".
    const replaced = await replaceTextAsSuggestion(
      editor,
      "**bold text** in",
      "**bold text** right in",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");

    // Without narrowing, the delete would contain "bold text in" and the
    // insert would contain "bold text right in". With narrowing, only the
    // actual insertion "right " should appear.
    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("right ");
  });

  it("narrows to a pure deletion when text is removed from the middle", async () => {
    const editor = await setupEditorWithContent(
      "This has **bold text** right in the middle."
    );

    // The quote spans bold→plain nodes. The replacement removes "right ",
    // so narrowing should produce a delete of just "right " and an empty insert.
    const replaced = await replaceTextAsSuggestion(
      editor,
      "**bold text** right in",
      "**bold text** in",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");

    // Without narrowing, the delete would contain "bold text right in" and
    // the insert "bold text in". With narrowing, only "right " is deleted.
    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("right ");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("");
  });

  it("narrows to a minimal replacement when text differs in the middle", async () => {
    const editor = await setupEditorWithContent(
      "This has **bold text** in the middle."
    );

    // The quote spans bold→plain nodes. The replacement changes "in" to
    // "near", so narrowing should produce a small delete/insert pair.
    const replaced = await replaceTextAsSuggestion(
      editor,
      "**bold text** in",
      "**bold text** near",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");

    // Without narrowing, the delete would contain "bold text in" and the
    // insert "bold text near". With narrowing, only the differing portion
    // is wrapped: delete "in", insert "near".
    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("in");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("near");
  });

  it("narrows to an insertion at a formatting boundary", async () => {
    const editor = await setupEditorWithContent(
      "This has **bold text**, and more."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "**bold text**, and",
      "**bold text** really, and",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");

    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe(" really");
  });
});

describe("replaceText narrowing preserves non-plain-text markdown changes", () => {
  it("does not narrow away a pure formatting change with the same visible text", async () => {
    const editor = await setupEditorWithContent(
      "This sentence has formatting."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "formatting",
      "**formatting**",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");

    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("formatting");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("formatting");
  });

  it("does not narrow away a link target change with the same visible text", async () => {
    const editor = await setupEditorWithContent(
      "Visit [LessWrong](https://old.example) for details."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "[LessWrong](https://old.example)",
      "[LessWrong](https://new.example)",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");

    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("LessWrong");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("LessWrong");
  });

  it("does not narrow away formatting changes on unchanged prefix text", async () => {
    const editor = await setupEditorWithContent(
      "Change alpha beta gamma."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "alpha beta",
      "**alpha** theta",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");

    // Markdown prefix is "" (a vs *), so the bold on "alpha" is preserved
    // in the suggestion. The suffix "eta" is narrowed (identical markdown
    // in both strings).
    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("alpha b");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("alpha th");
  });

  it("does not narrow away formatting changes on unchanged suffix text", async () => {
    const editor = await setupEditorWithContent(
      "Change alpha beta gamma."
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "beta gamma",
      "theta **gamma**",
    );

    expect(replaced).toBe(true);

    const suggestions = getAllSuggestions(editor);
    const deleteSuggestions = suggestions.filter(s => s.type === "delete");
    const insertSuggestions = suggestions.filter(s => s.type === "insert");

    expect(deleteSuggestions.length).toBe(1);
    expect(deleteSuggestions[0].textContent).toBe("beta gamma");
    expect(insertSuggestions.length).toBe(1);
    expect(insertSuggestions[0].textContent).toBe("theta gamma");
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
