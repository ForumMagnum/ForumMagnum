import { dataToWordCount } from "../server/editor/conversionUtils";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

describe("dataToWordCount", () => {
  it("counts words in HTML content", async () => {
    expect(await dataToWordCount("<div><p>A sample piece of content</p></div>", "html", createAnonymousContext())).toBe(5);
  });
  it("counts words in CKEditor content", async () => {
    expect(await dataToWordCount("A sample piece of content", "ckEditorMarkup", createAnonymousContext())).toBe(5);
  });
  it("counts words in DraftJS content", async () => {
    expect(await dataToWordCount({
      blocks: [
        {
          key: "abcde",
          text: "A sample piece of content",
          type: "unstyled",
          depth: 0,
          inlineStyleRanges: [],
          entityRanges: [],
          data: {},
        },
      ],
      entityMap: {},
    }, "draftJS", createAnonymousContext())).toBe(5);
  });
  it("counts words in MD content", async () => {
    expect(await dataToWordCount("A sample piece of content", "markdown", createAnonymousContext())).toBe(5);
  });
  it("excludes simple footnotes", async () => {
    expect(await dataToWordCount(`
A sample piece of content[^1] that has simple footnotes[^2]

[^1]: First footnote

[^2]:

  Second footnote
    `, "markdown", createAnonymousContext())).toBe(9);
  });
  it("excludes complex footnotes", async () => {
    expect(await dataToWordCount(`
A sample piece of content[^footnote1] that has complex footnotes[^footnote2]

1.  ^**[^](#footnote1)**^

  First footnote

2.  ^**[^](#footnote2)**^

  Second footnote
    `, "markdown", createAnonymousContext())).toBe(9);
  });
  it("excludes appendices", async () => {
    // Construct the same document with and without an appendix added, and enforce
    // that their word counts are the same.
    //
    // (Note that word counting has a bunch of dumb subtleties, and in particular,
    // the "=========" hr winds up getting counted. This is why we test this with a
    // comparison, rather than an exact count.)
    const nonAppendixMarkdown =
      "A sample piece of content that has one appendix.\n"
      +"\n"
      +"Section 1\n"
      +"=========\n"
      +"\n";
    const appendixMarkdown =
      "Appendix 1\n"
      +"==========\n"
      +"\n"
      +"Lorem ipsum dolor sit amet."
    const wordCountWithoutAppendix = await dataToWordCount(nonAppendixMarkdown, "markdown", createAnonymousContext());
    const wordCountWithAppendix = await dataToWordCount(nonAppendixMarkdown+appendixMarkdown, "markdown", createAnonymousContext());
    expect(wordCountWithoutAppendix).toBe(wordCountWithAppendix);
  });

  it("does not exclude content after a heading that only mentions appendix parenthetically", async () => {
    // Regression test for: headings like "Recent examples (more in appendix)" used to
    // cause everything after that heading to be excluded from the word count, because
    // the old regex matched any heading containing "appendix" anywhere.
    const preamble = "A sample piece of content.\n\n";
    const parentheticalAppendixHeading = "Recent examples of reward hacking (more in appendix)\n=========================================================\n\n";
    const body = "This content should still count towards the word count.\n";

    const wordCountWithParentheticalAppendixMention = await dataToWordCount(
      preamble + parentheticalAppendixHeading + body,
      "markdown",
      createAnonymousContext(),
    );
    const wordCountWithoutParentheticalAppendixMention = await dataToWordCount(
      preamble + body,
      "markdown",
      createAnonymousContext(),
    );
    // Both should include the body words; the parenthetical mention should NOT cause
    // the body to be dropped.
    expect(wordCountWithParentheticalAppendixMention).toBe(wordCountWithoutParentheticalAppendixMention);
  });

  it("excludes collapsible section body but keeps collapsible title", async () => {
    const markdownWithShortCollapsedBody = `
A sample piece of content.
+++ Visible title words
Hidden body.
+++
`;
    const markdownWithLongCollapsedBody = `
A sample piece of content.
+++ Visible title words
Hidden body words should not count, even when this sentence is much longer.
+++
`;
    const shortCollapsedBodyWordCount = await dataToWordCount(markdownWithShortCollapsedBody, "markdown", createAnonymousContext());
    const longCollapsedBodyWordCount = await dataToWordCount(markdownWithLongCollapsedBody, "markdown", createAnonymousContext());
    expect(shortCollapsedBodyWordCount).toBe(longCollapsedBodyWordCount);
  });
});
