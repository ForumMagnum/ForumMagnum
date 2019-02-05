import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections } from '../../lib/editor/make_editable'
import { getCollection } from 'meteor/vulcan:core'

registerMigration({
  name: "addSchemaVersionToEditableCollections",
  idempotent: true,
  action: async () => {
    for (let collectionName of editableCollections) {
      const collection = getCollection(collectionName)
      await migrateDocuments({
        description: `Add schema version to ${collectionName}`,
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
                    schemaVersion: 0,
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