import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable';
import { getCollection } from '../../lib/vulcan-lib/getCollection';
import { htmlToPingbacks } from '../pingbacks';
import { editableCollectionsFieldOptions } from '@/lib/editor/makeEditableOptions';
import Revisions from '@/lib/collections/revisions/collection';

export default registerMigration({
  name: "generatePingbacksAgain",
  dateWritten: "2019-12-05",
  idempotent: true,
  action: async () => {
    for (let collectionName of editableCollections) {
      for (let editableField of editableCollectionsFields[collectionName]!) {
        if (editableCollectionsFieldOptions[collectionName][editableField].pingbacks) {
          await updatePingbacks(collectionName, editableField);
        }
      }
    }
  }
});

const updatePingbacks = async (collectionName: CollectionNameString, fieldName: string) => {
  const collection = getCollection(collectionName);
  // eslint-disable-next-line no-console
  console.log(`Updating pingbacks for ${collectionName}.${fieldName}`);
  let updatedDocuments = 0
  await forEachDocumentBatchInCollection({
    collection: collection,
    batchSize: 1000,
    callback: async (documents: any[]) => {
      let updates: Array<any> = [];
      
      for (let document of documents) {
        const latestRevId = document[`${fieldName}_latest`];
        if (!latestRevId) {
          continue;
        }
        const rev = await Revisions.findOne({
          _id: latestRevId,
        });
        if (!rev) {
          continue;
        }
        const html = rev.html;
        if (html) {
          const pingbacks = await htmlToPingbacks(html);
          if (JSON.stringify(document.pingbacks) !== JSON.stringify(pingbacks)) {
            updates.push({
              updateOne: {
                filter: { _id: document._id },
                update: { $set: {
                  pingbacks: pingbacks,
                } },
              }
            });
          }
        }
      }
      
      if (updates.length > 0) {
        await collection.rawCollection().bulkWrite(updates, {ordered: false});
      }
      updatedDocuments = updatedDocuments + documents.length
      // eslint-disable-next-line no-console
      console.log("processed documents: ", updatedDocuments)
      // eslint-disable-next-line no-console
      console.log("updated documents: ", updates.length)
    }
  });
}
