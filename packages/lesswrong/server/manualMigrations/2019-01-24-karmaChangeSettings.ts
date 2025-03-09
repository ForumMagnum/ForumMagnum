import { registerMigration, migrateDocuments, fillDefaultValues } from './migrationUtils';
import Users from '../../server/collections/users/collection';
import * as _ from 'underscore';

export default registerMigration({
  name: "applyKarmaChangeWidgetDefaults",
  dateWritten: "2019-01-24",
  idempotent: true,
  action: async () => {
    let now = new Date();
    
    await migrateDocuments({
      description: "Set user karmaChangeLastOpened",
      collection: Users,
      batchSize: 100,
      unmigratedDocumentQuery: {
        karmaChangeLastOpened: {$exists:false},
      },
      migrate: async (documents) => {
        const updates = _.map(documents, user => {
          return {
            updateOne: {
              filter: {_id: user._id},
              update: {
                $set: {
                  karmaChangeLastOpened: now,
                }
              },
            }
          }
        });
        await Users.rawCollection().bulkWrite(
          updates,
          { ordered: false }
        );
      }
    });
    await fillDefaultValues({
      collection: Users,
      fieldName: "karmaChangeNotifierSettings",
    });
  },
});
