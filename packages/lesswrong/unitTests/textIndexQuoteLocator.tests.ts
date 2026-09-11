import { $createParagraphNode, $createTextNode, $getRoot, type LexicalEditor } from "lexical";
import { $createMentionNode } from "@/components/research/lexical/MentionNode";
import { createHeadlessEditor } from "../../../app/api/agent/editorAgentUtil";
import {
  $locateQuoteWithTextIndex,
  normalizeTracked,
  projectQuoteToRenderedText,
} from "../../../app/api/agent/textIndexQuoteLocator";
import { $selectionCoveredText } from "../../../app/api/agent/quoteLocator";
import type { MarkdownQuoteSelectionResult } from "../../../app/api/agent/mapMarkdownToLexical";
import { runEditorUpdate, setupEditorWithContent, setupEditorWithMathParagraphs } from "./lexicalTestHelpers";

interface LocateOutcome {
  result: MarkdownQuoteSelectionResult
  coveredText: string | null
}

async function locate(editor: LexicalEditor, quote: string): Promise<LocateOutcome> {
  let result: MarkdownQuoteSelectionResult = { found: false };
  let coveredText: string | null = null;
  await runEditorUpdate(editor, () => {
    result = $locateQuoteWithTextIndex(quote);
    if (result.found && result.anchor && result.focus) {
      coveredText = $selectionCoveredText(result.anchor, result.focus)?.text ?? null;
    }
  });
  return { result, coveredText };
}

describe("normalizeTracked", () => {
  it("maps normalized characters back to their raw source ranges", () => {
    const normalized = normalizeTracked("Hello   World");
    expect(normalized.text).toBe("hello world");
    expect(normalized.toRawStart[0]).toBe(0);
    // "w" of World is at raw index 8
    expect(normalized.toRawStart[6]).toBe(8);
  });

  it("folds typographic punctuation, ellipsis, and case", () => {
    expect(normalizeTracked("It’s done… OK").text).toBe("it's done... ok");
  });

  it("preserves case and content inside math tokens", () => {
    const normalized = normalizeTracked("see $E = mc^2$ here");
    expect(normalized.text).toContain("E = mc^2");
    expect(normalized.text.startsWith("see ")).toBe(true);
  });

  it("trims and collapses whitespace including across newlines", () => {
    expect(normalizeTracked("  a\n\n b\tc ").text).toBe("a b c");
  });
});

describe("$locateQuoteWithTextIndex", () => {
  it("locates a plain within-paragraph quote", async () => {
    const editor = await setupEditorWithContent(
      "First paragraph here.\n\nSecond paragraph with a target phrase inside it.",
    );
    const { result, coveredText } = await locate(editor, "a target phrase");
    expect(result.found).toBe(true);
    expect(coveredText).toBe("a target phrase");
  });

  it("locates a quote spanning a bold boundary", async () => {
    const editor = await setupEditorWithContent(
      "Some text with **bold words** continuing after.",
    );
    const { result, coveredText } = await locate(editor, "with **bold words** continuing");
    expect(result.found).toBe(true);
    expect(coveredText).toBe("with bold words continuing");
  });

  it("locates a quote whose markdown markers the agent dropped", async () => {
    const editor = await setupEditorWithContent(
      "Some text with **bold words** continuing after.",
    );
    const { result, coveredText } = await locate(editor, "with bold words continuing");
    expect(result.found).toBe(true);
    expect(coveredText).toBe("with bold words continuing");
  });

  it("locates a quote spanning a paragraph boundary", async () => {
    const editor = await setupEditorWithContent(
      "First paragraph ends here.\n\nSecond paragraph starts now.",
    );
    const { result, coveredText } = await locate(
      editor,
      "ends here.\n\nSecond paragraph starts",
    );
    expect(result.found).toBe(true);
    expect(coveredText).toBe("ends here.\n\nSecond paragraph starts");
  });

  it("matches an ASCII-ellipsis quote against a unicode-ellipsis document", async () => {
    const editor = await setupEditorWithContent(
      "She paused… and then continued speaking.",
    );
    const { result, coveredText } = await locate(editor, "She paused... and then");
    expect(result.found).toBe(true);
    expect(coveredText).toBe("She paused… and then");
  });

  it("matches straight quotes against curly-quote documents", async () => {
    const editor = await setupEditorWithContent(
      "He said “it’s working” and left.",
    );
    const { result } = await locate(editor, "said \"it's working\" and");
    expect(result.found).toBe(true);
  });

  it("rejects an ambiguous quote with an explanatory reason", async () => {
    const editor = await setupEditorWithContent(
      "The same sentence repeats.\n\nThe same sentence repeats.",
    );
    const { result } = await locate(editor, "same sentence repeats");
    expect(result.found).toBe(false);
    expect(result.reason).toContain("ambiguous");
    expect(result.reason).toContain("2");
  });

  it("reports a genuinely absent quote as not found", async () => {
    const editor = await setupEditorWithContent("Some ordinary content.");
    const { result } = await locate(editor, "entirely absent text");
    expect(result.found).toBe(false);
    expect(result.reason).toContain("not found");
  });

  it("locates a quote containing an inline equation", async () => {
    const editor = await setupEditorWithMathParagraphs(
      [{ text: "The identity " }, { equation: "e^{i\\pi} + 1 = 0" }, { text: " is famous." }],
    );
    const { result, coveredText } = await locate(
      editor,
      "identity $e^{i\\pi} + 1 = 0$ is famous",
    );
    expect(result.found).toBe(true);
    expect(coveredText).toContain("e^{i\\pi} + 1 = 0");
  });

  it("strips footnote reference markers from quotes", () => {
    expect(normalizeTracked(projectQuoteToRenderedText("a claim[^3] continues")).text)
      .toBe("a claim continues");
    // Definitions keep their structure (the marker is part of the definition line)
    expect(normalizeTracked(projectQuoteToRenderedText("text [^3]: note")).text)
      .not.toBe("text : note");
  });

  it("locates a list quote whose bullet markers the agent restyled (marker-blind tier)", async () => {
    const editor = await setupEditorWithContent(
      "Intro paragraph.\n\n- alpha beta gamma\n- delta epsilon zeta",
    );
    // Simulates the swap-emphasis transcription failure: `*` bullets
    // rewritten to `_`, which CommonMark renders as literal underscores.
    const { result } = await locate(editor, "_ alpha beta gamma\n_ delta epsilon zeta");
    expect(result.found).toBe(true);
  });

  it("locates a quote against document text containing literal markers", async () => {
    const editor = await setupEditorWithContent(
      "He wrote literal \\*stars\\* in his prose somewhere.",
    );
    const { result } = await locate(editor, "literal stars in his prose");
    expect(result.found).toBe(true);
  });

  it("strips collapsible-section markers from quotes", async () => {
    const editor = await setupEditorWithContent(
      "Intro paragraph.\n\nSection title here\n\nHidden body content.",
    );
    const { result } = await locate(editor, "+++ Section title here");
    expect(result.found).toBe(true);
  });

  it("locates a quote containing a research mention token", async () => {
    const editor = createHeadlessEditor("MentionLocateTest");
    await runEditorUpdate(editor, () => {
      const paragraph = $createParagraphNode();
      paragraph.append(
        $createTextNode("As discussed in "),
        $createMentionNode({ kind: "doc", id: "abc123", title: "Prior Findings" }),
        $createTextNode(", the result holds."),
      );
      $getRoot().clear();
      $getRoot().append(paragraph);
    });

    // The agent reads the mention as its canonical token and quotes it verbatim.
    const { result } = await locate(editor, 'discussed in @[doc:abc123 "Prior Findings"], the result');
    expect(result.found).toBe(true);
  });

  it("is immune to phantom math spans from literal dollar signs in prose", async () => {
    const editor = await setupEditorWithContent(
      "Damages of ~\\$1 trillion are possible (\\$). Highly recommended for a deep, "
      + "gears-level model of how AI capabilities are likely to progress.",
    );
    // The two `$`s would scan as a math span pair, swallowing the text
    // between them; the document side must use the tree's ground truth.
    const { result } = await locate(editor, "gears-level model of how AI capabilities");
    expect(result.found).toBe(true);
  });

  it("locates a quote inside a list item", async () => {
    const editor = await setupEditorWithContent(
      "Intro paragraph.\n\n- first list item content\n- second list item content",
    );
    const { result, coveredText } = await locate(editor, "first list item content");
    expect(result.found).toBe(true);
    expect(coveredText).toBe("first list item content");
  });
});
