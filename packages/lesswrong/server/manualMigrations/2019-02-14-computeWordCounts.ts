import { registerMigration, migrateDocuments } from './migrationUtils';
import { getEditableCollectionNames, getEditableFieldNamesForCollection } from '../../lib/editor/make_editable'
import { getCollection } from '../vulcan-lib/getCollection';
import { dataToWordCount } from '../editor/conversionUtils';
import { Revisions } from '../../server/collections/revisions/collection';

export default registerMigration({
  name: "computeWordCounts",
  dateWritten: "2019-02-14",
  idempotent: true,
  action: async () => {
    // Fill in wordCount in the Revisions table
    await migrateDocuments({
      description: `Compute word counts in the Revisions table`,
      collection: Revisions,
      batchSize: 1000,
      unmigratedDocumentQuery: {
        wordCount: {$exists: false}
      },
      
      migrate: async (documents) => {
        let updates: Array<any> = [];
        
        for (let doc of documents) {
          if (!doc.originalContents) continue;
          const { data, type } = doc.originalContents;
          const wordCount = await dataToWordCount(data, type);
          
          updates.push({
            updateOne: {
              filter: { _id: doc._id },
              update: {
                $set: {
                  wordCount: wordCount
                }
              }
            }
          });
        }
        
        await Revisions.rawCollection().bulkWrite(updates, { ordered: false });
      }
    });
    
    // Fill in wordCount in the denormalized latest revs on posts/comments/etc
    for (let collectionName of getEditableCollectionNames()) {
      for (let fieldName of getEditableFieldNamesForCollection(collectionName)) {
        const collection: CollectionBase<any> = getCollection(collectionName)
        await migrateDocuments({
          description: `Compute word counts for ${collectionName}.${fieldName}`,
          collection,
          batchSize: 1000,
          unmigratedDocumentQuery: {
            [fieldName]: {$exists: true},
            [`${fieldName}.wordCount`]: {$exists: false}
          },
          migrate: async (documents) => {
            let updates: Array<any> = [];
            
            for (let doc of documents) {
              if (doc[fieldName]) {
                const { data, type } = doc[fieldName].originalContents;
                const wordCount = await dataToWordCount(data, type);
                updates.push({
                  updateOne: {
                    filter: { _id: doc._id },
                    update: {
                      $set: {
                        [`${fieldName}.wordCount`]: wordCount
                      }
                    }
                  }
                });
              }
            }
            await collection.rawCollection().bulkWrite(updates, { ordered: false });
          }
        })
      }
    }
  },
});
