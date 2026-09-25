const mockCaptureException = jest.fn();
jest.mock("@/lib/sentryWrapper", () => ({ captureException: (...args: unknown[]) => mockCaptureException(...args) }));
const mockLoadRevisions = jest.fn();
jest.mock("@/server/vulcan-lib/apollo-server/context", () => ({
  computeContextFromUser: () => ({ Revisions: { find: () => ({ fetch: () => mockLoadRevisions() }) } }),
}));
const mockGenerateText = jest.fn();
const mockInsert = jest.fn();
const mockFindOne = jest.fn();
jest.mock("@/server/aiDigest/aiDigestModelCalls", () => ({ aiDigestGatewayProviderOptions: () => ({}) }));
jest.mock("ai", () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
  Output: { object: jest.fn() },
}));
jest.mock("@/server/collections/postSummaries/collection", () => ({
  __esModule: true,
  default: {
    collectionName: "PostSummaries",
    find: () => ({ fetch: async () => [] }),
    rawInsert: (...args: unknown[]) => mockInsert(...args),
    findOne: (...args: unknown[]) => mockFindOne(...args),
  },
}));
import { ensureAiDigestPostSummaries } from "@/server/aiDigest/aiDigestPostSummaries";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

const candidate = { postId: "post", revisionId: "revision", title: "Post", author: "Author" };

describe("summary cache insert races", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGenerateText.mockResolvedValue({ output: { summary: "A sufficiently long generated summary explaining the post's argument." } });
  });
  async function generate() {
    const context = computeContextFromUser({ user: null, isSSR: false });
    mockLoadRevisions.mockResolvedValue([
      { _id: "revision", html: `<p>${"Some meaningful post content. ".repeat(20)}</p>` },
    ]);
    return await ensureAiDigestPostSummaries({ candidates: [candidate], context, modelId: "model", promptVersion: "version" });
  }

  it("uses the winning summary after a concurrent insert", async () => {
    mockInsert.mockRejectedValue({ code: "23505" });
    mockFindOne.mockResolvedValue({ postId: "post", revisionId: "revision", modelId: "model", promptVersion: "version", summary: "The cached winner" });
    const result = await generate();
    expect(result[0].summary).toBe("The cached winner");
    expect(mockFindOne).toHaveBeenCalledWith({ postId: "post", revisionId: "revision", modelId: "model", promptVersion: "version" });
  });
  it("propagates unrelated database failures", async () => {
    const error = new Error("connection lost");
    mockInsert.mockRejectedValue(error);
    await expect(generate()).rejects.toBe(error);
    expect(mockFindOne).not.toHaveBeenCalled();
  });
  it("propagates a uniqueness failure if no matching cache entry exists", async () => {
    const error = { code: "23505" };
    mockInsert.mockRejectedValue(error);
    mockFindOne.mockResolvedValue(null);
    await expect(generate()).rejects.toBe(error);
  });
});

it("reports summary provider failures without logging request content", async () => {
  jest.resetAllMocks();
  mockLoadRevisions.mockResolvedValue([{ _id: "revision", html: `<p>${"Content. ".repeat(50)}</p>` }]);
  mockGenerateText.mockRejectedValue(new Error("private request body"));
  const result = await ensureAiDigestPostSummaries({
    candidates: [candidate], context: computeContextFromUser({ user: null, isSSR: false }),
  });
  expect(result).toEqual([]);
  expect(mockInsert).not.toHaveBeenCalled();
  expect(mockCaptureException).toHaveBeenCalledWith(new Error("AI digest summary generation failed"), {
    extra: expect.objectContaining({ postId: "post", revisionId: "revision" }),
  });
});
