import { registerMigration, migrateDocuments } from './migrationUtils';
import { LegacyData } from '../../server/collections/legacyData/collection';
import { Comments } from '../../server/collections/comments/collection';
import { Posts } from '../../server/collections/posts/collection';
import Users from '../../server/collections/users/collection';

export default registerMigration({
  name: "moveLegacyData",
  dateWritten: "2019-04-10",
  idempotent: true,
  action: async () => {
    for(let collection of [Comments, Posts, Users])
    {
      await migrateDocuments({
        description: "Move legacyData to legacyData collection",
        collection: collection,
        batchSize: 100,
        unmigratedDocumentQuery: {
          legacyData: {$exists:true},
        },
        migrate: async (documents) => {
          // Write legacyData into legacyData table
          const addNewUpdates = documents.map((doc: any): any => {
            return {
              insertOne: {
                objectId: doc._id,
                collectionName: collection.collectionName,
                legacyData: doc.legacyData
              }
            };
          });
          await LegacyData.rawCollection().bulkWrite(
            addNewUpdates,
            { ordered: false }
          );
          
          
          // Remove legacyData from the other collection
          const removeOldUpdates = documents.map((doc: any): any => {
            return {
              updateOne: {
                filter: {_id: doc._id},
                update: {
                  $unset: {legacyData:""}
                }
              }
            };
          });
          await collection.rawCollection().bulkWrite(
            removeOldUpdates,
            { ordered: false }
          );
        },
      });
    }
  }
});
