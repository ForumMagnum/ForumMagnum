import { registerMigration, migrateDocuments } from './migrationUtils';
import { karmaChangeNotifierDefaultSettings } from '../../lib/karmaChanges';
import Users from 'meteor/vulcan:users';

registerMigration({
  name: "Apply karma change widget defaults",
  idempotent: true,
  action: async () => {
    let now = new Date();
    
    await migrateDocuments({
      description: "Set user karmaChangeLastOpened and karmaChangeNotifierSettings",
      collection: Users,
      batchSize: 100,
      unmigratedDocumentQuery: {
        karmaChangeNotifierSettings: {$exists:false},
        karmaChangeLastOpened: {$exists:false},
      },
      migrate: async (documents) => {
        const updates = _.map(documents, user => {
          return {
            updateOne: {
              filter: {_id: user._id},
              update: {
                $set: {
                  karmaChangeNotifierSettings: karmaChangeNotifierDefaultSettings,
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
  },
});