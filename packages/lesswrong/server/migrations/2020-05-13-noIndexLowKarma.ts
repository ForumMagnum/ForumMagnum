import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { defaultFilterSettings } from '../../lib/filterSettings';
import Posts from '../../lib/collections/posts/collection';

registerMigration({
  name: "noIndexLowKarma",
  dateWritten: "2020-05-13",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 100,
      callback: async (posts: Array<DbPost>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating post batch");
        let changes: Array<any> = [];
        // postsLowKarma =
        
        // for (let post of posts) {

        //   changes.push({
        //     updateOne: {
        //       filter: { _id: post._id },
        //       update: {
        //         $set: {
        //           // TODO;
        //         }
        //       }
        //     }
        //   });
        // }
        
        await Posts.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
