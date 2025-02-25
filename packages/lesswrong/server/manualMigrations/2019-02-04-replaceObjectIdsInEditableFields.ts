import { registerMigration, migrateDocuments } from './migrationUtils';
import { editableCollections } from '../../lib/editor/make_editable'
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import * as _ from 'underscore';

export default registerMigration({
  name: "replaceObjectIdsInEditableFieldsAndVotes",
  dateWritten: "2019-02-04",
  idempotent: true,
  action: async () => {
    const collectionNames: Array<CollectionNameString> = [...editableCollections, "Revisions", "Votes"]
    for (let collectionName of collectionNames) {
      const collection = getCollection(collectionName)
      await migrateDocuments({
        description: `Replace object ids with strings in ${collectionName}`,
        collection,
        batchSize: 1000,
        unmigratedDocumentQuery: {
          _id: {$type: "objectId"}
        },
        migrate: async (documents: Array<any>) => {
          const updates = documents.map((doc: any): any => {
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
          await collection.rawRemove({_id: {$in: _ids}})
        }
      })
      await migrateDocuments({
        description: `Replace user Ids that are object ids with strings in ${collectionName}`,
        collection,
        batchSize: 1000,
        unmigratedDocumentQuery: {
          userId: {$type: "objectId"}
        },
        migrate: async (documents: Array<any>) => {
          for (let doc of documents) {
            await collection.rawUpdateOne(
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
