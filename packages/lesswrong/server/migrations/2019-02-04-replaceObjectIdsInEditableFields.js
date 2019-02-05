import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections } from '../../lib/editor/make_editable'
import { getCollection } from 'meteor/vulcan:core'

registerMigration({
  name: "replaceObjectIdsInEditableFields",
  idempotent: true,
  action: async () => {
    for (let collectionName of editableCollections) {
      const collection = getCollection(collectionName)
      await migrateDocuments({
        description: `Replace object ids with strings in ${collectionName}`,
        collection,
        batchSize: 1000,
        unmigratedDocumentQuery: {
          _id: {$type: "objectId"}
        }, 
        migrate: async (documents) => {
          const updates = documents.map(doc => {
            return {
              updateOne: {
                filter: {_id: doc._id},
                update: {
                  $set: {
                    _id: doc._id.valueOf()
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