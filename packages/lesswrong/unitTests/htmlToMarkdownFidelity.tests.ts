import { htmlToMarkdown } from "@/server/editor/conversionUtils";
import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
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

describe("htmlToMarkdown literal brackets", () => {
  // `\[…\]` is display-math syntax in the agent markdown dialect, so escaped
  // literal brackets came back as equations when an agent re-inserted text
  // copied from the markdown view.
  it("leaves balanced literal brackets unescaped", () => {
    const markdown = htmlToMarkdown("<blockquote><p>He said [...] and then [sic] left.</p></blockquote>");
    expect(markdown).toBe("> He said [...] and then [sic] left.");
  });

  it("round-trips literal brackets through the agent markdown dialect as text", () => {
    const markdown = htmlToMarkdown("<p>He said [...] and then [left].</p>");
    const html = renderAgentMarkdownToHtml(getMarkdownItForAgentPosts(), markdown);
    expect(html).not.toContain("math-tex");
    expect(html).toContain("He said [...] and then [left].");
  });

  it("keeps escaping brackets that would form link or footnote syntax", () => {
    expect(htmlToMarkdown("<p>Literal [text](url) here</p>")).toBe("Literal \\[text\\](url) here");
    expect(htmlToMarkdown("<p>Literal [a][b] here</p>")).toBe("Literal \\[a\\][b] here");
    expect(htmlToMarkdown("<p>[term]: definition</p>")).toBe("\\[term\\]: definition");
    expect(htmlToMarkdown("<p>Literal [^1] here</p>")).toBe("Literal \\[^1\\] here");
  });

  it("keeps escaping unbalanced brackets and a closer at the end of a text node", () => {
    expect(htmlToMarkdown("<p>Open [ only</p>")).toBe("Open \\[ only");
    expect(htmlToMarkdown("<p>Ends [here]</p>")).toBe("Ends \\[here\\]");
  });

  it("leaves balanced brackets inside link text unescaped without breaking the link", () => {
    const markdown = htmlToMarkdown('<p>See <a href="https://example.com">the [draft] notes</a>.</p>');
    expect(markdown).toBe("See [the [draft] notes](https://example.com).");
    const html = renderAgentMarkdownToHtml(getMarkdownItForAgentPosts(), markdown);
    expect(html).toContain('<a href="https://example.com">the [draft] notes</a>');
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

  it("emits an empty definition for an empty footnote", () => {
    const markdown = htmlToMarkdown(footnoteHtml('<p></p>'));
    expect(markdown).toContain("[^a1]:");
    expect(markdown).not.toContain("fnrefa1");
  });
});
