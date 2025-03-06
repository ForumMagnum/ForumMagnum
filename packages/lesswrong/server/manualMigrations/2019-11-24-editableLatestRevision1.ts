import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { getCollection } from '../vulcan-lib/getCollection';
import { getEditableCollectionNames, getEditableFieldNamesForCollection } from '../../lib/editor/make_editable';
import { Revisions } from '../../lib/collections/revisions/collection';

// The upgrade procedure here is:
//  1. Attach an instance to the database and run editableAddLatestRevisionField.
//     This creates a [fieldName]_latest field for all documents with
//     content-editable fields.
//  2. Update the webserver. This makes the [fieldName]_latest field be the one
//     that matters, rather than [fieldName]. But any edits that happen on the
//     old server version will have [fieldName]_latest out of date.
//  3. Run editableAddLatestRevisionField again to repair any documents that were
//     edited during the upgrade
//  4. Run editableDropDenormalizedField to drop the now-unused denormalized
//     content fields, for smaller tables and faster database operations.

export default registerMigration({
  name: "editableAddLatestRevisionField",
  dateWritten: "2019-11-24",
  idempotent: true,
  action: async () => {
    for (let collectionName of getEditableCollectionNames())
    for (let fieldName of getEditableFieldNamesForCollection(collectionName))
    {
      const collection = getCollection(collectionName);
      // eslint-disable-next-line no-console
      console.log(`Updating ${collectionName}.${fieldName}_latest`);
      await forEachDocumentBatchInCollection({
        collection: collection,
        filter: {
          [fieldName]: {$exists: true},
          [`${fieldName}_latest`]: {$exists: false},
        },
        batchSize: 1000,
        callback: async (documents: any[]) => {
          const updates: Array<any> = [];
          await Promise.all(
            documents.map(async doc => {
              if (doc[fieldName]) {
                const latestRev = await Revisions.findOne({
                  documentId: doc._id,
                  fieldName: fieldName,
                  version: doc[fieldName].version,
                }, {}, {_id: 1});
                if (latestRev) {
                  updates.push({
                    updateOne: {
                      filter: { _id: doc._id },
                      update: {
                        $set: {
                          [`${fieldName}_latest`]: latestRev._id
                        }
                      }
                    }
                  });
                } else {
                  // eslint-disable-next-line no-console
                  console.log(`Warning: document is missing its corresponding revision object`);
                }
              }
            })
          );
          
          if (updates.length > 0) {
            // eslint-disable-next-line no-console
            console.log(`Updating ${updates.length} documents in ${collectionName}`);
            await collection.rawCollection().bulkWrite(updates, { ordered: false });
          }
        }
      });
    }
  }
});

/*registerMigration({
  name: "editableDropDenormalizedField",
  idempotent: true,
  action: async () => {
    for (let collectionName of editableCollections)
    for (let fieldName of editableCollectionsFields[collectionName])
    {
      const collection = getCollection(collectionName);
      await migrateDocuments({
        description: `Drop denormalized ${collectionName}.${fieldName}`,
        collection: collection,
        unmigratedDocumentQuery: {
          [fieldName]: {$exists: true}
        },
        batchSize: 1000,
        migrate: async (documents) => {
          const updates = documents.map(doc => ({
            updateOne: {
              filter: { _id: doc._id },
              update: {
                $unset: { [fieldName]: true }
              }
            }
          }));
          
          if (updates.length > 0) {
            await collection.rawCollection().bulkWrite(updates, { ordered: false });
          }
        }
      });
    }
  }
});*/
