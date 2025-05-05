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
});
