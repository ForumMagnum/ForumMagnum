import { registerMigration } from './migrationUtils';

registerMigration({
  name: "addSchemaVersionEverywhere",
  dateWritten: "2019-02-04",
  idempotent: true,
  action: async () => {
    // A meteor-era migration that is no longer runnable
    throw new Error("This migration requires an older version");
    /*
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
    */
  },
});
