import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { getCommentSubtree } from '../utils/commentTreeUtils';
import { asyncForeachParallel } from '../../lib/utils/asyncUtils';
import Comments from '../../lib/collections/comments/collection';
import * as _ from 'underscore';

// Populates the descendentCount field on all comments. Populates the
// lastSubthreadActivity field on comments where it's missing, ie non-root
// comments.
registerMigration({
  name: "populateCommentDescendentCounts",
  dateWritten: "2021-04-28",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Comments,
      batchSize: 50,
      filter: {$or: [{descendentCount: {$exists: false}}, {lastSubthreadActivity: {$exists: false}}]},
      callback: async (comments: DbComment[]) => {
        let updates = {updated:0};
        await asyncForeachParallel(comments, async (comment: DbComment) => {
          const subtree = await getCommentSubtree(comment, {deleted:1,postedAt:1,lastSubthreadActivity:1,descendentCount:1});
          const subtreeFiltered = _.filter(subtree, c=>!c.deleted);
          const lastSubthreadActivity = _.max(subtreeFiltered, c=>c.postedAt).postedAt;
          const descendentCount = subtreeFiltered.length-1;
          if (descendentCount !== comment.descendentCount || !comment.lastSubthreadActivity) {
            updates.updated++;
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
