import "./integrationTestSetup";
import PostViews from "@/server/collections/postViews/collection";
import PostViewTimes from "@/server/collections/postViewTimes/collection";
import PostViewsRepo from "@/server/repos/PostViewsRepo";
import PostViewTimesRepo from "@/server/repos/PostViewTimesRepo";

const windowStart = "2026-01-01 00:00:00";
const windowEnd = "2026-01-02 00:00:00";
const updatedAt = new Date("2026-01-02");

// The ids in these rows come from client-reported analytics events, so they can
// contain anything. `a'||'b` is stored as `ab` if it's executed as SQL, and `$1`
// is substituted (or throws) if the query text goes back through pg-promise's formatter.
const hostileIds = [`a'||'b`, `a\\'b`, `$1`];

describe("IncrementalViewRepo upserts", () => {
  it.each(hostileIds)("stores and updates PostViews with postId %s", async (hostileId) => {
    const repo = new PostViewsRepo();
    const benignId = `benign-${hostileIds.indexOf(hostileId)}`;
    const row = { windowStart, windowEnd, updatedAt, viewCount: 1, uniqueViewCount: 1 };

    await repo.upsertData({ data: [{ ...row, postId: hostileId }, { ...row, postId: benignId }] });
    await repo.upsertData({ data: [{ ...row, postId: hostileId, viewCount: 2 }] });

    const stored = await PostViews.find({ postId: { $in: [hostileId, benignId] } }, { sort: { viewCount: -1 } }).fetch();
    expect(stored.map(({ postId, viewCount }) => ({ postId, viewCount }))).toEqual([
      { postId: hostileId, viewCount: 2 },
      { postId: benignId, viewCount: 1 },
    ]);
  });

  it.each(hostileIds)("stores and updates PostViewTimes with clientId and postId %s", async (hostileId) => {
    const repo = new PostViewTimesRepo();
    const row = { windowStart, windowEnd, updatedAt, clientId: hostileId, postId: hostileId, totalSeconds: 1 };

    await repo.upsertData({ data: [row] });
    await repo.upsertData({ data: [{ ...row, totalSeconds: 2 }] });

    const stored = await PostViewTimes.find({ clientId: hostileId, postId: hostileId }).fetch();
    expect(stored.map(({ totalSeconds }) => totalSeconds)).toEqual([2]);
  });
});
