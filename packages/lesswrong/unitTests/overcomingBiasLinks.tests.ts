import { normalizeObUrl, replacementUrl, transformContents, type StoredRevision } from "@/scripts/overcomingBiasLinks/content";
import { planRevisionEdits } from "@/scripts/overcomingBiasLinks/rewrite";
import { canonicalLwTarget, findArchivedRedirect, parseCaptures, resolveOvercomingBiasLinks, unwrapArchiveUrl } from "@/scripts/overcomingBiasLinks/resolve";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Posts from "@/server/collections/posts/collection";

jest.mock("@/server/collections/posts/collection", () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock("@/server/collections/comments/collection", () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock("@/lib/utils/asyncUtils", () => ({ sleep: jest.fn() }));
jest.mock("@/server/pingbacks", () => ({ htmlToPingbacks: jest.fn() }));

const source = "http://www.overcomingbias.com/2007/07/making-beliefs-.html";
const legacy = "http://lesswrong.com/lw/i3/making_beliefs_pay_rent_in_anticipated_experiences/";
const target = "https://www.lesswrong.com/posts/a7n8GdKiAZRX86T5A/making-beliefs-pay-rent-in-anticipated-experiences";
const replacements = new Map([[source, target]]);
const html = `<p><a href="${source}">Making beliefs pay rent</a></p>`;

function makeRevision(overrides: Partial<StoredRevision> = {}): StoredRevision {
  return {
    _id: "published", schemaVersion: 1, createdAt: new Date("2020-01-01"), editedAt: new Date("2020-01-01"),
    collectionName: "Posts", documentId: "post", fieldName: "contents", draft: false,
    html, originalContents: { type: "html", data: html }, version: "1.0.0", updateType: "initial",
    userId: "author", wordCount: 5, commitMessage: null, changeMetrics: null, skipAttributions: false,
    autosaveTimeoutStart: null, googleDocMetadata: null, legacyData: null,
    afBaseScore: 0, afExtendedScore: null, afVoteCount: 0, baseScore: 0, extendedScore: null, score: 0, voteCount: 0,
    ...overrides,
  };
}

describe("Overcoming Bias content repair", () => {
  it("deduplicates scheme, www and fragment variants without merging distinct queries or domains", () => {
    expect(normalizeObUrl(source.replace("http://www.", "https://") + "#section")).toBe(source);
    expect(normalizeObUrl(source + "?x=1")).toBe(source + "?x=1");
    expect(normalizeObUrl(source.replace("overcomingbias.com", "overcomingbias.com.evil.test"))).toBeNull();
    expect(normalizeObUrl("ftp://www.overcomingbias.com/a")).toBeNull();
    expect(replacementUrl(source + "#section", replacements)).toBe(target + "#section");
  });

  it.each(["html", "ckEditorMarkup"])("rewrites %s source and rendered anchors, preserving non-link URLs", type => {
    const data = `${html}<img src="${source}"><code>${source}</code>`;
    const revision = makeRevision({ html: data, originalContents: { type, data } });
    const result = transformContents(revision, replacements);
    expect(result.html).toContain(`href="${target}"`);
    expect(result.html).toContain(`src="${source}"`);
    expect(result.html).toContain(`<code>${source}</code>`);
    expect(result.originalContents?.type).toBe(type);
    expect(result.originalContents?.data).toBe(result.html);
    expect(revision.originalContents?.data).toBe(data);
    expect(transformContents(result, replacements).changed).toBe(false);
  });

  it("handles entity-escaped HTML and leaves unresolved URLs byte-for-byte unchanged", () => {
    const data = `<a href="${source}?a=1&amp;b=2#foo">link</a>`;
    expect(transformContents({ html: data, originalContents: null }).urls).toEqual([source + "?a=1&b=2"]);
    expect(transformContents({ html: data, originalContents: null }, replacements).html).toBe(data);
  });

  it.each([false, true])("rewrites DraftJS object/string data (serialized=%s) without changing text offsets", serialized => {
    const draft = {
      blocks: [{ key: "a", text: "Rent", entityRanges: [{ key: 0, offset: 0, length: 4 }] }],
      entityMap: {
        0: { type: "LINK", mutability: "MUTABLE", data: { url: source, href: source, custom: "keep" } },
        1: { type: "IMAGE", data: { src: source } },
      },
    };
    const revision = makeRevision({ originalContents: { type: "draftJS", data: serialized ? JSON.stringify(draft) : draft } });
    const result = transformContents(revision, replacements);
    const data = result.originalContents?.data;
    const rewritten = typeof data === "string" ? JSON.parse(data) : data;
    expect(rewritten).toEqual({
      ...draft,
      entityMap: { ...draft.entityMap, 0: { ...draft.entityMap[0], data: { url: target, href: target, custom: "keep" } } },
    });
    expect(draft.entityMap[0].data.url).toBe(source);
  });

  it("fails closed for unknown editors rather than leaving stale editable source", () => {
    expect(() => transformContents(makeRevision({ originalContents: { type: "lexical", data: "{}" } }), replacements)).toThrow("Unsupported");
  });

  it("rewrites anchors embedded in DraftJS atomic HTML", () => {
    const data = { blocks: [{ type: "atomic", data: { mathjax: true, html } }], entityMap: {} };
    const result = transformContents(makeRevision({ originalContents: { type: "draftJS", data } }), replacements);
    expect(result.originalContents?.data).toEqual({
      blocks: [{ type: "atomic", data: { mathjax: true, html: html.replace(source, target) } }], entityMap: {},
    });
    expect(data.blocks[0].data.html).toBe(html);
  });

  it("does not create edits for empty content", () => {
    expect(transformContents({ html: null, originalContents: null }, replacements).changed).toBe(false);
  });

  it("does not create a revision for a fragment-only link excluded by a date/title mapping", () => {
    const data = `<a href="${source}#comment-123">comment</a>`;
    const revision = makeRevision({ html: data, originalContents: { type: "html", data } });
    expect(planRevisionEdits(revision, revision, replacements, new Date(), new Set([source]))).toEqual([]);
  });

  it("repairs published content and preserves an unrelated newer draft as the latest revision", () => {
    const active = makeRevision();
    const draftHtml = "<p>Unpublished changes with no old links</p>";
    const draft = makeRevision({ _id: "draft", draft: true, version: "1.1.0", editedAt: new Date("2021-01-01"), html: draftHtml, originalContents: { type: "ckEditorMarkup", data: draftHtml } });
    const edits = planRevisionEdits(active, draft, replacements);
    expect(edits).toHaveLength(2);
    expect(edits[0].revision.html).toContain(target);
    expect(edits[0].revision.draft).toBe(false);
    expect(edits[0].updatePointer).toBe(true);
    expect(edits[1].revision.html).toBe(draftHtml);
    expect(edits[1].revision.draft).toBe(true);
    expect(edits[1].updatePointer).toBe(false);
    expect(edits[1].revision.editedAt.getTime()).toBeGreaterThan(edits[0].revision.editedAt.getTime());
    expect(planRevisionEdits(edits[0].revision, edits[1].revision, replacements)).toEqual([]);
  });

  it("repairs a draft-only link without changing the published pointer", () => {
    const active = makeRevision({ html: "<p>Published</p>", originalContents: { type: "html", data: "<p>Published</p>" } });
    const draft = makeRevision({ _id: "draft", draft: true });
    const edits = planRevisionEdits(active, draft, replacements);
    expect(edits).toHaveLength(1);
    expect(edits[0].updatePointer).toBe(false);
    expect(edits[0].revision.draft).toBe(true);
  });

  it("keeps never-published content draft and rejects inconsistent published pointers", () => {
    const draft = makeRevision({ draft: true, version: "0.1.0" });
    expect(planRevisionEdits(draft, draft, replacements)[0].revision.draft).toBe(true);
    expect(() => planRevisionEdits(makeRevision(), makeRevision({ _id: "unexpected" }), replacements)).toThrow("disagrees");
  });
});

describe("Overcoming Bias archive lookup", () => {
  it("validates CDX output and prefers captures near the known 2022 redirects", () => {
    expect(parseCaptures([["timestamp", "original"], ["20100101000000", source], ["20220701000000", source]])[0].timestamp).toBe("20220701000000");
    expect(() => parseCaptures([["error"]])).toThrow();
    expect(unwrapArchiveUrl(`https://web.archive.org/web/20220701000000id_/${legacy}`)).toBe(legacy);
    expect(unwrapArchiveUrl(`https://evil.test/web/20220701000000/${legacy}`)).toContain("evil.test");
  });

  it("resolves the supplied legacy link through LW's base36 ID mapping", async () => {
    jest.spyOn(Posts, "findOne").mockResolvedValueOnce({ _id: "a7n8GdKiAZRX86T5A", slug: "making-beliefs-pay-rent-in-anticipated-experiences" });
    expect(await canonicalLwTarget(legacy)).toBe(target);
    expect(Posts.findOne).toHaveBeenCalledWith({ legacyId: "651" });
    await expect(canonicalLwTarget("https://lesswrong.com.evil.test/lw/i3/foo/")).rejects.toThrow();
  });

  it("filters archived redirect targets, tries another capture on errors, and never requests the live target", async () => {
    jest.spyOn(Posts, "findOne").mockResolvedValueOnce({ _id: "a7n8GdKiAZRX86T5A", slug: "making-beliefs-pay-rent-in-anticipated-experiences" });
    const request = jest.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify([
        ["timestamp", "original"], ["20221201000000", source], ["20221101000000", source], ["20221001000000", source],
      ]) })
      .mockResolvedValueOnce({ status: 404, headers: { get: () => null } })
      .mockResolvedValueOnce({ status: 301, headers: { get: () => "https://example.com/unrelated" } })
      .mockResolvedValueOnce({ status: 301, headers: { get: () => legacy } });
    const result = await findArchivedRedirect(source, 0, request);
    expect(result.target).toBe(target);
    expect(result.archivedTarget).toBe(legacy);
    expect(result.snapshot).toContain("20221001000000id_");
    expect(request).toHaveBeenCalledTimes(4);
    expect(new URL(request.mock.calls[0][0]).searchParams.get("filter")).toBe("statuscode:301");
    for (const [url] of request.mock.calls) expect(new URL(url).hostname).toBe("web.archive.org");
  });

  it("does not treat a failed replay as a permanent missing mapping", async () => {
    const request = jest.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify([["timestamp", "original"], ["20221201000000", source]]) })
      .mockResolvedValueOnce({ status: 503, headers: { get: () => null } });
    await expect(findArchivedRedirect(source, 0, request)).rejects.toThrow("503");
  });

  it("reports lookup phases and bounds capture attempts without marking unchecked captures not-found", async () => {
    const onProgress = jest.fn();
    const request = jest.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify([
        ["timestamp", "original"], ["20221201000000", source], ["20221101000000", source],
      ]) })
      .mockResolvedValueOnce({ status: 301, headers: { get: () => "https://example.com/unrelated" } });
    await expect(findArchivedRedirect(source, 0, request, { maxCaptures: 1, onProgress })).rejects.toThrow("Capture limit reached");
    expect(request).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenCalledWith("Querying CDX for archived redirects");
    expect(onProgress).toHaveBeenCalledWith("Found 2 captures; checking at most 1");
    expect(onProgress).toHaveBeenCalledWith("Capture 1/2: 20221201000000");
  });

  it("recognizes an archived HTTP 200 page without claiming a redirect to LW", async () => {
    const request = jest.fn()
      .mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify([["timestamp", "original"], ["20221201000000", source]]) })
      .mockResolvedValueOnce({ status: 200, headers: { get: (name: string) => name === "x-archive-orig-date" ? "Thu, 01 Dec 2022 00:00:00 GMT" : null } });
    expect(await findArchivedRedirect(source, 0, request)).toEqual({ source, status: "not-found" });
  });

  it("ends the lookup when its time budget expires before another capture", async () => {
    const now = jest.spyOn(Date, "now").mockReturnValueOnce(0).mockReturnValue(10);
    try {
      const request = jest.fn().mockResolvedValueOnce({ ok: true, text: async () => JSON.stringify([["timestamp", "original"], ["20221201000000", source]]) });
      await expect(findArchivedRedirect(source, 0, request, { urlTimeoutMs: 1 })).rejects.toThrow("Per-URL time limit reached");
      expect(request).toHaveBeenCalledTimes(1);
    } finally {
      now.mockRestore();
    }
  });

  it("resumes with previous errors skipped on request and preserves existing checkpoint entries", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ob-progress-test-"));
    const inventoryPath = join(directory, "inventory.json");
    const outputPath = join(directory, "targets.json");
    const saved = [
      { source, status: "resolved", target },
      { source: `${source}?a=1`, status: "error", error: "Archive returned HTTP 429" },
      { source: `${source}?a=2`, status: "not-found" },
    ];
    const log = jest.spyOn(console, "log").mockImplementation(() => {});
    try {
      await writeFile(inventoryPath, JSON.stringify({ urls: saved.map(result => result.source), documents: [] }));
      await writeFile(outputPath, JSON.stringify(saved));
      expect(await resolveOvercomingBiasLinks(inventoryPath, outputPath, { retryErrors: false })).toEqual(saved);
      expect(await readFile(outputPath, "utf8")).toBe(JSON.stringify(saved));
      expect(log).toHaveBeenCalledWith(expect.stringContaining("3 checkpoint entries skipped; 0 queued"));
      expect(log).toHaveBeenCalledWith(expect.stringContaining('"resolved":1,"not-found":1,"error":1,"unprocessed":0'));
    } finally {
      log.mockRestore();
      await rm(directory, { recursive: true });
    }
  });
});
