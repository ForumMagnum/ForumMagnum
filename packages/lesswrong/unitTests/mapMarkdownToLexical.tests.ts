import { JSDOM } from "jsdom";
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";
import {
  $createParagraphNode,
  $createTextNode,
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
import { buildNodeMarkdownMapForSubtree, findBlockToOperateOnByPrefix, locateMarkdownQuoteSelectionInSubtree, toPlainTextFilter } from "../../../app/api/agent/mapMarkdownToLexical";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { runEditorUpdate, setupEditorWithContent, setupEditorWithHtml } from "./lexicalTestHelpers";
import { normalizeImportedTopLevelNodes } from "../../../app/api/(markdown)/editorMarkdownUtils";

async function selectMarkdownQuoteInEditor(
  editor: LexicalEditor,
  markdownQuote: string
): Promise<void> {
  await runEditorUpdate(editor, () => {
    const root = $getRoot();
    const result = locateMarkdownQuoteSelectionInSubtree({
      rootNodeKey: root.getKey(),
      markdownQuote,
    });
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

describe("empty root detection", () => {
  it("throws when buildNodeMarkdownMapForSubtree is called on an empty root", async () => {
    const editor = createHeadlessEditor("EmptyRootTest");

    // A headless editor starts with a root that has zero children.
    // This mirrors the scenario where a headless editor syncs against a
    // Hocuspocus document with no persisted Yjs state. The empty-root
    // invariant should be caught earlier (in withMainDocEditorSession),
    // so buildNodeMarkdownMapForSubtree is expected to throw rather than
    // silently return empty results.
    expect(() => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        buildNodeMarkdownMapForSubtree(root.getKey(), "anything");
      });
    }).toThrow(/editor state is empty/i);
  });

  it("throws when locateMarkdownQuoteSelectionInSubtree is called on an empty root", async () => {
    const editor = createHeadlessEditor("EmptyRootLocateTest");

    expect(() => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        locateMarkdownQuoteSelectionInSubtree({
          rootNodeKey: root.getKey(),
          markdownQuote: "some quote",
        });
      });
    }).toThrow(/editor state is empty/i);
  });
});

describe("findTextRangeInNodeByPlainQuote whitespace normalization", () => {
  it("returns correct offsets when original text has extra whitespace compared to quote", async () => {
    const editor = createHeadlessEditor("WhitespaceNormalizationTest");

    await runEditorUpdate(editor, () => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      // Text with double spaces between words
      const textNode = $createTextNode("hello  world  foo");
      paragraph.append(textNode);
      root.append(paragraph);
    });

    let result: ReturnType<typeof locateMarkdownQuoteSelectionInSubtree> | undefined;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      // Quote with single spaces - should match via whitespace normalization fallback
      result = locateMarkdownQuoteSelectionInSubtree({
        rootNodeKey: root.getKey(),
        markdownQuote: "hello world foo",
      });
    });

    expect(result).toBeDefined();
    expect(result!.found).toBe(true);
    expect(result!.anchor).toBeDefined();
    expect(result!.focus).toBeDefined();

    // The anchor should start at offset 0 (beginning of "hello")
    expect(result!.anchor!.offset).toBe(0);
    // The focus should end at offset 17 (end of "hello  world  foo"),
    // NOT at offset 15 (which would be wrong if using the normalized quote length)
    expect(result!.focus!.offset).toBe(17);
  });

  it("returns correct offsets when extra whitespace is in the middle of the text", async () => {
    const editor = createHeadlessEditor("WhitespaceNormalizationMiddle");

    await runEditorUpdate(editor, () => {
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      // Text with prefix, then double spaces in quoted region
      const textNode = $createTextNode("prefix  alpha   beta  suffix");
      paragraph.append(textNode);
      root.append(paragraph);
    });

    let result: ReturnType<typeof locateMarkdownQuoteSelectionInSubtree> | undefined;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      // Quote with single spaces - should match "alpha   beta" in original (via normalization)
      result = locateMarkdownQuoteSelectionInSubtree({
        rootNodeKey: root.getKey(),
        markdownQuote: "alpha beta",
      });
    });

    expect(result).toBeDefined();
    expect(result!.found).toBe(true);
    expect(result!.anchor).toBeDefined();
    expect(result!.focus).toBeDefined();

    // "prefix  alpha   beta  suffix"
    //  0123456789...
    // "prefix  " = 8 chars, so "alpha" starts at index 8
    expect(result!.anchor!.offset).toBe(8);
    // "alpha   beta" = 12 chars, so end is at 8 + 12 = 20
    expect(result!.focus!.offset).toBe(20);
  });
});

describe("mapMarkdownToLexical quote selection", () => {
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
    // Set up via explicit HTML with a `<span class="math-tex">` wrapper so
    // that Lexical's DOM importer creates a real MathNode. The markdown→HTML
    // path (used by `setupEditorWithContent`) can't produce that structure
    // in a test env because `renderMathInHtml` short-circuits, leaving the
    // math-it-mathjax output as literal `\(...\)` text.
    const editor = await setupEditorWithHtml(
      '<p><span style="white-space: pre-wrap;">This paragraph contains inline math written as </span>' +
      '<span class="math-tex">\\(\\LaTeX\\)</span>' +
      '<span style="white-space: pre-wrap;"> for testing.</span></p>' +
      '<p>Another paragraph follows.</p>'
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
    // Uses h3 because Turndown serializes h1/h2 with setext (underline) style
    // rather than ATX (# prefix) style, making h1/h2 unmatchable by # prefix.
    const markdownDocument = [
      "Opening paragraph.",
      "",
      "### My Important Section",
      "",
      "Section body text.",
    ].join("\n");

    const editor = await setupEditorWithContent(markdownDocument);
    let result: ReturnType<typeof locateMarkdownQuoteSelectionInSubtree> | undefined;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      result = locateMarkdownQuoteSelectionInSubtree({
        rootNodeKey: root.getKey(),
        markdownQuote: "### My Important Section",
      });
    });

    expect(result).toBeDefined();
    expect(result!.found).toBe(true);
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
    let result: ReturnType<typeof locateMarkdownQuoteSelectionInSubtree> | undefined;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      result = locateMarkdownQuoteSelectionInSubtree({
        rootNodeKey: root.getKey(),
        markdownQuote: "> This is a blockquote.",
      });
    });

    expect(result).toBeDefined();
    expect(result!.found).toBe(true);
  });
});

describe("findBlockToOperateOnByPrefix", () => {
  interface MatchInfo { type: string; text: string; isListItem: boolean }
  function findFor(editor: LexicalEditor, prefix: string): MatchInfo | null {
    let result: MatchInfo | null = null;
    editor.getEditorState().read(() => {
      const root = $getRoot();
      const rootChildren = root.getChildren();
      const textFilter = toPlainTextFilter(prefix);
      const mapResult = buildNodeMarkdownMapForSubtree(root.getKey(), textFilter);
      const node = findBlockToOperateOnByPrefix({ rootChildren, prefix, mapResult, textFilter });
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
    // Regression: previously `plainTextStartsWith` matched the LIST against
    // its first item's text (since the list's textContent starts there) and
    // deleteBlock would remove the entire list. The new locator targets
    // the first item specifically.
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
});
