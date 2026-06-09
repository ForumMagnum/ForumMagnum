import { normalizePreviewUrl } from "@/server/resolvers/linkPreviewResolver";

describe("normalizePreviewUrl", () => {
  it("canonicalizes nitter.net tweet URLs to x.com for preview fetching", () => {
    expect(normalizePreviewUrl("https://nitter.net/g_leech_/status/1974165458283860198")).toBe(
      "https://x.com/g_leech_/status/1974165458283860198"
    );
  });

  it("preserves nitter path/query while stripping hash fragments", () => {
    expect(normalizePreviewUrl(
      "http://www.nitter.net/g_leech_/status/1974165458283860198?foo=bar#thread"
    )).toBe("https://x.com/g_leech_/status/1974165458283860198?foo=bar");
  });

  it("keeps ordinary offsite URLs on their own host", () => {
    expect(normalizePreviewUrl("https://example.com/some/path#heading")).toBe(
      "https://example.com/some/path"
    );
  });
});
