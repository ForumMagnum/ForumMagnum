import { JSDOM } from "jsdom";
import { $generateNodesFromDOM, $generateHtmlFromNodes } from "@lexical/html";
import {
  $createParagraphNode,
  $createRangeSelection,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $setSelection,
  type LexicalEditor,
  type LexicalNode,
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
import { agentMarkdownFromEditorHtml } from "../../../app/api/agent/agentMarkdownView";
import { $createImageNode, $isImageNode, type ImageNode } from "@/components/lexical/nodes/ImageNode";
import { $createPopulatedQueryInputNode } from "@/components/research/lexical/QueryInputNode";
import { $resolveInsertionPoint } from "../../../app/api/agent/insertBlock/route";
import { $isListItemNode, $isListNode } from "@lexical/list";
import { runEditorUpdate, setupEditorWithContent, setupEditorWithHtml, setupEditorWithMathParagraphs } from "./lexicalTestHelpers";
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

  it("matches an item of a nested sub-list", async () => {
    const editor = await setupEditorWithContent(
      "*   outer item\n    *   nested needle item\n*   second outer"
    );
    const matched = findFor(editor, "nested needle");
    expect(matched?.isListItem).toBe(true);
    expect(matched?.text).toBe("nested needle item");
  });
});

describe("$resolveInsertionPoint with nested structures", () => {
  it("translates a nested list-item match to its top-level list index", async () => {
    const editor = await setupEditorWithContent(
      "Intro paragraph.\n\n*   outer item\n    *   nested needle item\n*   second outer\n\nClosing paragraph."
    );
    let index: number | null = null;
    let isRootParent = false;
    editor.getEditorState().read(() => {
      const { point } = $resolveInsertionPoint({ after: "nested needle" });
      index = point?.index ?? null;
      isRootParent = point?.parent === $getRoot();
    });
    // Document top level: [paragraph, list, paragraph] — "after" the matched
    // nested item must insert after the whole list (index 2), not at a
    // root position derived from inner-list indices.
    expect(index).toBe(2);
    expect(isRootParent).toBe(true);
  });
});

function $findFirstImage(node: LexicalNode): ImageNode | null {
  if ($isImageNode(node)) return node;
  if (!$isElementNode(node)) return null;
  for (const child of node.getChildren()) {
    const image = $findFirstImage(child);
    if (image) return image;
  }
  return null;
}

/** The editPost read path's markdown for the editor's current document. */
function readPathMarkdown(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = withDomGlobals(() => $generateHtmlFromNodes(editor, null));
  });
  return agentMarkdownFromEditorHtml(html);
}

describe("$locateBlockByPrefix with image prefixes", () => {
  interface ImageMatchInfo { type: string; imageSrc: string | null; text: string; reason?: string }
  function locateImageBlock(editor: LexicalEditor, prefix: string): ImageMatchInfo | null {
    let result: ImageMatchInfo | null = null;
    editor.getEditorState().read(() => {
      const { node, reason } = $locateBlockByPrefix(prefix);
      if (!node) {
        result = { type: "none", imageSrc: null, text: "", reason };
        return;
      }
      result = { type: node.getType(), imageSrc: $findFirstImage(node)?.getSrc() ?? null, text: node.getTextContent() };
    });
    return result;
  }

  const twoImageDocument = [
    "Intro paragraph.",
    "![First figure](https://example.com/figures/one.png)",
    "Middle paragraph.",
    "![Second figure](https://example.com/figures/two.png)",
    "Closing paragraph.",
  ].join("\n\n");

  it("matches an image-only paragraph by its image markdown", async () => {
    const editor = await setupEditorWithContent(twoImageDocument);
    const matched = locateImageBlock(editor, "![Second figure](https://example.com/figures/two.png)");
    expect(matched?.reason).toBeUndefined();
    expect(matched?.imageSrc).toBe("https://example.com/figures/two.png");
  });

  it("identifies the image by URL, ignoring the alt text", async () => {
    const editor = await setupEditorWithContent(twoImageDocument);
    const matched = locateImageBlock(editor, "![](https://example.com/figures/one.png)");
    expect(matched?.imageSrc).toBe("https://example.com/figures/one.png");
    expect(locateImageBlock(editor, "![Fig [1]](https://example.com/figures/one.png)")?.imageSrc)
      .toBe("https://example.com/figures/one.png");
  });

  it("reports no match for an image URL that isn't in the document, rather than an empty prefix", async () => {
    const editor = await setupEditorWithContent(twoImageDocument);
    const matched = locateImageBlock(editor, "![Second figure](https://example.com/figures/three.png)");
    expect(matched?.type).toBe("none");
    expect(matched?.reason).toBe("No block starts with the given prefix.");
  });

  it("matches an image block followed by caption text, using the text to disambiguate", async () => {
    const editor = await setupEditorWithContent([
      "![fig](https://example.com/same.png)\n*Caption A*",
      "![fig](https://example.com/same.png)\n*Caption B*",
    ].join("\n\n"));
    expect(locateImageBlock(editor, "![fig](https://example.com/same.png)")?.reason).toContain("Ambiguous");
    expect(locateImageBlock(editor, "![fig](https://example.com/same.png)*Caption B*")?.text).toContain("Caption B");
  });

  it("does not match a text block when the prefix's image is not in it", async () => {
    // An image-only paragraph followed by a caption-like paragraph reads like
    // a captioned figure; the prefix spans both blocks, so it matches neither.
    const editor = await setupEditorWithContent(
      "![](https://example.com/f.png)\n\n*Figure 1: Results*\n\nResults are shown above."
    );
    expect(locateImageBlock(editor, "![](https://example.com/f.png)\n\n*Figure 1: Results*")?.type).toBe("none");
    expect(locateImageBlock(editor, "![](https://example.com/WRONG.png)Results are shown above")?.type).toBe("none");
  });

  it("does not match a list when the prefix runs from an image item into the next item", async () => {
    const editor = await setupEditorWithContent("*   ![pic](https://example.com/g.png)\n*   Caption item");
    expect(locateImageBlock(editor, "![pic](https://example.com/g.png)\n\nCaption item")?.type).toBe("none");
  });

  it("matches a list item that consists of an image", async () => {
    const editor = await setupEditorWithContent(
      "*   item one\n*   ![pic](https://example.com/b.png)\n*   item three"
    );
    const matched = locateImageBlock(editor, "![pic](https://example.com/b.png)");
    expect(matched?.type).toBe("listitem");
    expect(matched?.imageSrc).toBe("https://example.com/b.png");
  });

  it("matches a top-level image node", async () => {
    const editor = await setupEditorWithContent("Intro paragraph.");
    await runEditorUpdate(editor, () => {
      $getRoot().append($createImageNode({ src: "https://example.com/top.png", altText: "top" }));
    });
    const matched = locateImageBlock(editor, "![top](https://example.com/top.png)");
    expect(matched?.type).toBe("image");
  });

  it("matches an image block inside a collapsible section", async () => {
    const editor = await setupEditorWithHtml(
      `<p>Intro</p>`
      + `<details class="detailsBlock"><summary class="detailsBlockTitle">Figures</summary>`
      + `<div class="detailsBlockContent"><p>Inside text</p>`
      + `<p><img src="https://example.com/inside.png" alt="inside"></p></div></details>`
    );
    const matched = locateImageBlock(editor, "![inside](https://example.com/inside.png)");
    expect(matched?.reason).toBeUndefined();
    expect(matched?.type).toBe("paragraph");
    expect(matched?.imageSrc).toBe("https://example.com/inside.png");
  });

  it("does not match an image that follows text in its block", async () => {
    const editor = await setupEditorWithContent("Text before ![inline](https://example.com/c.png) after.");
    expect(locateImageBlock(editor, "![inline](https://example.com/c.png)")?.type).toBe("none");
  });

  it("does not match an image inside a block hidden from agent edits", async () => {
    const editor = await setupEditorWithContent("Intro paragraph.");
    await runEditorUpdate(editor, () => {
      const paragraph = $createParagraphNode();
      paragraph.append($createImageNode({ src: "https://example.com/hidden.png", altText: "hidden" }));
      $getRoot().append($createPopulatedQueryInputNode({ baseEnvironmentId: null, runtime: null }, [paragraph]).node);
    });
    expect(locateImageBlock(editor, "![hidden](https://example.com/hidden.png)")?.type).toBe("none");
  });

  it("matches a captioned figure by its image, not by its caption alone", async () => {
    const editor = await setupEditorWithHtml(
      `<p>Intro</p><figure class="image"><img src="https://example.com/f.png" alt="f">`
      + `<figcaption>Figure 1: Results</figcaption></figure><p>After</p>`
    );
    const readPathPrefix = "![f](https://example.com/f.png)\n\nFigure 1: Results";
    expect(readPathMarkdown(editor)).toContain(readPathPrefix);
    expect(locateImageBlock(editor, readPathPrefix)?.type).toBe("image");
    expect(locateImageBlock(editor, "![f](https://example.com/f.png)")?.type).toBe("image");
    expect(locateImageBlock(editor, "Figure 1: Results")?.type).toBe("none");
  });

  it.each([
    {
      name: "a linked image",
      html: `<p>Intro</p><p><a href="https://target.com"><img src="https://example.com/b.png" alt="b"></a></p>`,
      prefix: "[![b](https://example.com/b.png)](https://target.com)",
      type: "paragraph",
      src: "https://example.com/b.png",
    },
    {
      name: "an image with brackets in its alt text and an ampersand in its URL",
      html: `<p><img src="https://example.com/a.png?x=1&amp;y=2" alt="Fig [1]"></p>`,
      prefix: "![Fig \\[1\\]](https://example.com/a.png?x=1&y=2)",
      type: "paragraph",
      src: "https://example.com/a.png?x=1&y=2",
    },
    {
      name: "an image URL with a space and an unbalanced parenthesis",
      html: `<p><img src="https://example.com/a b(1.png" alt="x"></p>`,
      prefix: "![x](<https://example.com/a b(1.png>)",
      type: "paragraph",
      src: "https://example.com/a b(1.png",
    },
    {
      name: "an image list item, with its list marker",
      html: `<ul><li>one</li><li><img src="https://example.com/c.png" alt="pic"></li><li>three</li></ul>`,
      prefix: "*   ![pic](https://example.com/c.png)",
      type: "listitem",
      src: "https://example.com/c.png",
    },
    {
      name: "an image blockquote, with its quote marker",
      html: `<p>Intro</p><blockquote><p><img src="https://example.com/q.png" alt="q"></p></blockquote>`,
      prefix: "> ![q](https://example.com/q.png)",
      type: "quote",
      src: "https://example.com/q.png",
    },
    {
      name: "an image followed by text that looks like block syntax",
      html: `<p><img src="https://example.com/x.png" alt="x">- dash text</p>`,
      prefix: "![x](https://example.com/x.png)\\- dash text",
      type: "paragraph",
      src: "https://example.com/x.png",
    },
  ])("matches $name by its line in the editPost output", async ({ html, prefix, type, src }) => {
    const editor = await setupEditorWithHtml(html);
    expect(readPathMarkdown(editor)).toContain(prefix);
    const matched = locateImageBlock(editor, prefix);
    expect(matched?.reason).toBeUndefined();
    expect(matched?.type).toBe(type);
    expect(matched?.imageSrc).toBe(src);
  });

  it("resolves an insertion point after an image block", async () => {
    const editor = await setupEditorWithContent(twoImageDocument);
    let index: number | null = null;
    let isRootParent = false;
    editor.getEditorState().read(() => {
      const { point } = $resolveInsertionPoint({ after: "![First figure](https://example.com/figures/one.png)" });
      index = point?.index ?? null;
      isRootParent = point?.parent === $getRoot();
    });
    expect(index).toBe(2);
    expect(isRootParent).toBe(true);
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
