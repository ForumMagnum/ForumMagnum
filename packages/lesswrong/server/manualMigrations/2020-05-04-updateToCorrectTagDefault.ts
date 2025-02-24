import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Users from '../../lib/collections/users/collection';
import { getDefaultFilterSettings } from '../../lib/filterSettings';

export default registerMigration({
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
            update: {$set: {'frontpageFilterSettings.tags': getDefaultFilterSettings().tags}}
          }
        }))
        
        await Users.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
