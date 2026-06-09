import { debugParseCrossSitePreview, normalizePreviewUrl } from "@/server/resolvers/linkPreviewResolver";

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

  it("fetches the x.com equivalent when parsing a nitter.net preview", async () => {
    const originalFetch = global.fetch;
    const requestedUrls: string[] = [];

    global.fetch = async (input) => {
      requestedUrls.push(input instanceof Request ? input.url : input.toString());
      return new Response(
        "<html><head><title>Tweet preview</title></head><body></body></html>",
        {
          status: 200,
          headers: { "content-type": "text/html" },
        }
      );
    };

    try {
      await debugParseCrossSitePreview("https://nitter.net/g_leech_/status/1974165458283860198");
    } finally {
      global.fetch = originalFetch;
    }

    expect(requestedUrls).toEqual(["https://x.com/g_leech_/status/1974165458283860198"]);
  });
});
