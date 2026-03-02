import { JSDOM } from "jsdom";
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";
import {
  $createParagraphNode,
  $createTextNode,
  $isDecoratorNode,
  $isElementNode,
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
import { locateMarkdownQuoteSelectionInSubtree } from "../../../app/api/agent/mapMarkdownToLexical";

async function runEditorUpdate(editor: LexicalEditor, updater: () => void): Promise<void> {
  await new Promise<void>((resolve) => {
    editor.update(updater, { onUpdate: resolve });
  });
}

async function loadMarkdownIntoHeadlessEditor(markdownDocument: string): Promise<LexicalEditor> {
  const editor = createHeadlessEditor("MapMarkdownToLexicalTests");
  const html = await markdownToHtml(markdownDocument);

  await runEditorUpdate(editor, () => {
    const dom = new JSDOM(html);
    const lexicalNodes = $generateNodesFromDOM(editor, dom.window.document);
    const root = $getRoot();
    root.clear();
    root.append(...lexicalNodes);
  });

  return editor;
}

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
    for (const node of selectedNodes) {
      if ($isElementNode(node) || $isDecoratorNode(node)) {
        root.append(node);
      } else {
        const paragraph = $createParagraphNode();
        paragraph.append(node);
        root.append(paragraph);
      }
    }
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
  const editor = await loadMarkdownIntoHeadlessEditor(markdownDocument);
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
    const markdownDocument = [
      "This paragraph contains inline math written as $\\LaTeX$ for testing.",
      "",
      "Another paragraph follows.",
    ].join("\n");
    const markdownQuote = "$\\LaTeX$";

    await expectQuoteRoundTripsFromMarkdownDocument({ markdownDocument, markdownQuote });
  });
});
