import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { getCommentSubtree } from '../utils/commentTreeUtils';
import { asyncForeachParallel } from '../../lib/utils/asyncUtils';
import Comments from '../../server/collections/comments/collection';
import maxBy from 'lodash/maxBy';
import { isIncludedInDescendentCounts } from '../callbacks/commentCallbackFunctions';

// Populates the descendentCount field on all comments. Populates the
// lastSubthreadActivity field on comments where it's missing, ie non-root
// comments.
export default registerMigration({
  name: "populateCommentDescendentCounts",
  dateWritten: "2025-12-22",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Comments,
      batchSize: 50,
      callback: async (comments: DbComment[]) => {
        let updates = {updated:0};
        await asyncForeachParallel(comments, async (comment: DbComment) => {
          const subtree = await getCommentSubtree(comment, {deleted:1,postedAt:1,lastSubthreadActivity:1,descendentCount:1});
          const subtreeFiltered = subtree.filter(c=>isIncludedInDescendentCounts(c));
          const lastSubthreadActivity = maxBy(subtreeFiltered, c=>c.postedAt)?.postedAt ?? null;
          const descendentCount = subtreeFiltered.filter(c=>c._id !== comment._id).length;
          if (descendentCount !== comment.descendentCount || !comment.lastSubthreadActivity) {
            updates.updated++;
            console.log(`${comment._id}: descendentCount: ${comment.descendentCount} -> ${descendentCount}; lastSubthreadActivity: ${comment.lastSubthreadActivity} -> ${lastSubthreadActivity}`);
            await Comments.rawUpdateOne(
              {_id: comment._id},
              {$set: {
                descendentCount,
                ...(!comment.lastSubthreadActivity ? {lastSubthreadActivity} : {}),
              }}
            );
          }
        });
        // eslint-disable-next-line no-console
        console.log(`Finished batch (${updates.updated} updated)`);
      }
    });
  }
});
