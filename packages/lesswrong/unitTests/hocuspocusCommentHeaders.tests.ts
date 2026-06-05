import { readUtf8WebhookHeader } from "../../../app/hocuspocusWebhook/commentHeaders";

describe("Hocuspocus comment webhook headers", () => {
  it("decodes UTF-8 base64 header values", () => {
    const comment = "This scales ∝ sample size and uses an em dash — safely.";
    const headers = new Headers({
      "X-Hocuspocus-Comment-Content-Base64": Buffer.from(comment, "utf8").toString("base64"),
    });

    expect(readUtf8WebhookHeader(headers, "x-hocuspocus-comment-content")).toBe(comment);
  });

  it("falls back to legacy plain headers", () => {
    const headers = new Headers({
      "X-Hocuspocus-Comment-Content": "Plain ASCII comment",
    });

    expect(readUtf8WebhookHeader(headers, "x-hocuspocus-comment-content")).toBe("Plain ASCII comment");
  });

  it("avoids the raw-header failure for mathematical Unicode", () => {
    const comment = "The result is ∝ x.";
    expect(() => new Headers({ "X-Hocuspocus-Comment-Content": comment })).toThrow(
      /ByteString/,
    );

    const headers = new Headers({
      "X-Hocuspocus-Comment-Content-Base64": Buffer.from(comment, "utf8").toString("base64"),
    });

    expect(readUtf8WebhookHeader(headers, "x-hocuspocus-comment-content")).toBe(comment);
  });
});
