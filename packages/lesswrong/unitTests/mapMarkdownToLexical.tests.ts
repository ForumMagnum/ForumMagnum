import { JSDOM } from "jsdom";
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";
import {
  $createRangeSelection,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  type LexicalEditor,
} from "lexical";
import { markdownToHtml, htmlToMarkdown } from "@/server/editor/conversionUtils";
import { withDomGlobals } from "@/server/editor/withDomGlobals";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import {
  findRenderedQuoteInMarkdown,
  markdownQuoteToPlainText,
  markdownQuoteToRenderedPlainText,
  type MarkdownQuoteSelectionResult,
} from "../../../app/api/agent/mapMarkdownToLexical";
import { $locateBlockByPrefix, $locateQuoteWithTextIndex } from "../../../app/api/agent/textIndexQuoteLocator";
import { resolveInsertionIndex } from "../../../app/api/agent/insertBlock/route";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { runEditorUpdate, setupEditorWithContent, setupEditorWithMathParagraphs } from "./lexicalTestHelpers";
import { $createMathNode } from "@/components/editor/lexicalPlugins/math/MathNode";
import { normalizeImportedTopLevelNodes } from "../../../app/api/(markdown)/editorMarkdownUtils";

async function selectMarkdownQuoteInEditor(
  editor: LexicalEditor,
  markdownQuote: string
): Promise<void> {
  await runEditorUpdate(editor, () => {
    const result = $locateQuoteWithTextIndex(markdownQuote);
    if (!result.found || !result.anchor || !result.focus) {
      throw new Error(`Quote not found: ${markdownQuote}; reason=${result.reason ?? "unknown"}`);
    }

    const selection = $createRangeSelection();
    selection.anchor.set(result.anchor.key, result.anchor.offset, result.anchor.type);
    selection.focus.set(result.focus.key, result.focus.offset, result.focus.type);
    $setSelection(selection);
  });
}

async function deleteEverythingOutsideSelectionAndRoundTripToMarkdown(
  editor: LexicalEditor
): Promise<string> {
  await runEditorUpdate(editor, () => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) {
      throw new Error("Expected a range selection");
    }

    // Keep only selected content by replacing the full root with the selection HTML.
    const selectedHtml = withDomGlobals(() => $generateHtmlFromNodes(editor, selection));
    const dom = new JSDOM(selectedHtml);
    const selectedNodes = $generateNodesFromDOM(editor, dom.window.document);
    const root = $getRoot();
    root.clear();
    root.append(...normalizeImportedTopLevelNodes(selectedNodes));
  });

  let html = "";
  editor.getEditorState().read(() => {
    html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
  });

  return htmlToMarkdown(html).trim();
}

async function expectQuoteRoundTripsFromMarkdownDocument({
  markdownDocument,
  markdownQuote,
}: {
  markdownDocument: string
  markdownQuote: string
}): Promise<void> {
  const editor = await setupEditorWithContent(markdownDocument);
  await selectMarkdownQuoteInEditor(editor, markdownQuote);
  const extractedMarkdown = await deleteEverythingOutsideSelectionAndRoundTripToMarkdown(editor);
  const canonicalizeForComparison = (markdown: string): string => {
    const canonical = htmlToMarkdown(markdownToHtml(markdown)).trim();
    return canonical
      .replace(/\*/g, "_")
      .replace(/_{3,}/g, "__");
  };
  const canonicalExtractedMarkdown = canonicalizeForComparison(extractedMarkdown);
  const canonicalQuotedMarkdown = canonicalizeForComparison(markdownQuote.trim());
  if (canonicalExtractedMarkdown === canonicalQuotedMarkdown) {
    return;
  }

  const toPlainText = (markdown: string): string => canonicalizeForComparison(markdown)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
    .replace(/\\\[([\s\S]*?)\\\]/g, "$1")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\([A-Za-z]+)/g, "$1")
    .replace(/\\/g, "")
    .replace(/[_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  expect(toPlainText(canonicalExtractedMarkdown)).toBe(toPlainText(canonicalQuotedMarkdown));
}

function locateInEditor(editor: LexicalEditor, markdownQuote: string): MarkdownQuoteSelectionResult {
  let result: MarkdownQuoteSelectionResult = { found: false };
  editor.getEditorState().read(() => {
    result = $locateQuoteWithTextIndex(markdownQuote);
  });
  return result;
}

describe("empty root handling", () => {
  it("reports not-found against an empty document", () => {
    // A headless editor starts with a root that has zero children. The
    // empty-root invariant is enforced at the session level
    // (withMainDocEditorSession); the locator itself just finds nothing.
    const editor = createHeadlessEditor("EmptyRootLocateTest");
    const result = locateInEditor(editor, "some quote");
    expect(result.found).toBe(false);
  });
});

describe("whitespace normalization offsets", () => {
  it("returns correct offsets when original text has extra whitespace compared to quote", async () => {
    // Text with double spaces between words.
    const editor = await setupEditorWithMathParagraphs([{ text: "hello  world  foo" }]);
    const result = locateInEditor(editor, "hello world foo");

    expect(result.found).toBe(true);
    // The anchor should start at offset 0 (beginning of "hello")
    expect(result.anchor!.offset).toBe(0);
    // The focus should end at offset 17 (end of "hello  world  foo"),
    // NOT at offset 15 (which would be wrong if using the normalized quote length)
    expect(result.focus!.offset).toBe(17);
  });

  it("returns correct offsets when extra whitespace is in the middle of the text", async () => {
    const editor = await setupEditorWithMathParagraphs([{ text: "prefix  alpha   beta  suffix" }]);
    const result = locateInEditor(editor, "alpha beta");

    expect(result.found).toBe(true);
    // "prefix  " = 8 chars, so "alpha" starts at index 8
    expect(result.anchor!.offset).toBe(8);
    // "alpha   beta" = 12 chars, so end is at 8 + 12 = 20
    expect(result.focus!.offset).toBe(20);
  });
});

describe("quote selection round-trips", () => {
  it("selects and round-trips a plain text quote", async () => {
    const markdownDocument = [
      "Alpha paragraph.",
      "",
      "Beta paragraph with quoted content.",
      "",
      "Gamma paragraph.",
    ].join("\n");
    const markdownQuote = "Beta paragraph with quoted content.";

    await expectQuoteRoundTripsFromMarkdownDocument({ markdownDocument, markdownQuote });
  });

  it("selects and round-trips another plain quote instance", async () => {
    const markdownDocument = [
      "Before paragraph.",
      "",
      "First sentence.",
      "",
      "Second sentence.",
      "",
      "After paragraph.",
    ].join("\n");
    const markdownQuote = "Second sentence.";

    await expectQuoteRoundTripsFromMarkdownDocument({ markdownDocument, markdownQuote });
  });

  it("selects and round-trips formatted markdown quote", async () => {
    const markdownDocument = [
      "Prefix text before formatting.",
      "",
      "This sentence has **bold** text in the middle.",
      "",
      "Suffix text after formatting.",
    ].join("\n");
    const markdownQuote = "**bold**";

    await expectQuoteRoundTripsFromMarkdownDocument({ markdownDocument, markdownQuote });
  });

  it("selects and round-trips quote spanning surrounding text and link", async () => {
    const markdownDocument = "This is a paragraph that contains [an example url link](https://www.example.com) for a unit test";
    const markdownQuote = "paragraph that contains [an example url link](https://www.example.com) for a unit";

    await expectQuoteRoundTripsFromMarkdownDocument({ markdownDocument, markdownQuote });
  });

  it("selects and round-trips quote entirely inside a link", async () => {
    const markdownDocument = "This is a paragraph that contains [an example url link](https://www.example.com) for a unit test";
    const markdownQuote = "example url";

    await expectQuoteRoundTripsFromMarkdownDocument({ markdownDocument, markdownQuote });
  });

  it("selects and round-trips quote containing inline LaTeX", async () => {
    const editor = await setupEditorWithMathParagraphs(
      [
        { text: "This paragraph contains inline math written as " },
        { equation: "\\LaTeX" },
        { text: " for testing." },
      ],
      [{ text: "Another paragraph follows." }],
    );
    const markdownQuote = "$\\LaTeX$";

    await selectMarkdownQuoteInEditor(editor, markdownQuote);
    const extractedMarkdown = await deleteEverythingOutsideSelectionAndRoundTripToMarkdown(editor);
    const toPlainText = (markdown: string): string => markdown
      .replace(/\$([^$]+)\$/g, "$1")
      .replace(/\\\(([\s\S]*?)\\\)/g, "$1")
      .trim();
    expect(toPlainText(extractedMarkdown)).toBe(toPlainText(markdownQuote));
  });

  it("finds a heading when quoted with markdown # prefix", async () => {
    const markdownDocument = [
      "Opening paragraph.",
      "",
      "### My Important Section",
      "",
      "Section body text.",
    ].join("\n");

    const editor = await setupEditorWithContent(markdownDocument);
    expect(locateInEditor(editor, "### My Important Section").found).toBe(true);
  });

  it("finds a blockquote when quoted with > prefix", async () => {
    const markdownDocument = [
      "Before the quote.",
      "",
      "> This is a blockquote.",
      "",
      "After the quote.",
    ].join("\n");

    const editor = await setupEditorWithContent(markdownDocument);
    expect(locateInEditor(editor, "> This is a blockquote.").found).toBe(true);
  });
});

describe("$locateBlockByPrefix", () => {
  interface MatchInfo { type: string; text: string; isListItem: boolean }
  function findFor(editor: LexicalEditor, prefix: string): MatchInfo | null {
    let result: MatchInfo | null = null;
    editor.getEditorState().read(() => {
      const node = $locateBlockByPrefix(prefix).node;
      if (node) {
        result = {
          type: node.getType(),
          text: node.getTextContent(),
          isListItem: $isListItemNode(node),
        };
      }
    });
    return result;
  }

  it("matches a leading paragraph by prefix", async () => {
    const editor = await setupEditorWithContent(
      "First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph here."
    );
    const matched = findFor(editor, "Second paragraph");
    expect(matched).not.toBeNull();
    expect(matched?.type).toBe("paragraph");
    expect(matched?.text).toContain("Second paragraph");
  });

  it("matches a specific list item (not the whole list) by its leading text", async () => {
    const editor = await setupEditorWithContent(
      "*   alpha item\n*   bravo item\n*   charlie item\n*   delta item"
    );
    const matched = findFor(editor, "charlie item");
    expect(matched?.isListItem).toBe(true);
    expect(matched?.text).toBe("charlie item");
  });

  it("matches the first list item as a list item, not as the whole list", async () => {
    const editor = await setupEditorWithContent(
      "*   alpha item\n*   bravo item\n*   charlie item"
    );
    const matched = findFor(editor, "alpha item");
    expect(matched?.isListItem).toBe(true);
    expect(matched?.text).toBe("alpha item");
  });

  it("matches a top-level table by its first-cell content", async () => {
    const editor = await setupEditorWithContent(
      "| h1 | h2 |\n| --- | --- |\n| cell 0,0 | cell 1,0 |\n| cell 0,1 | cell 1,1 |"
    );
    const matched = findFor(editor, "h1");
    expect(matched).not.toBeNull();
    expect(matched?.isListItem).toBe(false);
    expect(matched?.type).toBe("table");
  });

  it("returns null when no block starts with the prefix", async () => {
    const editor = await setupEditorWithContent(
      "Alpha paragraph.\n\nBravo paragraph."
    );
    expect(findFor(editor, "no such prefix")).toBeNull();
  });

  it("reports ambiguity when several blocks start with the prefix", async () => {
    const editor = await setupEditorWithContent(
      "Repeated start, first.\n\nRepeated start, second."
    );
    let reason: string | undefined;
    editor.getEditorState().read(() => {
      const result = $locateBlockByPrefix("Repeated start");
      expect(result.node).toBeNull();
      reason = result.reason;
    });
    expect(reason).toContain("Ambiguous");
  });

  it("does not return the list when only a non-first item matches the prefix", async () => {
    const editor = await setupEditorWithContent(
      "*   alpha\n*   bravo\n*   charlie"
    );
    const matched = findFor(editor, "bravo");
    expect(matched?.isListItem).toBe(true);
    expect(matched?.text).toBe("bravo");
    let parentIsList = false;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      for (const child of root.getChildren()) {
        if ($isListNode(child)) { parentIsList = true; break; }
      }
    });
    expect(parentIsList).toBe(true);
  });

  it("matches a block whose markdown prefix starts with LaTeX", async () => {
    const editor = await setupEditorWithMathParagraphs(
      [{ equation: "x^2" }, { text: " starts here" }],
      [{ text: "Another paragraph." }],
    );

    const matched = findFor(editor, "$x^2$ starts");
    expect(matched).not.toBeNull();
    expect(matched?.type).toBe("paragraph");
  });

  it("rejects a prefix that extends past the end of the block", async () => {
    const editor = await setupEditorWithContent(
      "Short first block.\n\nSecond block follows."
    );
    let result: { node: unknown, reason?: string } = { node: null };
    editor.getEditorState().read(() => {
      result = $locateBlockByPrefix("Short first block. Second block");
    });
    expect(result.node).toBeNull();
  });

  it("matches a block whose text begins with leading whitespace", async () => {
    const editor = await setupEditorWithMathParagraphs(
      [{ text: " Alpha begins with a space" }],
      [{ text: "Beta paragraph." }],
    );
    const matched = findFor(editor, "Alpha begins");
    expect(matched).not.toBeNull();
    expect(matched?.type).toBe("paragraph");
  });

  it("matches a top-level display equation block by its prefix", async () => {
    const editor = await setupEditorWithMathParagraphs([{ text: "Intro paragraph." }]);
    await runEditorUpdate(editor, () => {
      // A display equation hoisted to the top level, as
      // $hoistDisplayMathOutOfParagraphs produces.
      $getRoot().append($createMathNode("E=mc^2", false));
    });
    const matched = findFor(editor, "$$\nE=mc^2\n$$");
    expect(matched).not.toBeNull();
    expect(matched?.type).toBe("math");
  });

  it("matches a standalone image by its markdown image prefix", async () => {
    const src = "https://example.com/diagram.png";
    const editor = await setupEditorWithContent(
      `Before the image.\n\n![](${src})\n\nAfter the image.`
    );

    const matched = findFor(editor, `![](${src})`);
    expect(matched).not.toBeNull();
    expect(matched?.type).toBe("paragraph");
  });

  it("matches an image by both alt text and source", async () => {
    const editor = await setupEditorWithContent(
      [
        "diagram",
        "",
        "![diagram](https://example.com/first.png)",
        "",
        "![diagram](https://example.com/second.png)",
      ].join("\n")
    );

    const matched = findFor(editor, "![diagram](https://example.com/second.png)");
    expect(matched).not.toBeNull();
    expect(matched?.type).toBe("paragraph");
  });

  it("reports ambiguity when several images match the same markdown prefix", async () => {
    const src = "https://example.com/repeated.png";
    const editor = await setupEditorWithContent(
      `![](${src})\n\nBetween images.\n\n![](${src})`
    );
    let reason: string | undefined;
    editor.getEditorState().read(() => {
      const result = $locateBlockByPrefix(`![](${src})`);
      expect(result.node).toBeNull();
      reason = result.reason;
    });

    expect(reason).toContain("Ambiguous image prefix");
  });

  it("matches an item of a nested sub-list", async () => {
    const editor = await setupEditorWithContent(
      "*   outer item\n    *   nested needle item\n*   second outer"
    );
    const matched = findFor(editor, "nested needle");
    expect(matched?.isListItem).toBe(true);
    expect(matched?.text).toBe("nested needle item");
  });
});

describe("resolveInsertionIndex with nested structures", () => {
  it("translates a nested list-item match to its top-level list index", async () => {
    const editor = await setupEditorWithContent(
      "Intro paragraph.\n\n*   outer item\n    *   nested needle item\n*   second outer\n\nClosing paragraph."
    );
    let result: { index: number | null } = { index: null };
    editor.getEditorState().read(() => {
      result = resolveInsertionIndex({ after: "nested needle" }, $getRoot().getChildren());
    });
    // Document top level: [paragraph, list, paragraph] — "after" the matched
    // nested item must insert after the whole list (index 2), not at a
    // root position derived from inner-list indices.
    expect(result.index).toBe(2);
  });
});

describe("findRenderedQuoteInMarkdown with literal dollar text", () => {
  it("locates a quote sandwiched between literal dollar signs", async () => {
    // `$5 … $10` is currency; `$5 for teh $` is mis-detected as a math token,
    // so "teh" vanishes from the projection and can't be located.
    const result = findRenderedQuoteInMarkdown("I paid $5 for teh $10 item", "teh");
    expect(result).not.toBeNull();
  });

  it("preserves literal dollar text in the plain-text projection", async () => {
    // No real math here, so the projection should be unchanged.
    expect(markdownQuoteToPlainText("Costs $5 and $10 today.")).toBe("Costs $5 and $10 today.");
  });
});

describe("LaTeX correctness regressions", () => {
  it("keeps later equations in a rendered quote when an earlier one is dropped", () => {
    // `$x$` lands in a link URL (rendered to no visible text); the surviving
    // `$y$` must restore as $y$, not be mis-paired with the dropped `$x$`.
    const projected = markdownQuoteToRenderedPlainText("[label]($x$) and $y$", { bracketDisplayMath: true });
    expect(projected).toContain("$y$");
    expect(projected).not.toContain("$x$");
  });

  it("locates a quote crossing literal math-delimiter text without overshooting", async () => {
    // The document text literally contains `$$x$$` (typed dollar signs, not a
    // MathNode). Both sides scan and canonicalize symmetrically, so the quote
    // matches, and the focus must land at the end of the document's
    // double-spaced form rather than overshooting.
    const editor = await setupEditorWithMathParagraphs([{ text: "the price $$x$$  rose sharply" }]);
    const result = locateInEditor(editor, "$$x$$ rose");

    expect(result.found).toBe(true);
    // "the price $$x$$  rose sharply" — "$$x$$" starts at index 10, and
    // "$$x$$  rose" (the document's double-spaced form) ends at index 21.
    expect(result.anchor!.type).toBe("text");
    expect(result.anchor!.offset).toBe(10);
    expect(result.focus!.type).toBe("text");
    expect(result.focus!.offset).toBe(21);
  });
});
