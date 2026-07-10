import { $createRangeSelection, $getRoot, $isElementNode, type LexicalEditor, type LexicalNode } from "lexical";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $wrapSelectionInMarkNode } from "@lexical/mark";
import { $applySuggestionWithNarrowing } from "../../../app/api/agent/replaceText/route";
import { $wrapBlockAsDeletionSuggestion } from "../../../app/api/agent/deleteBlock/route";
import { $createMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import { $locateBlockByPrefix, $locateQuoteWithTextIndex } from "../../../app/api/agent/textIndexQuoteLocator";
import { $applyEditModeReplacement } from "../../../app/api/agent/applyEditAtSelection";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { findMathEquations, firstDisplayMathParentType, getAllSuggestions, runEditorUpdate, setupEditorWithContent, setupEditorWithMathParagraphs } from "./lexicalTestHelpers";
import { randomId } from "@/lib/random";

async function replaceTextAsSuggestion(
  editor: LexicalEditor,
  quote: string,
  replacement: string,
): Promise<boolean> {
  let replaced = false;
  await runEditorUpdate(editor, () => {
    const result = $locateQuoteWithTextIndex(quote);
    if (!result.found || !result.anchor || !result.focus) return;

    const { anchor, focus } = result;
    const narrowingResult = $applySuggestionWithNarrowing({
      editor, anchor, focus, quote, replacement, range: result.range, suggestionId: randomId(),
      markdownIt: getMarkdownItForAgentPosts(),
    });
    replaced = narrowingResult.replaced;
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
    const result = $locateQuoteWithTextIndex(quote);
    if (!result.found || !result.anchor || !result.focus) return;

    replaced = $applyEditModeReplacement({
      editor, anchor: result.anchor, focus: result.focus, quote, replacement,
      range: result.range,
      markdownIt: getMarkdownItForAgentPosts(),
    }).replaced;
  });
  return replaced;
}

/**
 * Wrap the text matched by `quote` in a MarkNode, the way a comment thread
 * anchors to a text range in the live editor.
 */
async function wrapQuoteInMark(editor: LexicalEditor, quote: string): Promise<void> {
  await runEditorUpdate(editor, () => {
    const target = $locateQuoteWithTextIndex(quote);
    if (!target.found || !target.anchor || !target.focus) {
      throw new Error(`wrapQuoteInMark: quote not found: ${quote}`);
    }
    const selection = $createRangeSelection();
    selection.anchor.set(target.anchor.key, target.anchor.offset, target.anchor.type);
    selection.focus.set(target.focus.key, target.focus.offset, target.focus.type);
    $wrapSelectionInMarkNode(selection, false, randomId());
  });
}

function getPlainTextContent(editor: LexicalEditor): string {
  let text = "";
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent();
  });
  return text;
}

describe("replaceText across block boundaries", () => {
  it("edits a quote spanning two paragraphs in edit mode", async () => {
    const editor = await setupEditorWithContent(
      "First paragraph ends here.\n\nSecond paragraph starts now, and continues.",
    );

    const replaced = await replaceTextInEditMode(
      editor,
      "ends here.\n\nSecond paragraph starts now,",
      "ends differently. The replacement starts now,",
    );

    expect(replaced).toBe(true);
    const text = getPlainTextContent(editor);
    expect(text).toContain("ends differently. The replacement starts now,");
    expect(text).not.toContain("Second paragraph");
  });

  it("deletes a quote spanning two paragraphs in edit mode (empty replacement)", async () => {
    const editor = await setupEditorWithContent(
      "Alpha tail to remove.\n\nBeta head to remove, beta tail stays.",
    );

    const replaced = await replaceTextInEditMode(
      editor,
      "tail to remove.\n\nBeta head to remove,",
      "",
    );

    expect(replaced).toBe(true);
    const text = getPlainTextContent(editor);
    expect(text).toContain("beta tail stays");
    expect(text).not.toContain("Beta head");
  });

  it("creates per-block delete suggestions for a cross-paragraph quote in suggest mode", async () => {
    const editor = await setupEditorWithContent(
      "First paragraph ends here.\n\nSecond paragraph starts now, and continues.",
    );

    const replaced = await replaceTextAsSuggestion(
      editor,
      "ends here.\n\nSecond paragraph starts now,",
      "ends differently. A new start,",
    );

    expect(replaced).toBe(true);
    const suggestions = getAllSuggestions(editor);
    const deletes = suggestions.filter((s) => s.type === "delete");
    const inserts = suggestions.filter((s) => s.type === "insert");
    // One delete run per covered block, one insert with the replacement.
    expect(deletes.length).toBe(2);
    expect(deletes.map((s) => s.textContent).join(" | ")).toBe(
      "ends here. | Second paragraph starts now,",
    );
    expect(inserts.length).toBe(1);
    expect(inserts[0].textContent).toBe("ends differently. A new start,");
  });
});

describe("replaceText within nested block structures", () => {
  it("edits a quote spanning two list items of one list", async () => {
    const editor = await setupEditorWithContent(
      "*   alpha item ending\n*   bravo item starting here",
    );
    const replaced = await replaceTextInEditMode(
      editor,
      "item ending\n\nbravo item",
      "item finishing, bravo entry",
    );
    expect(replaced).toBe(true);
    expect(getPlainTextContent(editor)).toContain("item finishing, bravo entry starting here");
  });

  it("edits a quote spanning two paragraphs inside a blockquote", async () => {
    const editor = await setupEditorWithContent(
      "> First quoted paragraph ends.\n>\n> Second quoted paragraph starts.",
    );
    const replaced = await replaceTextInEditMode(
      editor,
      "paragraph ends.\n\nSecond quoted",
      "paragraph closes. Next quoted",
    );
    expect(replaced).toBe(true);
    expect(getPlainTextContent(editor)).toContain("paragraph closes. Next quoted paragraph starts.");
  });

  it("suggests across a paragraph and a list without wrapping block nodes", async () => {
    const editor = await setupEditorWithContent(
      "Intro paragraph tail.\n\n*   alpha item\n*   bravo item",
    );
    const replaced = await replaceTextAsSuggestion(
      editor,
      "paragraph tail.\n\nalpha item",
      "replacement text",
    );
    expect(replaced).toBe(true);
    // Suggestion wrappers are inline nodes; they must never become direct
    // children of a ListNode (which requires ListItemNode children).
    editor.getEditorState().read(() => {
      const walk = (node: LexicalNode): void => {
        if ($isListNode(node)) {
          for (const child of node.getChildren()) {
            expect($isListItemNode(child)).toBe(true);
          }
        }
        if ($isElementNode(node)) {
          for (const child of node.getChildren()) walk(child);
        }
      };
      walk($getRoot());
    });
  });

  it("covers the full anchor block when the quote starts inside a link", async () => {
    const editor = await setupEditorWithContent(
      "Read [a great post](https://example.com) about X.\n\nIt explains things.",
    );
    const replaced = await replaceTextAsSuggestion(
      editor,
      "great post about X.\n\nIt explains",
      "replacement",
    );
    expect(replaced).toBe(true);
    const deletes = getAllSuggestions(editor).filter((s) => s.type === "delete");
    const deletedText = deletes.map((s) => s.textContent).join(" ");
    // The tail of the first paragraph after the link must be covered too.
    expect(deletedText).toContain("about X.");
    expect(deletedText).toContain("It explains");
  });
});

describe("deleteBlock suggest-mode wrapping", () => {
  async function wrapBlockByPrefix(editor: LexicalEditor, prefix: string): Promise<boolean> {
    let wrapped = false;
    await runEditorUpdate(editor, () => {
      const block = $locateBlockByPrefix(prefix).node;
      if (!block) throw new Error(`No block matched prefix: ${prefix}`);
      wrapped = $wrapBlockAsDeletionSuggestion(block, randomId());
    });
    return wrapped;
  }

  it("wraps a paragraph block and creates delete suggestions", async () => {
    const editor = await setupEditorWithContent("First paragraph.\n\nSecond paragraph.");
    expect(await wrapBlockByPrefix(editor, "Second paragraph")).toBe(true);
    expect(getAllSuggestions(editor).filter((s) => s.type === "delete").length).toBeGreaterThan(0);
  });

  it("wraps a table block via per-cell suggestion nodes", async () => {
    const editor = await setupEditorWithContent(
      "| h1 | h2 |\n| --- | --- |\n| a | b |",
    );
    expect(await wrapBlockByPrefix(editor, "h1")).toBe(true);
  });

  it("reports failure for a top-level display equation it cannot wrap", async () => {
    // $wrapSelectionInSuggestionNode has no case for block-level decorators
    // and silently creates nothing; the route must not report success.
    const editor = await setupEditorWithContent("Intro paragraph.");
    await runEditorUpdate(editor, () => {
      $getRoot().append($createMathNode("E=mc^2", false));
    });
    expect(await wrapBlockByPrefix(editor, "$$\nE=mc^2\n$$")).toBe(false);
    expect(getAllSuggestions(editor).length).toBe(0);
  });
});

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

describe("replaceText narrowing across comment-anchor marks", () => {
  // Comment threads anchor to text by wrapping it in a MarkNode (an inline
  // element), so a draft with comments has its paragraphs split into nested
  // inline structure. Narrowing resolves positions through the document
  // projection, which is flat over inline nesting, so marks anywhere in or
  // around the match must not prevent a minimal diff.

  it("narrows when the match starts inside a comment-anchor mark", async () => {
    const editor = await setupEditorWithContent("Alpha beta gamma delta epsilon.");
    await wrapQuoteInMark(editor, "Alpha");

    const replaced = await replaceTextAsSuggestion(
      editor,
      "Alpha beta gamma delta",
      "Alpha beta led delta",
    );

    expect(replaced).toBe(true);
    const suggestions = getAllSuggestions(editor);
    expect(suggestions).toEqual([
      { type: "delete", textContent: "gamma" },
      { type: "insert", textContent: "led" },
    ]);
  });

  it("narrows when the narrowed range falls inside a comment-anchor mark", async () => {
    const editor = await setupEditorWithContent("Alpha beta gamma delta epsilon.");
    await wrapQuoteInMark(editor, "delta epsilon");

    const replaced = await replaceTextAsSuggestion(
      editor,
      "gamma delta epsilon",
      "gamma fish epsilon",
    );

    expect(replaced).toBe(true);
    const suggestions = getAllSuggestions(editor);
    expect(suggestions).toEqual([
      { type: "delete", textContent: "delta" },
      { type: "insert", textContent: "fish" },
    ]);
  });

  it("narrows when a comment-anchor mark sits in the middle of the match", async () => {
    const editor = await setupEditorWithContent("Alpha beta gamma delta epsilon.");
    await wrapQuoteInMark(editor, "gamma");

    const replaced = await replaceTextAsSuggestion(
      editor,
      "beta gamma delta",
      "beta gamma fish",
    );

    expect(replaced).toBe(true);
    const suggestions = getAllSuggestions(editor);
    expect(suggestions).toEqual([
      { type: "delete", textContent: "delta" },
      { type: "insert", textContent: "fish" },
    ]);
  });

  it("falls back to the full range when quote and document lengths diverge", async () => {
    // The document has a one-character ellipsis where the quote (matched via
    // NFKC normalization) has a three-character "...": positions no longer
    // correspond 1:1, so narrowing must conservatively use the full range.
    const editor = await setupEditorWithContent("Alpha beta… gamma delta.");

    const replaced = await replaceTextAsSuggestion(
      editor,
      "beta... gamma",
      "beta... led",
    );

    expect(replaced).toBe(true);
    const suggestions = getAllSuggestions(editor);
    expect(suggestions).toEqual([
      { type: "delete", textContent: "beta… gamma" },
      { type: "insert", textContent: "beta... led" },
    ]);
  });
});

/**
 * Serialize the live editor state back to markdown via the same
 * Lexical → HTML → Turndown pipeline the agent read API uses, so these
 * assertions check what an agent would see if it re-fetched the document.
 */
function getMarkdownContent(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
  });
  return htmlToMarkdown(html).trim();
}

describe("replaceText edit mode with LaTeX", () => {
  it("edits prose after an equation without corrupting the offset", async () => {
    // Doc: "the value $x^2$ is large", with $x^2$ a real MathNode. The agent
    // rewords trailing prose; the equation is unchanged and only along for the
    // ride inside the quoted context.
    const editor = await setupEditorWithMathParagraphs([
      { text: "the value " },
      { equation: "x^2" },
      { text: " is large" },
    ]);

    const replaced = await replaceTextInEditMode(
      editor,
      "the value $x^2$ is large",
      "the value $x^2$ is small",
    );
    expect(replaced).toBe(true);

    // `markdownQuoteToPlainText` projects the MathNode to zero width, matching
    // `$advancePoint`'s view of it, so the narrowed edit lands on "large".
    expect(getMarkdownContent(editor)).toBe("the value $x^2$ is small");
  });

  it("edits an equation that has text on both sides of it", async () => {
    // Doc: "the result is $x^2$ here". The quoted range has text before and
    // after the equation, so matching produces a selection spanning the
    // MathNode and the edit can replace it.
    const editor = await setupEditorWithMathParagraphs([
      { text: "the result is " },
      { equation: "x^2" },
      { text: " here" },
    ]);

    const replaced = await replaceTextInEditMode(
      editor,
      "the result is $x^2$ here",
      "the result is $x^3$ here",
    );
    expect(replaced).toBe(true);

    // Narrowing snaps its boundaries out of the `$…$` token, so the whole
    // equation is replaced by a new MathNode rather than split into a
    // fragment, and the math-tex agent pipeline turns `$x^3$` into a MathNode.
    expect(getMarkdownContent(editor)).toBe("the result is $x^3$ here");
  });

  it("edits an equation at the end of the quote", async () => {
    // Doc: "value is $x^2$" — the quote ends on the MathNode, with no text
    // after it. The focus is represented as an element-type selection point
    // so the equation is inside the range and gets replaced.
    const editor = await setupEditorWithMathParagraphs([
      { text: "value is " },
      { equation: "x^2" },
    ]);

    const replaced = await replaceTextInEditMode(
      editor,
      "value is $x^2$",
      "value is $x^3$",
    );
    expect(replaced).toBe(true);
    expect(getMarkdownContent(editor)).toBe("value is $x^3$");
  });

  it("edits an equation at the start of the quote", async () => {
    // Doc: "$x^2$ is the answer" — the quote starts on the MathNode, with no
    // text before it; the anchor is an element-type selection point.
    const editor = await setupEditorWithMathParagraphs([
      { equation: "x^2" },
      { text: " is the answer" },
    ]);

    const replaced = await replaceTextInEditMode(
      editor,
      "$x^2$ is the answer",
      "$x^3$ is the answer",
    );
    expect(replaced).toBe(true);
    expect(getMarkdownContent(editor)).toBe("$x^3$ is the answer");
  });

  it("edits a quote that is exactly an equation", async () => {
    // Doc: "before $x^2$ after" — the quote is the equation alone, matched as
    // an element range around the MathNode.
    const editor = await setupEditorWithMathParagraphs([
      { text: "before " },
      { equation: "x^2" },
      { text: " after" },
    ]);

    const replaced = await replaceTextInEditMode(editor, "$x^2$", "$y^2$");
    expect(replaced).toBe(true);
    expect(getMarkdownContent(editor)).toBe("before $y^2$ after");
  });
});

describe("replaceText with LaTeX — correctness regressions", () => {
  it("edits a quote spanning prose and a display equation", async () => {
    // A display equation reads from the agent API as `$$\n...\n$$`, but
    // `appendSegments` serializes every MathNode as inline `$...$`, so the
    // quote can't be located.
    const editor = await setupEditorWithMathParagraphs([
      { text: "The displayed equation " },
      { equation: "x^2", display: true },
      { text: " is important." },
    ]);

    const replaced = await replaceTextInEditMode(
      editor,
      "The displayed equation $$\nx^2\n$$ is important.",
      "The displayed equation $$\ny^2\n$$ is important.",
    );
    expect(replaced).toBe(true);
    const markdown = getMarkdownContent(editor);
    expect(markdown).toContain("y^2");
    expect(markdown).not.toContain("x^2");
  });

  it("matches equations case-sensitively", async () => {
    // `$X$` and `$x$` are different equations; a `$x$` quote must replace the
    // lowercase equation, not the uppercase one.
    const editor = await setupEditorWithMathParagraphs([
      { text: "First " },
      { equation: "X" },
      { text: " then " },
      { equation: "x" },
    ]);

    const replaced = await replaceTextInEditMode(editor, "$x$", "$y$");
    expect(replaced).toBe(true);
    expect(getMarkdownContent(editor)).toBe("First $X$ then $y$");
  });

  it("matches a display equation quoted in compact $$…$$ form", async () => {
    // The read API emits a display equation as `$$\n…\n$$`, but agents may
    // quote the compact `$$x^2$$` form — which the write path also accepts.
    const editor = await setupEditorWithMathParagraphs([
      { text: "Eq " },
      { equation: "x^2", display: true },
      { text: " done" },
    ]);

    const replaced = await replaceTextInEditMode(editor, "Eq $$x^2$$ done", "Eq $$y^2$$ done");
    expect(replaced).toBe(true);
    const markdown = getMarkdownContent(editor);
    expect(markdown).toContain("y^2");
    expect(markdown).not.toContain("x^2");
  });

  it("matches a display equation quoted with \\[…\\] delimiters", async () => {
    const editor = await setupEditorWithMathParagraphs([
      { text: "Eq " },
      { equation: "x^2", display: true },
      { text: " done" },
    ]);

    const replaced = await replaceTextInEditMode(editor, "Eq \\[x^2\\] done", "Eq \\[y^2\\] done");
    expect(replaced).toBe(true);
    const markdown = getMarkdownContent(editor);
    expect(markdown).toContain("y^2");
    expect(markdown).not.toContain("x^2");
  });
});

describe("replaceText with LaTeX — equation matching edge cases", () => {
  it("round-trips an inline equation immediately followed by a digit", async () => {
    // texMath's currency-disambiguation rule rejects `$x$5`, so the bare
    // `$...$` form cannot encode "equation x, then a literal 5". The read side
    // must emit the digit-safe `\(...\)` form instead, and editing via that
    // form must keep the equation a real MathNode rather than collapsing it to
    // literal text.
    const editor = await setupEditorWithMathParagraphs([
      { equation: "x" },
      { text: "5 apples" },
    ]);

    expect(getMarkdownContent(editor)).toBe("\\(x\\)5 apples");

    const replaced = await replaceTextInEditMode(editor, "\\(x\\)5 apples", "\\(y\\)5 apples");
    expect(replaced).toBe(true);
    // getMarkdownContent can't distinguish a real MathNode from literal
    // `\(y\)5 apples` text, so assert on the node tree directly.
    expect(findMathEquations(editor)).toEqual(["y"]);
  });

  it("matches a contextual quote whose equation contains markdown emphasis punctuation", async () => {
    // Reviewer-flagged: `markdownQuoteToRenderedPlainText` renders the quote
    // through markdown-it, which interprets `*b*` inside the equation as
    // emphasis, so the projection becomes `$ab$` and no longer matches the
    // `$a*b*$` MathNode segment. The equation is mid-paragraph (not the whole
    // paragraph), so the whole-paragraph fallback does not rescue it.
    const editor = await setupEditorWithMathParagraphs([
      { text: "Prefix Eq " },
      { equation: "a*b*" },
      { text: " done suffix" },
    ]);

    const replaced = await replaceTextInEditMode(editor, "Eq $a*b*$ done", "Eq $a*c*$ done");
    expect(replaced).toBe(true);
    expect(getMarkdownContent(editor)).toBe("Prefix Eq $a*c*$ done suffix");
  });

  it("matches a contextual quote whose equation contains a tilde", async () => {
    // Same root cause as the emphasis case, but `~b~` is consumed by the
    // markdown-it-sub plugin (a separate code path from core emphasis), so a
    // fix must cover both.
    const editor = await setupEditorWithMathParagraphs([
      { text: "Intro text. The relation " },
      { equation: "a~b~c" },
      { text: " holds. Outro text." },
    ]);

    const replaced = await replaceTextInEditMode(
      editor,
      "The relation $a~b~c$ holds",
      "The relation $a~b~d$ holds",
    );
    expect(replaced).toBe(true);
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

describe("LaTeX correctness regressions", () => {
  it("does not leave a replacement's display equation nested inside a paragraph", async () => {
    // The replaceText apply path renders the replacement to inline nodes and
    // splices them in; a `$$...$$` replacement yields a block-level display
    // MathNode that must not stay inside the surrounding ParagraphNode.
    const editor = await setupEditorWithMathParagraphs([{ text: "the answer is here" }]);
    const replaced = await replaceTextInEditMode(editor, "answer", "$$x^2$$");
    expect(replaced).toBe(true);

    expect(firstDisplayMathParentType(editor)).toBe("root");
  });

  it("narrows an in-equation edit out of math tokens with equations on both sides", async () => {
    // `snapPrefix/SuffixOutOfMathTokens` snap the common-affix boundary out of
    // any math token. They run a single pass over `[quote, replacement]` and
    // carry one `result` across both — which is correct only because the two
    // strings are byte-identical across the common prefix/suffix, so their
    // math spans coincide there. This exercises that with equations flanking
    // the edited one on both sides; the digit edit narrows to just `$x2$`.
    const editor = await setupEditorWithMathParagraphs([
      { equation: "a" },
      { text: " before " },
      { equation: "x2" },
      { text: " after " },
      { equation: "b" },
    ]);

    const replaced = await replaceTextInEditMode(
      editor,
      "$a$ before $x2$ after $b$",
      "$a$ before $x3$ after $b$",
    );
    expect(replaced).toBe(true);
    expect(getMarkdownContent(editor)).toBe("$a$ before $x3$ after $b$");
  });
});
