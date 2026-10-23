import { linkToMarkdownApiLink, rewritePostLinksForAgentMarkdown } from "@/server/markdownApi/markdownLinks";

const context: Pick<ResolverContext, "forumType"> = { forumType: "LessWrong" };

describe("linkToMarkdownApiLink", () => {
  it("leaves malformed links unchanged instead of throwing", () => {
    expect(linkToMarkdownApiLink("https://", "LessWrong")).toBe("https://");
    expect(linkToMarkdownApiLink("http://[invalid", "LessWrong")).toBe("http://[invalid");
  });

  it("leaves offsite links unchanged", () => {
    expect(linkToMarkdownApiLink("https://example.com/foo", "LessWrong")).toBe("https://example.com/foo");
  });
});

describe("rewritePostLinksForAgentMarkdown", () => {
  it("does not fail on a document containing an empty https:// link", async () => {
    const markdown = "See [this](https://) and [that](https://example.com/bar).";
    const result = await rewritePostLinksForAgentMarkdown(markdown, context);
    expect(result).toBe(markdown);
  });
});
