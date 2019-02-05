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
          for (let doc of documents) {
            await collection.remove({_id: doc._id}, true)
            await collection.insert(
              {
                ...doc,
                _id: doc._id.valueOf(),
                username: doc.username + "x"
              }
            )
          }
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