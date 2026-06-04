import { htmlToMarkdown } from "@/server/editor/conversionUtils";

describe("Turndown rule for research-mention", () => {
  it("converts a doc mention span to the canonical token", () => {
    const html = `<p>See <span class="research-mention" data-mention-kind="doc" data-mention-id="abc123" data-mention-title="Zoning notes">Zoning notes</span> for context.</p>`;
    const md = htmlToMarkdown(html);
    expect(md.trim()).toBe('See @[doc:abc123 "Zoning notes"] for context.');
  });

  it("converts a conv mention span to the canonical token", () => {
    const html = `<p>Compare <span class="research-mention" data-mention-kind="conv" data-mention-id="def456" data-mention-title="Earlier zoning chat">Earlier zoning chat</span>.</p>`;
    const md = htmlToMarkdown(html);
    expect(md.trim()).toBe('Compare @[conv:def456 "Earlier zoning chat"].');
  });

  it("escapes embedded quotes in titles", () => {
    const html = `<p><span class="research-mention" data-mention-kind="doc" data-mention-id="x" data-mention-title='a &quot;quoted&quot; title'>a "quoted" title</span></p>`;
    const md = htmlToMarkdown(html);
    expect(md.trim()).toBe('@[doc:x "a \\"quoted\\" title"]');
  });

  it("drops malformed mention spans (missing kind / id)", () => {
    const html = `<p>Before <span class="research-mention" data-mention-id="x">no kind</span> after.</p>`;
    const md = htmlToMarkdown(html);
    expect(md.trim()).toBe('Before  after.');
  });

  it("does not affect spans without the research-mention class", () => {
    const html = `<p>Plain <span>span</span> text.</p>`;
    const md = htmlToMarkdown(html);
    expect(md.trim()).toBe('Plain span text.');
  });
});
