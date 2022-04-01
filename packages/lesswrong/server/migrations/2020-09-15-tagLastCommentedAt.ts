import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { Tags } from '../../lib/collections/tags/collection';
import { Comments } from '../../lib/collections/comments/collection';

registerMigration({
  name: "tagLastCommentedAt",
  dateWritten: "2020-09-15",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Tags,
      batchSize: 100,
      callback: async (tags: Array<DbTag>) => {
        await Promise.all(tags.map(async (tag: DbTag) => {
          const newestComment: Array<DbComment> = await Comments.find({
            tagId: tag._id,
          }, {
            limit: 1,
            sort: {postedAt: -1},
          }).fetch();
          if (newestComment.length>0) {
            const lastCommentedAt = newestComment[0].postedAt;
            await Tags.rawUpdateOne({_id: tag._id}, {$set: {lastCommentedAt: lastCommentedAt}});
          }
        }));
      }
    });
  }
})
