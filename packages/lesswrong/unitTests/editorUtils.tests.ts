import { convertFromRaw } from 'draft-js';
import { draftToHTML } from '../server/draftConvert'
import { htmlToDraftServer } from '../server/resolvers/toDraft'
import { dataToWordCount } from "../server/editor/conversionUtils";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

describe("draftToHtml", () => {
  it('correctly translates bold and italic and bold-italic', () => {
    const rawDraftJS: any = {
      "blocks" : [
          {
              "data" : {},
              "depth" : 0,
              "entityRanges" : [],
              "inlineStyleRanges" : [ 
                  {
                      "length" : 6,
                      "offset" : 0,
                      "style" : "ITALIC"
                  }
              ],
              "key" : "6g37h",
              "text" : "Italic",
              "type" : "unstyled"
          },
          {
              "data" : {},
              "depth" : 0,
              "entityRanges" : [],
              "inlineStyleRanges" : [ 
                  {
                      "length" : 4,
                      "offset" : 0,
                      "style" : "BOLD"
                  }
              ],
              "key" : "fs9sl",
              "text" : "Bold",
              "type" : "unstyled"
          },
          {
              "data" : {},
              "depth" : 0,
              "entityRanges" : [],
              "inlineStyleRanges" : [ 
                  {
                      "length" : 10,
                      "offset" : 0,
                      "style" : "BOLD"
                  }, 
                  {
                      "length" : 10,
                      "offset" : 0,
                      "style" : "ITALIC"
                  }
              ],
              "key" : "9ljma",
              "text" : "BoldItalic",
              "type" : "unstyled"
          }
      ],
      "entityMap" : {}
    }
    const result = draftToHTML(convertFromRaw(rawDraftJS))
    result.should.equal("<p><em>Italic</em></p><p><strong>Bold</strong></p><p><strong><em>BoldItalic</em></strong></p>")
  })
})

describe("htmlToDraft", () => {
  describe("draftToHtml roundtrip testing", () => {
    const tests = [
      {description: "italics", html: "<p><em>Italic</em></p>"},
      {description: "bold", html: "<p><strong>Bold</strong></p>"},
      {description: "bold-italic", html: "<p><strong><em>BoldItalic</em></strong></p>"},
      {description: "bullet-list", html: "<ul><li>first</li><li>second</li></ul>"},
      {description: "link", html: `<p><a href="google.com"> Link </a></p>`}
    ]
    for (const t of tests) {
      it(t.description, () => {
        const draft = htmlToDraftServer(t.html)
        const html = draftToHTML(convertFromRaw(draft))
        html.should.equal(t.html)
      })
    }
  });

  it("Server-side conversions are stable between calls", async () => {
    const html = `
      <h1>This is a sample heading</h1>
      <p>This is some sample text.</p>
      <h2>This is another sample heading</h2>
      <p>This is some more sample text.</p>
    `;
    const draft1 = htmlToDraftServer(html);
    const draft2 = htmlToDraftServer(html);
    expect(draft1).toEqual(draft2);
  });

  it("Server-side stable ids are unique", async () => {
    const html = `
      <p>This is some sample text.</p>
      <p>This is some sample text.</p>
    `;
    const draft1 = htmlToDraftServer(html);
    const draft2 = htmlToDraftServer(html);
    expect(draft1.blocks).toHaveLength(2);
    expect(typeof draft1.blocks[0].key).toBe("string");
    expect(draft1.blocks[0].key).not.toBe(draft2.blocks[1].key);
  });
});

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
