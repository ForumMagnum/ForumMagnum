import { registerMigration, migrateDocuments, fillDefaultValues } from './migrationUtils';

import Users from 'meteor/vulcan:users';

registerMigration({
  name: "applyKarmaChangeWidgetDefaults",
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