import markdownIt from "markdown-it";
import { markdownLinkifyEscapes } from "@/lib/utils/markdownLinkifyEscapes";
import { getMarkdownIt } from "@/lib/utils/markdownItPlugins";

function render(markdown: string): string {
  const md = markdownIt({ linkify: true });
  md.use(markdownLinkifyEscapes);
  return md.render(markdown).trim();
}

describe("markdownLinkifyEscapes plugin", () => {
  it("resolves escaped underscores in a bare URL", () => {
    expect(render("https://en.wikipedia.org/wiki/Foo\\_bar\\_baz")).toBe(
      '<p><a href="https://en.wikipedia.org/wiki/Foo_bar_baz">https://en.wikipedia.org/wiki/Foo_bar_baz</a></p>'
    );
  });

  it("resolves other escaped punctuation in a bare URL", () => {
    expect(render("https://example.com/a\\*b\\(c\\)")).toBe(
      '<p><a href="https://example.com/a*b(c)">https://example.com/a*b(c)</a></p>'
    );
  });

  it("keeps percent-encoding in a bare URL with escapes", () => {
    expect(render("See https://en.wikipedia.org/wiki/Bayes%27\\_theorem.")).toBe(
      '<p>See <a href="https://en.wikipedia.org/wiki/Bayes%27_theorem">https://en.wikipedia.org/wiki/Bayes\'_theorem</a>.</p>'
    );
  });

  it("keeps an escaped backslash in a bare URL as a backslash", () => {
    expect(render("https://example.com/a\\\\b")).toBe(
      '<p><a href="https://example.com/a%5Cb">https://example.com/a\\b</a></p>'
    );
  });

  it("leaves an escape after the end of a bare URL out of the link", () => {
    expect(render("https://example.com/foo\\.")).toBe(
      '<p><a href="https://example.com/foo">https://example.com/foo</a>.</p>'
    );
    expect(render("*https://example.com/foo\\**")).toBe(
      '<p><em><a href="https://example.com/foo">https://example.com/foo</a>*</em></p>'
    );
  });

  it("resolves escapes in a fuzzy link", () => {
    expect(render("www.example.com/foo\\_bar")).toBe(
      '<p><a href="http://www.example.com/foo_bar">www.example.com/foo_bar</a></p>'
    );
  });

  it("doesn't treat emphasis markers inside an unescaped bare URL as emphasis", () => {
    expect(render("http://example.org/foo._bar_-_baz")).toBe(
      '<p><a href="http://example.org/foo._bar_-_baz">http://example.org/foo._bar_-_baz</a></p>'
    );
  });

  it("doesn't linkify a URL inside a link's label", () => {
    expect(render("[https://a.example.com/x\\_y](https://b.example.com)")).toBe(
      '<p><a href="https://b.example.com">https://a.example.com/x_y</a></p>'
    );
  });

  it("is applied to the reader markdown-it instance", () => {
    expect(getMarkdownIt().render("https://en.wikipedia.org/wiki/Foo\\_bar").trim()).toBe(
      '<p><a href="https://en.wikipedia.org/wiki/Foo_bar">https://en.wikipedia.org/wiki/Foo_bar</a></p>'
    );
  });
});
