import { sanitize } from "@/lib/utils/sanitize";

const previewSpan = (body: string) =>
  `<span class="hoverPreview" data-hover-preview="${body}">anchor</span>`;

/** As it appears in stored html: the body is escaped inside the attribute. */
function previewBodyOf(html: string): string {
  return /data-hover-preview="([^"]*)"/.exec(html)?.[1] ?? "";
}

describe("sanitize, on hover preview bodies", () => {
  it("strips script and event handlers from the preview body", () => {
    const hostile = "&lt;p&gt;hi&lt;/p&gt;&lt;script&gt;alert(1)&lt;/script&gt;&lt;img src=x onerror=alert(2)&gt;";
    const body = previewBodyOf(sanitize(previewSpan(hostile)));

    expect(body).not.toMatch(/script/i);
    expect(body).not.toMatch(/onerror/i);
    expect(body).toContain("hi");
  });

  it("keeps the formatting a preview is allowed to use", () => {
    const body = previewBodyOf(sanitize(previewSpan("&lt;p&gt;&lt;em&gt;why&lt;/em&gt; it matters&lt;/p&gt;")));
    expect(body).toContain("em&gt;");
    expect(body).toContain("why");
  });

  it("leaves spans without a preview alone", () => {
    const html = sanitize('<span class="math-tex">x</span>');
    expect(html).toContain('class="math-tex"');
  });

  it("terminates on absurdly nested previews rather than recursing forever", () => {
    let nested = "&lt;p&gt;deep&lt;/p&gt;";
    for (let i = 0; i < 12; i++) {
      nested = `&amp;lt;span data-hover-preview=&amp;quot;${nested}&amp;quot;&amp;gt;x&amp;lt;/span&amp;gt;`;
    }
    expect(() => sanitize(previewSpan(nested))).not.toThrow();
  });
});
