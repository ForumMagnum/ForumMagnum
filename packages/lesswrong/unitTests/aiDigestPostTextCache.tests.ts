import { ensureAiDigestPostTextCache } from "@/server/aiDigest/aiDigestPostTextCache";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

const mockPosts = jest.fn();
const mockRevisions = jest.fn();
jest.mock("@/server/vulcan-lib/apollo-server/context", () => ({
  computeContextFromUser: () => ({
    Posts: { find: (...args: unknown[]) => ({ fetch: () => mockPosts(...args) }) },
    Revisions: { find: (...args: unknown[]) => ({ fetch: () => mockRevisions(...args) }) },
  }),
}));

it("generates cached text from the selected revision even after the post is edited", async () => {
  mockPosts.mockResolvedValue([{ _id: "post", contents_latest: "new-revision" }]);
  mockRevisions.mockResolvedValue([{ _id: "selected-revision", html: "<p>Original body</p>" }]);
  const target = { postId: "post", revisionId: "selected-revision" };
  const record = { ...target, modelId: "model", promptVersion: "version" };
  const generateAndSave = jest.fn().mockResolvedValue(record);
  const result = await ensureAiDigestPostTextCache({
    targets: [target], collection: { find: () => ({ fetch: async () => [] }) },
    context: computeContextFromUser({ user: null, isSSR: false }),
    modelId: "model", promptVersion: "version", concurrency: 1, generateAndSave,
  });
  expect(mockPosts).not.toHaveBeenCalled();
  expect(mockRevisions).toHaveBeenCalledWith(
    { _id: { $in: ["selected-revision"] } }, {}, { _id: 1, html: 1 },
  );
  expect(generateAndSave).toHaveBeenCalledWith(target, "<p>Original body</p>", "model", "version");
  expect(result.records).toEqual([record]);
});
