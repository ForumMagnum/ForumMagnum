import {
  annotateAiDigestPostCandidates,
  annotateAiDigestQuickTakes,
  loadReaderSubscribedAuthorIds,
  loadReaderSubscribedAuthors,
} from "@/server/aiDigest/aiDigestReaderSignals";

const mockSubscriptions = jest.fn();
const mockUsers = jest.fn();
jest.mock("@/server/collections/subscriptions/collection", () => ({
  __esModule: true,
  default: { find: (...args: unknown[]) => ({ fetch: () => mockSubscriptions(...args) }) },
}));
jest.mock("@/server/collections/users/collection", () => ({
  __esModule: true,
  default: { find: (...args: unknown[]) => ({ fetch: () => mockUsers(...args) }) },
}));
jest.mock("@/server/collections/readStatus/collection", () => ({
  __esModule: true, default: { find: () => ({ fetch: async () => [] }) },
}));
jest.mock("@/server/collections/votes/collection", () => ({
  __esModule: true, default: { find: () => ({ fetch: async () => [] }) },
}));
jest.mock("@/server/collections/ultraFeedEvents/collection", () => ({
  __esModule: true, default: { find: () => ({ fetch: async () => [] }) },
}));

beforeEach(() => jest.resetAllMocks());

it("shares the full subscription set across annotations even when the dossier omits an author", async () => {
  const authors = Array.from({ length: 101 }, (_, index) => ({
    _id: `author-${index}`, displayName: `Author ${String(index).padStart(3, "0")}`,
  }));
  mockSubscriptions.mockResolvedValue([
    ...authors.map((author) => ({ documentId: author._id })),
    { documentId: "unnamed-author" },
    { documentId: "author-100" },
  ]);
  mockUsers.mockResolvedValue([...authors, { _id: "unnamed-author", displayName: null }]);
  const subscribedAuthorIds = await loadReaderSubscribedAuthorIds("reader");
  const dossierAuthors = await loadReaderSubscribedAuthors(subscribedAuthorIds);
  expect(dossierAuthors).toHaveLength(100);
  expect(dossierAuthors.some((author) => author.authorId === "author-100")).toBe(false);
  expect(dossierAuthors.some((author) => author.authorId === "unnamed-author")).toBe(false);
  const posts = await annotateAiDigestPostCandidates({
    userId: "reader",
    subscribedAuthorIds,
    posts: [
      { postId: "followed", ownerIds: ["author-100"], hideAuthor: false },
      { postId: "hidden-author", ownerIds: ["author-100"], hideAuthor: true },
      { postId: "reader-owned", ownerIds: ["reader", "author-100"], hideAuthor: true },
    ],
  });
  expect(posts.map(({ isSubscribedToAuthor, recipientAuthored }) => ({
    isSubscribedToAuthor, recipientAuthored,
  }))).toEqual([
    { isSubscribedToAuthor: true, recipientAuthored: false },
    { isSubscribedToAuthor: false, recipientAuthored: false },
    { isSubscribedToAuthor: false, recipientAuthored: true },
  ]);
  const quickTakes = await annotateAiDigestQuickTakes({
    userId: "reader", subscribedAuthorIds,
    quickTakes: [{ commentId: "quick-take", authorId: "unnamed-author" }],
  });
  expect(quickTakes[0].isSubscribedToAuthor).toBe(true);
  expect(mockSubscriptions).toHaveBeenCalledTimes(1);
});
