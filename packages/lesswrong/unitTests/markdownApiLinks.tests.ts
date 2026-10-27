import { linkToMarkdownApiLink, makeMarkdownLinksAbsolute, rewritePostLinksForAgentMarkdown } from "@/server/markdownApi/markdownLinks";
import { getSiteUrl } from "@/lib/vulcan-lib/utils";

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

describe("makeMarkdownLinksAbsolute", () => {
  it("makes root-relative links absolute without rewriting them to API links", () => {
    const markdown = [
      "See [a post](/posts/grgb2ipxQf2wzNDEG/some-slug) and [a user](</users/someone>).",
      "Also [abs](https://www.lesswrong.com/posts/grgb2ipxQf2wzNDEG/), [offsite](https://example.com/x),",
      "[a footnote](#fn1) and [protocol-relative](//example.com/y).",
      "",
      "[ref]: /w/some-tag",
    ].join("\n");
    const result = makeMarkdownLinksAbsolute(markdown, "LessWrong");
    const siteUrl = getSiteUrl("LessWrong");
    expect(result).toContain(`[a post](${siteUrl}posts/grgb2ipxQf2wzNDEG/some-slug)`);
    expect(result).toContain(`[a user](<${siteUrl}users/someone>)`);
    expect(result).toContain("[abs](https://www.lesswrong.com/posts/grgb2ipxQf2wzNDEG/)");
    expect(result).toContain("[offsite](https://example.com/x)");
    expect(result).toContain("[a footnote](#fn1)");
    expect(result).toContain("[protocol-relative](//example.com/y)");
    expect(result).toContain(`[ref]: ${siteUrl}w/some-tag`);
    expect(result).not.toContain("/api/");
  });
});
