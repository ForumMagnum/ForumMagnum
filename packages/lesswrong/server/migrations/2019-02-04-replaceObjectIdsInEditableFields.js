import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections } from '../../lib/editor/make_editable'
import { getCollection } from 'meteor/vulcan:core'

registerMigration({
  name: "replaceObjectIdsInEditableFieldsAndVotes",
  idempotent: true,
  action: async () => {
    for (let collectionName of [...editableCollections, "Revisions", "Votes"]) {
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
              updateOne: {
                filter: {_id: doc._id.valueOf()},
                update: {
                  ...doc,
                  _id: doc._id.valueOf(),
                  username: doc.username ? `Imported-${doc.username}` : undefined
                },
                upsert: true
              }
            }
          })
          await collection.rawCollection().bulkWrite(
            updates,
            { ordered: false }
          )
          const _ids = _.pluck(documents, '_id')
          await collection.remove({_id: {$in: _ids}})
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
