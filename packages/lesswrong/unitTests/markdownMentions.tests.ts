import markdownIt from "markdown-it";
import { markdownMentions } from "@/lib/utils/markdownMentions";
import { getMarkdownIt, getMarkdownItForResearch } from "@/lib/utils/markdownItPlugins";

function render(markdown: string): string {
  const md = markdownIt({ linkify: true });
  md.use(markdownMentions);
  return md.render(markdown).trim();
}

describe("markdownMentions plugin", () => {
  it("renders an inline doc mention as a research-mention span", () => {
    const html = render('Compare to @[doc:abc123 "Zoning notes"] please.');
    expect(html).toContain('class="research-mention"');
    expect(html).toContain('data-mention-kind="doc"');
    expect(html).toContain('data-mention-id="abc123"');
    expect(html).toContain('data-mention-title="Zoning notes"');
    expect(html).toContain(">Zoning notes</span>");
  });

  it("renders an inline conv mention", () => {
    const html = render('See @[conv:def456 "Earlier chat"] for context.');
    expect(html).toContain('data-mention-kind="conv"');
    expect(html).toContain('data-mention-id="def456"');
  });

  it("unescapes embedded quotes and backslashes in titles", () => {
    const html = render('@[doc:x "a \\"quoted\\" \\\\path"]');
    // title attr must be HTML-escaped after unescaping the markdown form
    expect(html).toContain('data-mention-title="a &quot;quoted&quot; \\path"');
  });

  it("does NOT match mentions inside fenced code blocks (structure-aware)", () => {
    const html = render('```\n@[doc:abc "should not be a chip"]\n```');
    expect(html).not.toContain('research-mention');
  });

  it("does NOT match mentions inside inline code spans", () => {
    const html = render('Look at `@[doc:abc "code"]` literally.');
    expect(html).not.toContain('research-mention');
    expect(html).toContain('@[doc:abc &quot;code&quot;]');
  });

  it("ignores malformed tokens (missing quote)", () => {
    const html = render('@[doc:abc no-title-quotes]');
    expect(html).not.toContain('research-mention');
  });

  it("ignores tokens with unknown kind", () => {
    const html = render('@[user:abc "x"]');
    expect(html).not.toContain('research-mention');
  });

  it("matches multiple mentions on the same line", () => {
    const html = render('Compare @[doc:a "A"] vs @[doc:b "B"].');
    const matches = html.match(/research-mention/g) ?? [];
    expect(matches.length).toBe(2);
  });
});

describe("getMarkdownItForResearch / getMarkdownIt surface separation", () => {
  it("research markdown-it renders mentions", () => {
    const html = getMarkdownItForResearch().render('@[doc:abc "Notes"]', { docId: 'test' });
    expect(html).toContain('research-mention');
  });

  it("default (post) markdown-it does NOT render mentions — surface stays clean", () => {
    const html = getMarkdownIt().render('@[doc:abc "Notes"]', { docId: 'test' });
    expect(html).not.toContain('research-mention');
    // Should still appear as plain text — verify it round-trips somewhere.
    expect(html).toContain('@[doc:abc');
  });
});
