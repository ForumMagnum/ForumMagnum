import { debugParseCrossSitePreview } from "../server/resolvers/linkPreviewResolver";

function mockHtmlFetch(finalUrl: string, html: string) {
  const response = new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
  Object.defineProperty(response, "url", { value: finalUrl });
  return jest.spyOn(global, "fetch").mockResolvedValue(response);
}

describe("linkPreviewResolver", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports the final URL when a shortener redirects back onsite", async () => {
    mockHtmlFetch("https://www.lesswrong.com/posts/abc123/test-post", `
      <html>
        <head>
          <meta property="og:title" content="Redirected LW post">
          <meta property="og:description" content="A LessWrong post behind a short link.">
        </head>
      </html>
    `);

    const result = await debugParseCrossSitePreview("https://t.co/short");

    expect(result).toMatchObject({
      url: "https://t.co/short",
      redirectedUrl: "https://www.lesswrong.com/posts/abc123/test-post",
      title: "Redirected LW post",
    });
  });

  it("omits redirectedUrl when the fetched URL is unchanged", async () => {
    mockHtmlFetch("https://example.com/article", `
      <html>
        <head>
          <meta property="og:title" content="Example article">
          <meta property="og:description" content="An ordinary offsite preview.">
        </head>
      </html>
    `);

    const result = await debugParseCrossSitePreview("https://example.com/article");

    expect(result.redirectedUrl).toBeNull();
    expect(result.title).toBe("Example article");
  });
});
