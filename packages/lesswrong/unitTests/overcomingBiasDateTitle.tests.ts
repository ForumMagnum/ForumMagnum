import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { matchDatedObLink, parseDatedObLink, resolveOvercomingBiasLinksByDateAndTitle, type DateTitlePost } from "@/scripts/overcomingBiasLinks/resolveByDateAndTitle";
import { lookupResultSchema, transformContents } from "@/scripts/overcomingBiasLinks/content";

const mockFind = jest.fn();
jest.mock("@/server/collections/posts/collection", () => ({
  __esModule: true, default: { find: (...args: unknown[]) => mockFind(...args) },
}));

const source = "http://www.overcomingbias.com/2007/07/making-beliefs-.html";
const post: DateTitlePost = {
  _id: "a7n8GdKiAZRX86T5A", title: "Making Beliefs Pay Rent (in Anticipated Experiences)",
  slug: "making-beliefs-pay-rent-in-anticipated-experiences", postedAt: new Date("2007-07-28T12:00:00Z"),
};

function match(source: string, posts: DateTitlePost[]) {
  const link = parseDatedObLink(source);
  if (!link) throw new Error("Invalid test URL");
  return matchDatedObLink(link, posts);
}

describe("date/title OB resolver", () => {
  it("uses the month encoded in legacy URLs, and supports explicit day URLs", () => {
    expect(parseDatedObLink(source)).toEqual({ source, month: "2007-07", titleSlug: "making-beliefs-" });
    expect(parseDatedObLink(source.replace("/07/", "/07/28/"))?.day).toBe("2007-07-28");
    expect(match(source.replace("/07/", "/07/27/"), [post]).status).toBe("not-found");
  });

  it.each([
    "http://www.overcomingbias.com/about",
    "http://www.overcomingbias.com/tag/bias",
    "http://www.overcomingbias.com/2007/07/",
    "http://www.overcomingbias.com/2007/13/title.html",
    "http://www.overcomingbias.com/2007/02/30/title.html",
    "http://www.overcomingbias.com/2007/07/picture.jpg",
    "http://www.overcomingbias.com/wp-content/uploads/2007/07/picture.jpg",
    "http://www.overcomingbias.com/2007/07/%ZZ.html",
    source + "?cid=123", source + "#comment-123", source + "?s=search",
    source.replace("overcomingbias.com", "overcomingbias.com.evil.test"),
  ])("excludes non-post or invalid URL %s", url => {
    expect(parseDatedObLink(url)).toBeNull();
  });

  it("resolves the provided example using its 15-character truncated slug", () => {
    const result = match(source, [post]);
    expect(result.status).toBe("resolved");
    expect(result.target).toBe(`https://www.lesswrong.com/posts/${post._id}/${post.slug}`);
    expect(result.candidates[0].postedAt).toBe(post.postedAt.toISOString());
    expect(result.excludeFragments).toBe(true);
    expect(lookupResultSchema.parse(result).excludeFragments).toBe(true);
  });

  it("handles underscore separators and apostrophes removed during truncation", () => {
    const candidate = { ...post, title: "Archimedes's Chronophone", slug: "archimedes-s-chronophone" };
    expect(match(source.replace("making-beliefs-", "archimedess_chr"), [candidate]).status).toBe("resolved");
    expect(match(source.replace("making-beliefs-", "making_beliefs_"), [post]).status).toBe("resolved");
  });

  it("accepts exact full titles after punctuation normalization", () => {
    const candidate = { ...post, title: "I Don't Know", slug: "i-don-t-know" };
    expect(match(source.replace("making-beliefs-", "i_dont_know"), [candidate]).status).toBe("resolved");
    expect(match(source.replace("making-beliefs-", "selfdeception_h"), [{ ...post, title: "Self-Deception, Hypocrisy, or Akrasia", slug: "self-deception-hypocrisy-or-akrasia" }]).status).toBe("resolved");
  });

  it("requires the right month and rejects arbitrary short prefixes", () => {
    expect(match(source, [{ ...post, postedAt: new Date("2007-08-01T00:00:00Z") }]).status).toBe("not-found");
    expect(match(source.replace("making-beliefs-", "making"), [post]).status).toBe("not-found");
  });

  it("leaves ambiguous matches unresolved, even if only one is an exact title", () => {
    const result = match(source, [post, { ...post, _id: "other", title: "Making Beliefs", slug: "making-beliefs" }]);
    expect(result.status).toBe("error");
    expect(result.reason).toBe("ambiguous");
    expect(result.target).toBeUndefined();
    expect(result.candidates).toHaveLength(2);
    expect(match(source, [post, post]).status).toBe("resolved");
  });

  it("leaves original fragment links untouched when using inferred mappings", () => {
    const target = `https://www.lesswrong.com/posts/${post._id}/${post.slug}`;
    const html = `<a href="${source}#comment-123">comment</a><a href="${source}">post</a>`;
    const result = transformContents({ html, originalContents: { type: "html", data: html } }, new Map([[source, target]]), new Set([source]));
    expect(result.html).toContain(`href="${source}#comment-123"`);
    expect(result.html).toContain(`href="${target}"`);
    expect(result.originalContents?.data).toBe(result.html);
  });

  it("queries each month once and writes a new compatible lookup file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ob-date-test-"));
    const inventoryPath = join(directory, "inventory.json");
    const outputPath = join(directory, "matches.json");
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    mockFind.mockReset();
    mockFind.mockReturnValue({ fetch: async () => [post] });
    try {
      await writeFile(inventoryPath, JSON.stringify({ urls: [source, source.replace("making-beliefs-", "unknown-post"), source + "?cid=123"], documents: [] }));
      expect(await resolveOvercomingBiasLinksByDateAndTitle(inventoryPath, outputPath)).toEqual({ resolved: 1, ambiguous: 0, unmatched: 1, excluded: 1 });
      expect(mockFind).toHaveBeenCalledTimes(1);
      expect(mockFind.mock.calls[0][2]).toEqual({ _id: 1, title: 1, slug: 1, postedAt: 1 });
      expect(mockFind.mock.calls[0][0]).toEqual(expect.objectContaining({
        postedAt: { $gte: new Date("2007-07-01T00:00:00Z"), $lt: new Date("2007-08-01T00:00:00Z") },
        draft: false, deletedDraft: false, unlisted: false,
      }));
      const saved = await readFile(outputPath, "utf8");
      expect(lookupResultSchema.array().parse(JSON.parse(saved))).toHaveLength(3);
      await expect(resolveOvercomingBiasLinksByDateAndTitle(inventoryPath, outputPath)).rejects.toThrow("EEXIST");
      expect(await readFile(outputPath, "utf8")).toBe(saved);
    } finally {
      log.mockRestore();
      await rm(directory, { recursive: true });
    }
  });
});
