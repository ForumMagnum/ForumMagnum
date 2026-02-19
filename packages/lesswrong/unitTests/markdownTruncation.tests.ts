import { truncateMarkdown } from "@/server/markdownApi/markdownTruncation";

describe("truncateMarkdown", () => {
  it("does not cut inside inline image URLs with parentheses", () => {
    const markdown = [
      "Intro text before an image with parentheses in its URL.",
      "",
      "Here is the image:",
      "![diagram](https://example.com/images/foo(bar(baz)).png)",
      "More text after image.",
    ].join("\n");

    const truncated = truncateMarkdown(markdown, 95);

    expect(truncated).not.toContain("![diagram](https://example.com/images/foo(");
    expect(truncated).not.toMatch(/!\[[^\]]*]\([^)]*$/);
  });

  it("does not cut inside inline links with nested parentheses", () => {
    const markdown = [
      "Read this [reference](https://example.com/path(with(nested))/more) for details.",
      "And more explanatory text after it.",
    ].join(" ");

    const truncated = truncateMarkdown(markdown, 70);

    expect(truncated).not.toMatch(/\[[^\]]*]\([^)]*$/);
  });
});
