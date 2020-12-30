import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import { getCollection } from '../../lib/vulcan-lib';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable';
import Revisions from '../../lib/collections/revisions/collection'
import { Random } from 'meteor/random';

// If an editable field of a document:
//  * Has the denormalized content filled in
//  * But does not have a [fieldName]_latest field
//  * And there are no revisions at all with documentId equal to this document's ID
// Then create a revision based on the denormalized field, and set
// [fieldName]_latest to point to it.
registerMigration({
  name: "fixMissingRevisions",
  dateWritten: "2020-07-06",
  idempotent: true,
  action: async () => {
    for (let collectionName of editableCollections) {
      const collection = getCollection(collectionName);
      
      await forEachDocumentBatchInCollection({
        collection, batchSize: 1000,
        callback: async (batch: Array<any>) => {
          for (let fieldName of editableCollectionsFields[collectionName]) {
            for (let document of batch) {
              if (await isMissingLatestRevision({document, collectionName, fieldName})) {
                const revisionId = Random.id();
                await Revisions.insert({
                  ...document[fieldName],
                  _id: revisionId,
                  fieldName,
                  collectionName,
                  updateType: "initial",
                  documentId: document._id,
                });
                await collection.update(
                  {_id: document._id},
                  {$set: {[`${fieldName}_latest`]: revisionId}}
                );
              }
            }
          }
        }
      });
    }
  }
});

const isMissingLatestRevision = async ({document, collectionName, fieldName}) => {
  if (!document)
    return false;
  if (!document[fieldName])
    return false;
  if (document[`${fieldName}_latest`])
    return false;
  const revisions = await Revisions.find({documentId: document._id}, {}, {_id:1}).fetch();
  if (revisions?.length > 0)
    return false;
  
  return true;
}
