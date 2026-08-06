import { getRssPostContents, getRssQuickTakeContents } from "@/server/rss-integration/content";

describe("RSS import content", () => {
  const rssPost = {
    "content:encoded": "<p>Full article</p>",
    description: "<p>Summary</p>",
    summary: "<p>Fallback summary</p>",
  };

  it("uses full feed content only when configured", () => {
    expect(getRssPostContents(rssPost, true)).toBe("<p>Full article</p>");
    expect(getRssPostContents(rssPost, false)).toBe("<p>Summary</p>");
  });

  it("falls back to the feed summary", () => {
    expect(getRssPostContents({ summary: "<p>Summary only</p>" }, false)).toBe("<p>Summary only</p>");
  });

  it("adds an escaped linked title to Quick Takes", () => {
    expect(getRssQuickTakeContents({
      title: "Title <script>",
      link: 'https://example.com/post?value="quoted"',
      description: "<p>Summary</p>",
    }, false)).toBe(
      '<p><strong><a href="https://example.com/post?value=&quot;quoted&quot;">' +
      "Title &lt;script&gt;</a></strong></p>\n<p>Summary</p>"
    );
  });

  it("preserves a Quick Take source link when the title is absent", () => {
    expect(getRssQuickTakeContents({
      link: "https://example.com/post",
      description: "<p>Summary</p>",
    }, false)).toBe(
      '<p><a href="https://example.com/post">https://example.com/post</a></p>\n<p>Summary</p>'
    );
  });
});
