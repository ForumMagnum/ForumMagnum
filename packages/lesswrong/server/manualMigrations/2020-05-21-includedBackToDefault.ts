import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Users from '../../server/collections/users/collection';

export default registerMigration({
  name: "includedBackToDefault",
  dateWritten: "2020-05-21",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 100,
      filter: {'frontpageFilterSettings.personalBlog': 'Included'},
      callback: async (users: Array<DbUser>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating user batch");
        const changes = users.map(user => ({
          updateOne: {
            filter: { _id: user._id },
            update: {$set: {'frontpageFilterSettings.personalBlog': 'Default'}}
          }
        }))
        await Users.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
