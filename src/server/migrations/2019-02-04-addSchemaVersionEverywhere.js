import { Collections } from 'meteor/vulcan:core'
import { registerMigration, migrateDocuments } from './migrationUtils';
import { isUnbackedCollection } from '../../lib/collectionUtils';

registerMigration({
  name: "addSchemaVersionEverywhere",
  idempotent: true,
  action: async () => {
    for (let collection of Collections) {
      if (isUnbackedCollection(collection))
        continue;
      
      await migrateDocuments({
        description: `Add schema version to ${collection.collectionName}`,
        collection,
        batchSize: 1000,
        unmigratedDocumentQuery: {
          schemaVersion: {$exists: false}
        },
        migrate: async (documents) => {
          const updates = documents.map(doc => {
            return {
              updateOne: {
                filter: {_id: doc._id},
                update: {
                  $set: {
                    schemaVersion: 1,
                  }
                }
              }
            }
          })
          await collection.rawCollection().bulkWrite(
            updates,
            { ordered: false }
          )
        }
      })
    }
  },
});