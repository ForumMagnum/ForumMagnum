import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections } from '../../lib/editor/make_editable'
import { getCollection } from 'meteor/vulcan:core'

registerMigration({
  name: "replaceObjectIdsInEditableFieldsAndVotes",
  idempotent: true,
  action: async () => {
    for (let collectionName of [...editableCollections, "Votes"]) {
      const collection = getCollection(collectionName)
      await migrateDocuments({
        description: `Replace object ids with strings in ${collectionName}`,
        collection,
        batchSize: 1000,
        unmigratedDocumentQuery: {
          _id: {$type: "objectId"}
        }, 
        migrate: async (documents) => {
          const updates = documents.map((doc) => {
            return {
              deleteOne: {
                filter: {_id: doc._id},
              },
              insertOne: {
                document: {
                  ...doc,
                  _id: doc._id.valueOf()
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
      await migrateDocuments({
        description: `Replace user Ids that are object ids with strings in ${collectionName}`,
        collection,
        batchSize: 1000,
        unmigratedDocumentQuery: {
          userId: {$type: "objectId"}
        }, 
        migrate: async (documents) => {
          for (let doc of documents) {
            await collection.update(
              {_id: doc._id},
              {
                $set: {
                  userId: doc.userId.valueOf()
                }
              }
            )
          }
        }
      })  
    }
  },
});