import {
  buildAiDigestPostPreviewHtml,
  splitPostHtmlIntoBlocks,
  validateAiDigestPreviewStartBlockIndex,
  type AiDigestPostPreviewBlock,
} from "@/server/aiDigest/aiDigestPostPreviews";

const PREAMBLE_PARAGRAPH = "<p><em>Epistemic status:</em> speculative, written in one sitting.</p>";
const CROSSPOST_PARAGRAPH = "<p>Crossposted from my own blog.</p>";
const FIRST_CONTENT_PARAGRAPH =
  "<p>Newcomb's problem is usually presented as a puzzle about prediction, but the "
  + "interesting part is what it says about how we individuate decisions. Once the "
  + "predictor is stipulated to be reliable, the question of what you can still "
  + "choose stops being a question about causation at all.</p>";
const QUOTED_BLOCK = "<blockquote><p>Rationality is systematized winning.</p></blockquote>";
const CLOSING_PARAGRAPH =
  "<p>So the two-boxer and the one-boxer disagree about the question rather than the "
  + "answer, which is why the argument has survived so many decades of restatement "
  + "without either side conceding anything of substance to the other.</p>";

const POST_HTML = [
  PREAMBLE_PARAGRAPH,
  CROSSPOST_PARAGRAPH,
  FIRST_CONTENT_PARAGRAPH,
  QUOTED_BLOCK,
  CLOSING_PARAGRAPH,
].join("");

function makeBlock(
  text: string,
  tagName = "p",
): AiDigestPostPreviewBlock {
  return { tagName, html: `<${tagName}>${text}</${tagName}>`, text };
}

describe("AI digest post preview block splitting", () => {
  it("splits top-level blocks and keeps each block's html verbatim", () => {
    const blocks = splitPostHtmlIntoBlocks(POST_HTML);
    expect(blocks.map((block) => block.tagName)).toEqual([
      "p",
      "p",
      "p",
      "blockquote",
      "p",
    ]);
    expect(blocks.every((block) => POST_HTML.includes(block.html))).toBe(true);
    expect(blocks[0].text).toBe("Epistemic status: speculative, written in one sitting.");
  });

  it("keeps prose blocks from the cut point and drops everything else", () => {
    const previewHtml = buildAiDigestPostPreviewHtml(splitPostHtmlIntoBlocks(POST_HTML), 2);
    expect(previewHtml).toContain("Newcomb's problem is usually presented");
    expect(previewHtml).toContain("Rationality is systematized winning.");
    expect(previewHtml).not.toContain("Epistemic status");
    expect(previewHtml).not.toContain("Crossposted");
  });

  it("drops a leading table or list the same way as a preamble", () => {
    const html = "<table><tbody><tr><td>Model</td></tr></tbody></table>"
      + "<ul><li>A bullet</li></ul>"
      + "<h2>A heading</h2>"
      + FIRST_CONTENT_PARAGRAPH;
    const previewHtml = buildAiDigestPostPreviewHtml(splitPostHtmlIntoBlocks(html), 0);
    expect(previewHtml).toContain("Newcomb's problem is usually presented");
    expect(previewHtml).not.toContain("<table");
    expect(previewHtml).not.toContain("<ul");
    expect(previewHtml).not.toContain("<h2");
  });

  it("yields no preview when the post has no prose to show", () => {
    const html = "<table><tbody><tr><td>Model</td></tr></tbody></table>";
    expect(buildAiDigestPostPreviewHtml(splitPostHtmlIntoBlocks(html), 0)).toBe(null);
    expect(buildAiDigestPostPreviewHtml([], 0)).toBe(null);
  });
});

describe("AI digest post preview start index validation", () => {
  const blocks = splitPostHtmlIntoBlocks(POST_HTML);

  it("accepts a cut point inside the post", () => {
    expect(validateAiDigestPreviewStartBlockIndex(0, blocks)).toBe(0);
    expect(validateAiDigestPreviewStartBlockIndex(2, blocks)).toBe(2);
  });

  it("rejects an index past the last block", () => {
    expect(() => validateAiDigestPreviewStartBlockIndex(blocks.length, blocks))
      .toThrow("out of range");
  });

  it("rejects a cut point that would swallow most of the post", () => {
    const longPreamble = [makeBlock("x".repeat(1000)), makeBlock("The actual content.")];
    expect(() => validateAiDigestPreviewStartBlockIndex(1, longPreamble))
      .toThrow("skipped 1000 of");
    const shortPreamble = [
      makeBlock("x".repeat(10)),
      makeBlock("y".repeat(1000)),
    ];
    expect(validateAiDigestPreviewStartBlockIndex(1, shortPreamble)).toBe(1);
  });
});
