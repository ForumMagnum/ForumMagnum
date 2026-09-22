const mockCaptureException = jest.fn();
const mockGenerateText = jest.fn();
const mockInsert = jest.fn();
jest.mock("@/lib/sentryWrapper", () => ({ captureException: (...args: unknown[]) => mockCaptureException(...args) }));
jest.mock("@/server/vulcan-lib/apollo-server/context", () => ({ computeContextFromUser: () => ({}) }));
jest.mock("@/server/aiDigest/aiDigestPostLookups", () => ({
  loadAiDigestRevisionBodies: async () => [{ postId: "post", revisionHtml: "<p>Meaningful content for the preview.</p>" }],
}));
jest.mock("@/server/aiDigest/aiDigestSelectionShared", () => ({ aiDigestGatewayProviderOptions: () => ({}) }));
jest.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args), Output: { object: jest.fn() },
}));
jest.mock("@/server/collections/postPreviews/collection", () => ({
  __esModule: true,
  default: { find: () => ({ fetch: async () => [] }), rawInsert: (...args: unknown[]) => mockInsert(...args) },
}));
import { ensureAiDigestPostPreviews } from "@/server/aiDigest/aiDigestPostPreviews";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

async function generate() {
  return await ensureAiDigestPostPreviews({
    targets: [{ postId: "post", revisionId: "revision", title: "Post", author: "Author" }],
    context: computeContextFromUser({ user: null, isSSR: false }),
  });
}

beforeEach(() => {
  jest.resetAllMocks();
  mockGenerateText.mockResolvedValue({ output: { startBlockIndex: 0 } });
});

it("reports provider failure without exposing the request and keeps the excerpt fallback", async () => {
  mockGenerateText.mockRejectedValue(new Error("private request body"));
  const result = await generate();
  expect(result.previewHtmlByPostId.size).toBe(0);
  expect(mockCaptureException).toHaveBeenCalledWith(new Error("AI digest preview generation failed"), {
    extra: expect.objectContaining({ postId: "post", revisionId: "revision" }),
  });
  expect(mockInsert).not.toHaveBeenCalled();
});

it("reports a persistence failure while retaining the excerpt fallback", async () => {
  mockInsert.mockRejectedValue(new Error("connection lost"));
  const result = await generate();
  expect(result.previewHtmlByPostId.size).toBe(0);
  expect(mockCaptureException).toHaveBeenCalledWith(new Error("AI digest preview persistence failed"), {
    extra: expect.objectContaining({ postId: "post", revisionId: "revision" }),
  });
});

it("does not report an expected concurrent cache insert as an infrastructure failure", async () => {
  mockInsert.mockRejectedValue({ code: "23505" });
  const result = await generate();
  expect(result.previewHtmlByPostId.size).toBe(0);
  expect(mockCaptureException).not.toHaveBeenCalled();
});
