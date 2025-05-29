import { Posts } from '../../server/collections/posts/collection';
import { registerMigration, migrateDocuments } from './migrationUtils';
import * as _ from 'underscore';

export default registerMigration({
  name: "fixMaxBaseScore",
  dateWritten: "2019-07-24",
  idempotent: true,
  action: async () => await migrateDocuments({
    description: `replace null maxBaseScore`,
    collection: Posts,
    unmigratedDocumentQuery: {
      maxBaseScore: null,
      baseScore: {$exists: true}
    },
    batchSize: 1000,
    migrate: async (posts) => {
      let updates = _.map(posts, post => ({
        updateOne: {
          filter: { _id: post._id },
          update: {
            $set: {
              maxBaseScore: post.baseScore
            }
          }
        }
      }));
      await Posts.rawCollection().bulkWrite(updates, { ordered: false });
    },
  })
});
