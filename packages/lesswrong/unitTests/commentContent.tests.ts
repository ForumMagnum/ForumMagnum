import { markdownCommentToSafeHtml } from "@/components/lexical/commenting/commentContent";

describe("markdownCommentToSafeHtml", () => {
  it("renders markdown emphasis in draft comments", () => {
    const html = markdownCommentToSafeHtml("This is **bold** and *italic*.");

    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("does not allow raw script tags", () => {
    const html = markdownCommentToSafeHtml("<script>alert('xss')</script>");

    expect(html).not.toContain("<script");
  });
});
