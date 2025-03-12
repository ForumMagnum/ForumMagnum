import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { getDefaultFilterSettings } from '../../lib/filterSettings';
import Users from '../../server/collections/users/collection';

export default registerMigration({
  name: "updateUserDefaultTagFilterSettings",
  dateWritten: "2020-03-11",
  idempotent: true,
  action: async () => {
    await forEachDocumentBatchInCollection({
      collection: Users,
      batchSize: 100,
      callback: async (users: Array<DbUser>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating user batch");
        let changes: Array<any> = [];
        
        for (let user of users) {
          changes.push({
            updateOne: {
              filter: { _id: user._id },
              update: {
                $set: {
                  frontpageFilterSettings: {
                    ...getDefaultFilterSettings(),
                    personalBlog: (user.currentFrontpageFilter === "frontpage") ? "Hidden" : "Default"
                  }
                }
              }
            }
          });
        }
        
        await Users.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
