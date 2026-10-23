import { JSDOM } from "jsdom";
import { htmlToMarkdown, markdownToHtmlNoLaTeX } from "@/server/editor/conversionUtils";
import { getMarkdownItForAgentPosts, getMarkdownItForResearch } from "@/lib/utils/markdownItPlugins";
import { renderAgentMarkdownToHtml } from "../../../app/api/agent/editorAgentUtil";

/**
 * Text-fidelity regressions for the Lexical→HTML→Turndown read path, found
 * by the quote-match harness's round-trip invariant over the published-post
 * corpus. The invariant: the rendered text of `htmlToMarkdown(html)` must
 * equal the rendered text of `html` — markup may be lossy, text may not.
 */
describe("htmlToMarkdown text fidelity", () => {
  it("preserves an &nbsp; boundary space between styled spans", () => {
    // Lexical exports the space between an italic run and following text as
    // a leading &nbsp; on the next span; Turndown's ASCII-only whitespace
    // handling dropped it entirely when another inline element followed.
    const html = '<p><span style="white-space: pre-wrap;">AI is </span>'
      + '<i><span style="white-space: pre-wrap;">significantly easier</span></i>'
      + '<span style="white-space: pre-wrap;">&nbsp;than aligning. techniques are </span>'
      + '<i><span style="white-space: pre-wrap;">cheating</span></i>'
      + '<span style="white-space: pre-wrap;">.</span></p>';
    expect(htmlToMarkdown(html)).toBe(
      "AI is *significantly easier* than aligning. techniques are *cheating*.",
    );
  });

  it("unwraps bold whose delimiters CommonMark cannot reparse (punctuation-only)", () => {
    expect(htmlToMarkdown("<p>natural boundaries<b>.</b> We rely</p>"))
      .toBe("natural boundaries. We rely");
  });

  it("unwraps bold that opens against a word boundary onto punctuation", () => {
    expect(htmlToMarkdown("<p>by myself<strong>, a specific member</strong></p>"))
      .toBe("by myself, a specific member");
  });

  it("unwraps bold whose closer lands against a following word", () => {
    expect(htmlToMarkdown("<p><b>Importance sampling.</b>importance</p>"))
      .toBe("Importance sampling.importance");
  });

  it("keeps ordinary bold and italic markers", () => {
    expect(htmlToMarkdown("<p>normal <b>bold</b> and <i>italic</i> text</p>"))
      .toBe("normal **bold** and *italic* text");
    expect(htmlToMarkdown("<p>now <strong>supercharged </strong>our supply</p>"))
      .toBe("now **supercharged** our supply");
  });

  it("unwraps bold flanked by curly quotes that CommonMark cannot reparse", () => {
    // Flanking rules use Unicode punctuation: `word**\u201Cquoted\u201D**` is not
    // left-flanking (delimiter preceded by alphanumeric, followed by
    // punctuation), so the markers must be dropped, not emitted.
    expect(htmlToMarkdown("<p>word<b>\u201Cquoted\u201D</b></p>"))
      .toBe("word\u201Cquoted\u201D");
  });

  it("keeps intraword-adjacent emphasis that CommonMark accepts", () => {
    expect(htmlToMarkdown("<p>a <em>fully</em>-fledged plan</p>"))
      .toBe("a *fully*-fledged plan");
  });

  it("emits a linked image on a single line", () => {
    // CommonMark link text cannot contain blank lines; block content inside
    // an anchor must collapse onto one line to stay parseable.
    const html = '<p><a href="https://example.com/post">'
      + '<div><img src="https://example.com/img.png" alt="image.png"></div>'
      + '</a></p>';
    expect(htmlToMarkdown(html)).toBe("[![image.png](https://example.com/img.png)](https://example.com/post)");
  });

  it("writes image URLs that a bare destination can't hold in the <…> form", () => {
    expect(htmlToMarkdown('<p><img src="https://example.com/a b(1.png" alt="x"></p>'))
      .toBe("![x](<https://example.com/a b(1.png>)");
    expect(htmlToMarkdown('<p><img src="https://en.wikipedia.org/wiki/X_(Y).png" alt="x"></p>'))
      .toBe("![x](https://en.wikipedia.org/wiki/X_(Y).png)");
  });

  it("escapes brackets in image alt text", () => {
    expect(htmlToMarkdown('<p><img src="https://example.com/a.png" alt="a] [b"></p>'))
      .toBe("![a\\] \\[b](https://example.com/a.png)");
  });

  it("keeps non-breaking spaces inside widget srcdoc attributes", () => {
    // The NBSP fold must only touch text content: widget source round-trips
    // verbatim through the agent read/write path.
    const html = '<p>a&nbsp;b</p><iframe data-lexical-iframe-widget="" data-widget-id="w1" srcdoc="x&nbsp;y"></iframe>';
    const markdown = htmlToMarkdown(html);
    expect(markdown).toContain("a b");
    expect(markdown).toContain("x\u00A0y");
  });

  it("keeps ordinary inline links unchanged", () => {
    expect(htmlToMarkdown('<p>see <a href="https://example.com" title="the site">this link</a> here</p>'))
      .toBe('see [this link](https://example.com "the site") here');
  });
});

interface RenderedStructure {
  text: string
  links: string[]
  images: string[]
}

function renderedStructure(html: string): RenderedStructure {
  const dom = new JSDOM(html);
  try {
    const { body } = dom.window.document;
    return {
      text: (body.textContent ?? "").replace(/\s+/g, " ").trim(),
      links: Array.from(body.querySelectorAll("a")).map((a) => `${a.textContent} -> ${a.getAttribute("href")}`),
      images: Array.from(body.querySelectorAll("img")).map((img) => img.getAttribute("alt") ?? ""),
    };
  } finally {
    dom.window.close();
  }
}

describe("htmlToMarkdown literal brackets", () => {
  // `\[…\]` is display-math syntax in the agent markdown dialect, so literal
  // brackets escaped that way came back as equations when an agent
  // re-inserted text copied from the markdown view.
  it("writes literal brackets bare where they can't be read as syntax", () => {
    expect(htmlToMarkdown("<blockquote><p>He said [...] and then [sic] left.</p></blockquote>"))
      .toBe("> He said [...] and then [sic] left.");
    expect(htmlToMarkdown("<p>Ends [here]</p>")).toBe("Ends [here]");
    expect(htmlToMarkdown("<p>Open [ only</p>")).toBe("Open [ only");
    expect(htmlToMarkdown("<p>[<em>sic</em>] here</p>")).toBe("[*sic*] here");
    expect(htmlToMarkdown('<p>Cited [<a href="https://example.com/1">1</a>].</p>'))
      .toBe("Cited [[1](https://example.com/1)].");
    expect(htmlToMarkdown('<p>See <a href="https://example.com">the [draft] notes</a>.</p>'))
      .toBe("See [the [draft] notes](https://example.com).");
  });

  it("escapes the closer of brackets that would form link, footnote or mention syntax", () => {
    expect(htmlToMarkdown("<p>Literal [text](url) here</p>")).toBe("Literal [text\\](url) here");
    expect(htmlToMarkdown("<p>Literal [a][b] here</p>")).toBe("Literal [a\\][b] here");
    expect(htmlToMarkdown("<p>[term]: definition</p>")).toBe("[term\\]: definition");
    expect(htmlToMarkdown("<p>Value x^[note] y</p>")).toBe("Value x^[note\\] y");
    expect(htmlToMarkdown('<p>Mention @[doc:abc "Title"] here</p>')).toBe('Mention @[doc:abc "Title"\\] here');
    expect(htmlToMarkdown("<p>Close ] only</p>")).toBe("Close \\] only");
  });

  it("writes an opener that must be escaped as an entity when a \\] follows it", () => {
    expect(htmlToMarkdown("<p>Literal [^1] here</p>")).toBe("Literal &#91;^1\\] here");
    expect(htmlToMarkdown('<p>See <a href="https://example.com">a [b</a> here.</p>'))
      .toBe("See [a \\[b](https://example.com) here.");
    expect(htmlToMarkdown('<p>See <a href="https://example.com">a [b</a> then c] d.</p>'))
      .toBe("See [a &#91;b](https://example.com) then c\\] d.");
  });

  it("writes balanced brackets in image alt text bare", () => {
    expect(htmlToMarkdown('<p><img src="https://example.com/a.png" alt="a [b] c"></p>'))
      .toBe("![a [b] c](https://example.com/a.png)");
  });

  const roundTripCases: Array<[string, string]> = [
    ["balanced pairs", "<p>He said [...] and then [sic] left.</p>"],
    ["a pair ending a paragraph", "<p>See [1]</p>"],
    ["a pair before formatting", "<p>Note [x]<strong>bold</strong> here</p>"],
    ["a pair around formatting", "<p>[<em>sic</em>] here</p>"],
    ["a pair around a link", '<p>Cited [<a href="https://example.com/1">1</a>] and [<a href="https://example.com/2">2</a>].</p>'],
    ["a pair before a link", '<p>Literal [a]<a href="https://example.com">b</a> here</p>'],
    ["inline link syntax", "<p>Literal [text](url) here</p>"],
    ["reference link syntax", "<p>Literal [a][b] here</p>"],
    ["link definition syntax", "<p>[term]: definition</p>"],
    ["footnote reference syntax", "<p>Literal [^1] here</p>"],
    ["footnote definition syntax", "<p>[^1]: not a footnote</p>"],
    ["inline footnote syntax", "<p>Value x^[note] y</p>"],
    ["mention syntax", '<p>Mention @[doc:abc "Title"] here</p>'],
    ["unbalanced brackets", "<p>Open [ only, then close ] only, then [ again</p>"],
    ["a pair straddling a link's start", '<p>[ see <a href="https://example.com">here]</a> now</p>'],
    ["a pair inside link text", '<p>See <a href="https://example.com">the [draft] notes</a>.</p>'],
    ["link syntax inside link text", '<p>See <a href="https://example.com">a [b](c) d</a> now.</p>'],
    ["an opener inside link text closed outside it", '<p>See <a href="https://example.com">a [b</a> then c] d.</p>'],
    ["backslashes before brackets", "<p>Backslash \\[x\\] and \\(y\\) text</p>"],
    // Not unbalanced brackets in alt text: markdown-it drops escaped
    // characters from an image's alt text when rendering it.
    ["image alt text", '<p><img src="https://example.com/a.png" alt="a [b] c"></p>'],
  ];

  it.each(roundTripCases)("round-trips %s as text in every markdown dialect", (_description, html) => {
    const original = renderedStructure(html);
    const markdown = htmlToMarkdown(html);
    const renderings = {
      agent: renderAgentMarkdownToHtml(getMarkdownItForAgentPosts(), markdown),
      research: renderAgentMarkdownToHtml(getMarkdownItForResearch(), markdown),
      reader: markdownToHtmlNoLaTeX(markdown),
    };
    for (const [dialect, rendered] of Object.entries(renderings)) {
      const context = `${dialect} dialect, markdown: ${markdown}`;
      expect({ context, ...renderedStructure(rendered) }).toEqual({ context, ...original });
      const syntax = rendered.match(/math-tex|data-footnote|research-mention/)?.[0] ?? null;
      expect({ context, syntax }).toEqual({ context, syntax: null });
    }
  });
});

describe("htmlToMarkdown footnotes", () => {
  const footnoteHtml = (contentHtml: string) =>
    '<p>Body<span class="footnote-reference" data-footnote-reference="" data-footnote-id="a1" data-footnote-index="1"><sup><a href="#fna1">[1]</a></sup></span></p>'
    + '<ol class="footnote-section footnotes" data-footnote-section="">'
    + '<li class="footnote-item" data-footnote-item="" data-footnote-id="a1" data-footnote-index="1">'
    + '<span class="footnote-back-link" data-footnote-back-link="" data-footnote-id="a1"><sup><strong><a href="#fnrefa1">^</a></strong></sup></span>'
    + `<div class="footnote-content" data-footnote-content="">${contentHtml}</div>`
    + '</li></ol>';

  it("keeps links inside footnote content", () => {
    const markdown = htmlToMarkdown(footnoteHtml('<p>See <a href="https://example.com/x">here</a> for details.</p>'));
    expect(markdown).toContain("[^a1]: See [here](https://example.com/x) for details.");
  });

  it("keeps emphasis inside footnote content", () => {
    const markdown = htmlToMarkdown(footnoteHtml('<p>An <i>italic</i> and <b>bold</b> note.</p>'));
    expect(markdown).toContain("[^a1]: An *italic* and **bold** note.");
  });

  it("joins multi-paragraph footnote content onto one line", () => {
    const markdown = htmlToMarkdown(footnoteHtml('<p>First paragraph?</p><p>Second <a href="https://example.com/y">link</a>.</p>'));
    expect(markdown).toContain("[^a1]: First paragraph? Second [link](https://example.com/y).");
  });

  it("writes literal brackets inside footnote content bare", () => {
    const markdown = htmlToMarkdown(footnoteHtml('<p>As quoted [sic] there.</p>'));
    expect(markdown).toContain("[^a1]: As quoted [sic] there.");
  });

  it("emits an empty definition for an empty footnote", () => {
    const markdown = htmlToMarkdown(footnoteHtml('<p></p>'));
    expect(markdown).toContain("[^a1]:");
    expect(markdown).not.toContain("fnrefa1");
  });
});
