import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { defaultFilterSettings } from '../../lib/filterSettings';
import Users from '../../lib/collections/users/collection';

registerMigration({
  name: "updateToCorrectTagDefault",
  dateWritten: "2020-05-04",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 100,
      callback: async (users: Array<DbUser>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating user batch");
        
        const changes = users.map(user => ({
          updateOne: {
            filter: { _id: user._id },
            update: {$set: {'frontpageFilterSettings.tags': defaultFilterSettings.tags}}
          }
        }))
        
        await Users.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
