import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";
import { Posts } from "@/server/collections/posts/collection";
import { castInitialPingbackVotes, syncPostPingbacks } from "@/server/postPingbacks";
import { waitForBackgroundTasks } from "@/server/utils/backgroundTask";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

interface PostedAtRange {
  postedAfter?: Date,
  postedBefore?: Date,
}

function getPostedAtFilter({ postedAfter, postedBefore }: PostedAtRange): MongoSelector<DbPost>|null {
  if (!postedAfter && !postedBefore) return null;
  return {
    postedAt: {
      ...(postedAfter && { $gte: postedAfter }),
      ...(postedBefore && { $lt: postedBefore }),
    },
  };
}

async function backfillPingbacksFromPost(post: DbPost, failedPostIds: string[], context: ResolverContext) {
  try {
    await syncPostPingbacks(post, context);
    await castInitialPingbackVotes(post._id, context);
  } catch (err) {
    failedPostIds.push(post._id);
    // eslint-disable-next-line no-console
    console.error(`Failed to backfill pingbacks from post ${post._id}`, err);
  }
}

export async function backfillPostPingbacks(postedAtRange: PostedAtRange = {}) {
  const failedPostIds: string[] = [];
  await forEachDocumentBatchInCollection({
    collection: Posts,
    batchSize: 300,
    filter: getPostedAtFilter(postedAtRange),
    callback: async (posts: DbPost[]) => {
      // A context per batch, so that its loaders don't accumulate every post's contents
      const context = createAnonymousContext();
      await executePromiseQueue(posts.map(post => () => backfillPingbacksFromPost(post, failedPostIds, context)), 30);
    },
  });
  await waitForBackgroundTasks();
  // eslint-disable-next-line no-console
  console.log(`Backfilled post pingbacks. Failed for ${failedPostIds.length} posts: ${failedPostIds.join(", ")}`);
}

export default registerMigration({
  name: "backfillPostPingbacks",
  dateWritten: "2026-11-02",
  idempotent: true,
  action: () => backfillPostPingbacks(),
});
