import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { getEditableCollectionNames, getEditableFieldNamesForCollection } from '../../lib/editor/make_editable';
import { getCollection } from '../vulcan-lib/getCollection';
import Revisions from '../../server/collections/revisions/collection'

export default registerMigration({
  name: "fillMissingRevisionFieldNamesOnSingleEditableCollections",
  dateWritten: "2020-01-02",
  idempotent: true,
  action: async () => {
    for (let { collectionName, fieldName } of collectionsWithExactlyOneEditableField()) {
      // eslint-disable-next-line no-console
      console.log(`Filling in fieldName for collection: ${collectionName}, field: ${fieldName}`);
      const collection = getCollection(collectionName);
      await forEachDocumentBatchInCollection({
        collection, batchSize: 1000,
        callback: async (documents: any[]) => {
          await Revisions.rawUpdateMany(
            { documentId: { $in: documents.map(doc => doc._id) } },
            { $set: {fieldName} },
            { multiple: true }
          );
        }
      });
    }
  }
});

function collectionsWithExactlyOneEditableField(): Array<{collectionName: CollectionNameString, fieldName: string}>
{
  let result: Array<{collectionName: CollectionNameString, fieldName: string}> = [];
  for (let collectionName of getEditableCollectionNames()) {
    if (getEditableFieldNamesForCollection(collectionName).length === 1) {
      result.push({
        collectionName,
        fieldName: getEditableFieldNamesForCollection(collectionName)[0],
      });
    }
  }
  return result;
}
