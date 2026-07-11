import { getMarkdownItForAgentPosts } from "@/lib/utils/markdownItPlugins";
import { getMarkdownImageWarnings, noteWithAgentEditWarnings } from "../../../app/api/agent/imageValidation";

const markdownIt = getMarkdownItForAgentPosts();

describe("agent image validation warnings", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("warns when a markdown image URL returns an error", async () => {
    global.fetch = async () => new Response("", { status: 404 });

    const warnings = await getMarkdownImageWarnings(
      "Before\n\n![diagram](https://example.com/missing.png)\n\nAfter",
      markdownIt,
    );

    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe("image_url_unavailable");
    expect(warnings[0].url).toBe("https://example.com/missing.png");
    expect(warnings[0].message).toContain("HTTP 404");
  });

  it("falls back to GET when HEAD is unsupported", async () => {
    const requestedMethods: string[] = [];
    global.fetch = async (_input, init) => {
      requestedMethods.push(init?.method ?? "GET");
      return requestedMethods.length === 1
        ? new Response("", { status: 405 })
        : new Response("", { status: 200 });
    };

    const warnings = await getMarkdownImageWarnings(
      "![diagram](https://example.com/headless.png)",
      markdownIt,
    );

    expect(warnings).toHaveLength(0);
    expect(requestedMethods).toEqual(["HEAD", "GET"]);
  });

  it("warns without fetching unsupported image URL protocols", async () => {
    let fetchCalled = false;
    global.fetch = async () => {
      fetchCalled = true;
      return new Response("", { status: 200 });
    };

    const warnings = await getMarkdownImageWarnings(
      "![local](file:///tmp/image.png)",
      markdownIt,
    );

    expect(fetchCalled).toBe(false);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe("image_url_invalid");
    expect(warnings[0].message).toContain("unsupported protocol");
  });

  it("limits validation work and reports skipped image URLs", async () => {
    let fetchCount = 0;
    global.fetch = async () => {
      fetchCount++;
      return new Response("", { status: 200 });
    };
    const markdown = Array.from(
      { length: 31 },
      (_unused, index) => `![image ${index}](https://example.com/${index}.png)`,
    ).join("\n\n");

    const warnings = await getMarkdownImageWarnings(markdown, markdownIt);

    expect(fetchCount).toBe(30);
    expect(warnings).toHaveLength(1);
    expect(warnings[0].code).toBe("image_validation_skipped");
    expect(warnings[0].message).toContain("1 additional image URL was not checked");
  });

  it("adds a short warning suffix to response notes", () => {
    const note = noteWithAgentEditWarnings("Inserted markdown block.", [{
      code: "image_url_unavailable",
      url: "https://example.com/missing.png",
      message: "Image failed",
    }]);

    expect(note).toBe("Inserted markdown block. Warning: 1 image-related issue detected; see the warnings field for details.");
  });
});
