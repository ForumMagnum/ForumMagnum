import { loadAiDigestCuratedPostRows, loadAiDigestPostBodies } from "@/server/aiDigest/aiDigestPostLookups";
import { getViewablePostsSelector, viewablePostsSelector } from "@/server/repos/helpers";
import { computeContextFromUser } from "@/server/vulcan-lib/apollo-server/context";

jest.mock("@/server/vulcan-lib/apollo-server/context", () => ({
  computeContextFromUser: () => ({
    Posts: { find: (...args: unknown[]) => ({ fetch: () => mockPosts(...args) }) },
    Revisions: { find: (...args: unknown[]) => ({ fetch: () => mockRevisions(...args) }) },
    ReadStatuses: { find: (...args: unknown[]) => ({ fetch: () => mockReads(...args) }) },
  }),
}));
const mockPosts = jest.fn();
const mockRevisions = jest.fn();
const mockReads = jest.fn();

beforeEach(() => jest.resetAllMocks());

it("loads current revisions in a batch, omitting missing and blank bodies", async () => {
  mockPosts.mockResolvedValue([
    { _id: "a", contents_latest: "current", hideAuthor: true },
    { _id: "b", contents_latest: "missing" },
    { _id: "c", contents_latest: "blank" },
    { _id: "d", contents_latest: null },
  ]);
  mockRevisions.mockResolvedValue([
    { _id: "current", html: "<p>Current body</p>" },
    { _id: "blank", html: "  " },
  ]);
  expect(await loadAiDigestPostBodies(["a", "b", "c", "d"], computeContextFromUser({ user: null, isSSR: false })))
    .toEqual([{ postId: "a", revisionHtml: "<p>Current body</p>" }]);
  expect(mockRevisions).toHaveBeenCalledWith({ _id: { $in: ["current", "missing", "blank"] } }, { projection: { _id: 1, html: 1 } });
});

it("does not query bodies for an empty list", async () => {
  expect(await loadAiDigestPostBodies([], computeContextFromUser({ user: null, isSSR: false }))).toEqual([]);
  expect(mockPosts).not.toHaveBeenCalled();
});

it("preserves curated order and annotates only this reader's positive read statuses", async () => {
  const now = new Date("2026-09-21T00:00:00Z");
  mockPosts.mockResolvedValue([{ _id: "new" }, { _id: "old" }]);
  mockReads.mockResolvedValue([{ postId: "old" }]);
  expect(await loadAiDigestCuratedPostRows("reader", 10, now, computeContextFromUser({ user: null, isSSR: false })))
    .toEqual([{ postId: "new", isRead: false }, { postId: "old", isRead: true }]);
  expect(mockPosts).toHaveBeenCalledWith({
    ...viewablePostsSelector, deletedDraft: false, rejected: false, curatedDate: { $ne: null, $lte: now },
  }, { sort: { curatedDate: -1 }, limit: 10, projection: { _id: 1 } });
  expect(mockReads).toHaveBeenCalledWith({ userId: "reader", postId: { $in: ["new", "old"] }, isRead: true }, { projection: { postId: 1 } });
});

it("preserves the original public-post SQL filter when sharing it with collection finds", () => {
  for (const alias of [undefined, "p"]) {
    const prefix = alias ? `${alias}.` : "";
    expect(getViewablePostsSelector(alias).replace(/\s+/g, " ").trim()).toBe([
      '"status" = 2', '"draft" = FALSE', '"isFuture" = FALSE', '"unlisted" = FALSE',
      '"shortform" = FALSE', '"authorIsUnreviewed" = FALSE', '"hiddenRelatedQuestion" = FALSE',
      '"isEvent" = FALSE', '"postedAt" IS NOT NULL',
    ].map((condition) => prefix + condition).join(" AND "));
  }
});
