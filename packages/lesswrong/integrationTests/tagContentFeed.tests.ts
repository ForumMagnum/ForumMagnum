import "./integrationTestSetup";
import { runQuery } from "@/server/vulcan-lib/query";
import { Posts } from "@/server/collections/posts/collection";
import { Comments } from "@/server/collections/comments/collection";
import { waitForBackgroundTasks } from "@/server/utils/backgroundTask";
import { createDummyComment, createDummyPost, createDummyTag, createDummyUser, waitUntilPgQueriesFinished } from "./utils";

const tagContentFeedQuery = `
  query TagContentFeedTest($tagId: String!, $sortBy: TagContentFeedSortBy!, $limit: Int, $offset: Int) {
    TagContentFeed(tagId: $tagId, sortBy: $sortBy, limit: $limit, offset: $offset) {
      cutoff
      endOffset
      results { type tagPost { _id } tagComment { _id } }
    }
  }
`;

interface TagContentFeedTestEntry {
  tagPost: { _id: string } | null;
  tagComment: { _id: string } | null;
}

async function fetchAllPages(tagId: string, sortBy: string, limit: number) {
  const ids: string[] = [];
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    const { data } = await runQuery(tagContentFeedQuery, { tagId, sortBy, limit, offset });
    const feed = data!.TagContentFeed;
    const entries: TagContentFeedTestEntry[] = feed.results;
    ids.push(...entries.map(entry => (entry.tagPost ?? entry.tagComment)!._id));
    offset = feed.endOffset;
    hasMore = !!feed.cutoff;
  }
  return ids;
}

describe("TagContentFeed", () => {
  it("returns each tagged post, comment on a tagged post, and tagged quick take exactly once in every sort mode", async () => {
    const user = await createDummyUser();
    const tag = await createDummyTag(user);
    const taggedPost = await createDummyPost(user);
    const untaggedPost = await createDummyPost(user);
    const shortformPost = await createDummyPost(user, { shortform: true });
    const commentsOnTaggedPost: DbComment[] = [];
    for (let i = 0; i < 5; i++) {
      commentsOnTaggedPost.push(await createDummyComment(user, { postId: taggedPost._id }));
    }
    const commentOnUntaggedPost = await createDummyComment(user, { postId: untaggedPost._id });
    const taggedQuickTake = await createDummyComment(user, { postId: shortformPost._id, shortform: true });
    const untaggedQuickTake = await createDummyComment(user, { postId: shortformPost._id, shortform: true });
    await waitForBackgroundTasks();
    await waitUntilPgQueriesFinished();

    // Applied after creation callbacks have settled, since they recompute these fields.
    // The comments all share a baseScore, so "top" has to page through ties.
    await Posts.rawUpdateOne({ _id: taggedPost._id }, { $set: { tagRelevance: { [tag._id]: 1 }, baseScore: 50 } });
    await Comments.rawUpdateMany({ _id: { $in: commentsOnTaggedPost.map(c => c._id) } }, { $set: { baseScore: 3 } });
    await Comments.rawUpdateOne({ _id: taggedQuickTake._id }, { $set: { relevantTagIds: [tag._id], baseScore: 3 } });

    const expectedIds = [taggedPost._id, taggedQuickTake._id, ...commentsOnTaggedPost.map(c => c._id)].sort();
    for (const sortBy of ["magic", "new", "top"]) {
      const ids = await fetchAllPages(tag._id, sortBy, 2);
      expect([...ids].sort()).toEqual(expectedIds);
      expect(ids).not.toContain(untaggedPost._id);
      expect(ids).not.toContain(commentOnUntaggedPost._id);
      expect(ids).not.toContain(untaggedQuickTake._id);
    }
  });
});
