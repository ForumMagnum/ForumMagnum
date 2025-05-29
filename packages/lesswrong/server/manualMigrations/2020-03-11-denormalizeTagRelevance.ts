import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { updatePostDenormalizedTags } from '../tagging/helpers';
import { Posts } from '../../server/collections/posts/collection';


export default registerMigration({
  name: "denormalizeTagRelevance",
  dateWritten: "2020-03-11",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 100,
      callback: async (posts: DbPost[]) => {
        // eslint-disable-next-line no-console
        console.log("Migrating post batch");
        await Promise.all(posts.map(post => updatePostDenormalizedTags(post._id)));
      }
    });
  }
})
