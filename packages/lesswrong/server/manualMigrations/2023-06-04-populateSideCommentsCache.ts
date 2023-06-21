import { registerMigration, forEachDocumentBatchInCollection } from "./migrationUtils";
import { Posts } from "../../lib/collections/posts/collection";
import { Comments } from "../../lib/collections/comments/collection";
import { getDefaultViewSelector } from "../../lib/utils/viewUtils";
import { getCachedSideCommentsMapping } from "../sideComments";
import { createAdminContext } from "../vulcan-lib/query";
import { postStatuses } from "../../lib/collections/posts/constants";

registerMigration({
  name: "populateSideCommentsCache",
  dateWritten: "2023-06-05",
  idempotent: true,
  action: async () => {
    // Generate a sideCommentsCache for each post in the archives. This is not
    // strictly necessary, because if not populated, these cache entries will
    // be populated upon request. We pre-populate it because, if we don't, then
    // a webcrawler visiting all the old posts in the archives rapidly would
    // use a lot of CPU time, potentially creating a capacity issue.
    
    await forEachDocumentBatchInCollection({
      collection: Posts,
      filter: {status: postStatuses.STATUS_APPROVED, draft: false},
      batchSize: 100,
      callback: async (posts: DbPost[]) => {
        // eslint-disable-next-line no-console
        console.log(`Precomputing side-comment mapping for batch of ${posts.length} posts`);
        const context = createAdminContext();

        for (let post of posts) {
          const now = new Date();
          const comments = await Comments.find({
            ...getDefaultViewSelector("Comments"),
            postId: post._id,
          }).fetch();
          await getCachedSideCommentsMapping({
            post, comments, timestamp: now, context,
          });
        }
      }
    });
  }
});
