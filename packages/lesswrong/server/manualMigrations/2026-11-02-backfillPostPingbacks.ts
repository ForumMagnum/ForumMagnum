import { executePromiseQueue } from "@/lib/utils/asyncUtils";
import { forEachDocumentBatchInCollection, registerMigration } from "./migrationUtils";
import { Posts } from "@/server/collections/posts/collection";
import { castInitialPingbackVotes, syncPostPingbacks } from "@/server/postPingbacks";
import { createAnonymousContext } from "@/server/vulcan-lib/createContexts";

async function backfillPingbacksFromPost(post: DbPost, failedPostIds: string[], context: ResolverContext) {
  try {
    const newPingbacks = await syncPostPingbacks(post, context);
    await castInitialPingbackVotes(newPingbacks, post, context);
  } catch (err) {
    failedPostIds.push(post._id);
    // eslint-disable-next-line no-console
    console.error(`Failed to backfill pingbacks from post ${post._id}`, err);
  }
}

export default registerMigration({
  name: "backfillPostPingbacks",
  dateWritten: "2026-11-02",
  idempotent: true,
  action: async () => {
    const failedPostIds: string[] = [];
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 100,
      callback: async (posts: DbPost[]) => {
        // A context per batch, so that its loaders don't accumulate every post's contents
        const context = createAnonymousContext();
        await executePromiseQueue(posts.map(post => () => backfillPingbacksFromPost(post, failedPostIds, context)), 10);
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Backfilled post pingbacks. Failed for ${failedPostIds.length} posts: ${failedPostIds.join(", ")}`);
  },
});
