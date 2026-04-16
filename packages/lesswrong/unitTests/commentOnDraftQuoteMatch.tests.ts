import {
  type LexicalEditor,
  type LexicalNode,
  $isElementNode,
  $getRoot,
} from "lexical";
import { $isMarkNode } from "@lexical/mark";
import { $attachMarkToQuote, type QuoteMarkResult } from "../../../app/api/agent/commentOnDraft/route";
import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { runEditorUpdate, setupEditorWithContent, setupEditorWithHtml } from "./lexicalTestHelpers";
import { randomId } from "@/lib/random";

async function attachCommentMark(
  editor: LexicalEditor,
  quote: string,
  markId: string,
): Promise<QuoteMarkResult> {
  let result: QuoteMarkResult = { quoteFoundInDocument: false, markCreated: false };
  await runEditorUpdate(editor, () => {
    result = $attachMarkToQuote(quote, markId);
  });
  return result;
}

/** Collect all MarkNode IDs from the editor state. */
function getAllMarkIds(editor: LexicalEditor): string[] {
  const markIds: string[] = [];
  editor.getEditorState().read(() => {
    function walk(node: LexicalNode) {
      if ($isMarkNode(node)) {
        markIds.push(...node.getIDs());
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) {
          walk(child);
        }
      }
    }
    walk($getRoot());
  });
  return markIds;
}

/** Get the text content wrapped by a specific mark ID. */
function getMarkedTextContent(editor: LexicalEditor, markId: string): string | null {
  let result: string | null = null;
  editor.getEditorState().read(() => {
    function walk(node: LexicalNode) {
      if ($isMarkNode(node) && node.getIDs().includes(markId)) {
        result = node.getTextContent();
        return;
      }
      if ($isElementNode(node)) {
        for (const child of node.getChildren()) {
          walk(child);
        }
      }
    }
    walk($getRoot());
  });
  return result;
}

describe("commentOnDraft quote matching", () => {
  it("attaches a mark when quote is within a single text node", async () => {
    const editor = await setupEditorWithContent(
      "Hello world. This is a test post."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "This is a test post.",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
    expect(getMarkedTextContent(editor, markId)).toBe("This is a test post.");
  });

  it("attaches a mark when quote spans a link boundary", async () => {
    // Quote starts in plain text, crosses into a link's visible text, and
    // exits back into plain text.
    const editor = await setupEditorWithContent(
      "I approve of Charles's frame of '[Anthropic stopped pretending](https://example.com)' as accurate."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "frame of 'Anthropic stopped pretending' as accurate",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  it("attaches a mark when quote spans bold formatting", async () => {
    const editor = await setupEditorWithContent(
      "This has **bold text** in the middle of the sentence."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "has bold text in the middle",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  it("attaches a mark when quote includes markdown formatting markers", async () => {
    // Emphasis markers in the quote should be projected away before matching,
    // since they aren't present as literal characters in the document's text.
    const editor = await setupEditorWithContent(
      "This has **bold text** in the middle of the sentence."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "has **bold text** in the middle",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  it("attaches a mark when quote spans inline code", async () => {
    const editor = await setupEditorWithContent(
      "Share the `?key=` parameter with your AI assistant."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "the ?key= parameter with",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  // ASCII apostrophe (U+0027) in the quote must match typographic
  // right-single-quote (U+2019) in the document, and vice versa.
  it("attaches a mark when quote uses ASCII apostrophe and document uses U+2019", async () => {
    const editor = await setupEditorWithContent(
      "Lorem ipsum dolor sit amet, it\u2019s a placeholder sentence with the typographic apostrophe."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "it's a placeholder sentence",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  // ASCII double quote (U+0022) in the quote must match typographic
  // U+201C / U+201D in the document.
  it("attaches a mark when quote uses ASCII double quotes and document uses U+201C/U+201D", async () => {
    const editor = await setupEditorWithContent(
      "Lorem ipsum \u201cdolor sit amet\u201d consectetur adipiscing elit."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      'ipsum "dolor sit amet" consectetur',
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  // Literal underscores in identifiers (variable names, file paths, etc.)
  // must survive matching. The inline **bold** in the document forces the
  // quote to cross a formatting boundary, which splits it across multiple
  // text nodes and exercises the per-paragraph matcher path.
  it("attaches a mark when the quote contains a literal underscore and crosses a formatting boundary", async () => {
    const editor = await setupEditorWithContent(
      "Lorem ipsum **bold phrase** with dolor_sit amet consectetur adipiscing elit."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "bold phrase with dolor_sit amet consectetur",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  // Unmatched literal `*` (no closing delimiter, so CommonMark won't parse
  // it as emphasis) must survive the projection.
  it("attaches a mark when the quote contains a literal asterisk and crosses a formatting boundary", async () => {
    const editor = await setupEditorWithContent(
      "Lorem ipsum **bold phrase** with foo*bar baz consectetur adipiscing elit."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "bold phrase with foo*bar baz consectetur",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  // Unmatched literal backtick (no closing backtick, so CommonMark won't
  // start a code span) must survive the projection.
  it("attaches a mark when the quote contains a literal backtick and crosses a formatting boundary", async () => {
    const editor = await setupEditorWithContent(
      "Lorem ipsum **bold phrase** with the ` character in the middle of the paragraph."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "bold phrase with the ` character in the middle",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  // Unmatched literal `~` (markdown-it-sub needs a closing `~` for
  // subscript, so a lone tilde stays literal) must survive the projection.
  it("attaches a mark when the quote contains a literal tilde and crosses a formatting boundary", async () => {
    const editor = await setupEditorWithContent(
      "Lorem ipsum **bold phrase** with approximately ~5 years of data in the set."
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "bold phrase with approximately ~5 years of data",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  // Inline LaTeX `$...$` in the quote must match MathNode segments in the
  // document — both sides canonicalize to the `$equation$` form, and the
  // `_` and `$` inside the equation must not be stripped as markdown.
  it("attaches a mark when the quote contains inline LaTeX that becomes a MathNode", async () => {
    const editor = await setupEditorWithHtml(
      '<p><span style="white-space: pre-wrap;">Dolor sit amet </span>' +
      '<span class="math-tex">\\(g_2(x,y)\\)</span>' +
      '<span style="white-space: pre-wrap;"> consectetur adipiscing elit.</span></p>'
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "amet $g_2(x,y)$ consectetur",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });

  // Quote must match across a footnote reference the agent omitted. The
  // markdown API renders footnotes as `[^id]` markers, which agents naturally
  // skip when quoting the surrounding prose, so the matcher has to ignore the
  // footnote node rather than splicing its `[N]` text into the search string.
  it("attaches a mark when the quote spans a footnote reference that the agent omitted", async () => {
    const editor = await setupEditorWithHtml(
      '<p>' +
      '<span style="white-space: pre-wrap;">Lorem ipsum</span>' +
      '<span class="footnote-reference" data-footnote-reference="" data-footnote-id="abc123" data-footnote-index="3" role="doc-noteref" id="fnrefabc123">' +
        '<sup><a href="#fnabc123">[3]</a></sup>' +
      '</span>' +
      '<span style="white-space: pre-wrap;"> dolor sit amet consectetur.</span>' +
      '</p>'
    );
    const markId = randomId();
    const { quoteFoundInDocument, markCreated } = await attachCommentMark(
      editor,
      "Lorem ipsum dolor sit amet",
      markId,
    );

    expect(quoteFoundInDocument).toBe(true);
    expect(markCreated).toBe(true);
    expect(getAllMarkIds(editor)).toContain(markId);
  });
});

// This describe block covers htmlToMarkdown (Turndown) behavior rather than
// the commentOnDraft quote-matching logic itself. Could move to a dedicated
// htmlToMarkdown test file.
describe("htmlToMarkdown inter-word spacing", () => {
  // When inter-word spacing is encoded as `&nbsp;` inside a bold/italic
  // formatting wrapper (e.g. `word1<b><strong>&nbsp;</strong></b>word2`),
  // Turndown's default emphasis rules drop the whitespace-only wrapper
  // entirely, producing "word1word2" in the markdown output.
  //
  // Skipped: a fix requires overriding Turndown's default `strong`/`em`
  // rules, which has a wider blast radius on other `htmlToMarkdown` callers
  // and only triggers on the rare `&nbsp;`-as-word-separator-inside-bold
  // pattern. Kept as `.skip` so the regression case stays documented for
  // whoever picks up the Turndown work.
  it.skip("preserves space between words when nbsp is inside a bold wrapper between spans", () => {
    const html =
      '<p><span style="white-space: pre-wrap;">Lorem ipsum dolor sit amet, with</span>' +
      '<b><strong class="text-bold" style="white-space: pre-wrap;">&nbsp;</strong></b>' +
      '<span style="white-space: pre-wrap;">the consectetur adipiscing elit.</span></p>';

    const md = htmlToMarkdown(html);

    expect(md).toContain("with the");
    expect(md).not.toMatch(/withthe/);
  });
});
