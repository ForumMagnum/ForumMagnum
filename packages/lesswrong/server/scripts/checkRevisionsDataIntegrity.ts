import { getCollection } from '../../lib/vulcan-lib/getCollection'
import { Globals } from '../../lib/vulcan-lib/config'
import { forEachDocumentBatchInCollection } from '../migrations/migrationUtils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable';
import { getLatestRev } from '../editor/make_editable_callbacks';
import { asyncMapParallel } from '../../lib/utils/asyncUtils';
import keyBy from 'lodash/keyBy';
import * as _ from 'underscore';

const assertFieldsMatch = (doc: any, collectionName: CollectionNameString, fieldName: string, latestRev: DbRevision) => {
  if (latestRev.documentId !== doc._id)
    throw new Error(`${doc._id}.${fieldName} latest rev ${latestRev._id} has incorrect documentId`);
  if (latestRev.collectionName !== collectionName)
    throw new Error(`${doc._id}.${fieldName} latest rev ${latestRev._id} has incorrect collectionName`);
  if (latestRev.fieldName !== fieldName && !_.isEqual(latestRev.fieldName, [fieldName]))
    throw new Error(`${doc._id}.${fieldName} latest rev ${latestRev._id} has incorrect fieldName`);
  if (latestRev.html !== doc[fieldName].html)
    throw new Error(`${doc._id}.${fieldName} latest rev ${latestRev._id} has incorrect html`);
  if (!_.isEqual(latestRev.originalContents, doc[fieldName].originalContents))
    throw new Error(`${doc._id}.${fieldName} latest rev ${latestRev._id} has incorrect originalCOntents`);
}

const fieldIsBlank = (doc: any, fieldName: string): boolean => {
  return !doc[fieldName] && !doc[`${fieldName}_latest`];
}

// Check that for each editable field in each document in a given collection,
// the denormalized contents fields match the latest revision. If any don't
// match, outputs the ID of a document where they don't match.
const checkCollectionRevisionsIntegrity = async (collectionName: CollectionNameString) => {
  const collection = getCollection(collectionName);
  
  // eslint-disable-next-line no-console
  console.log(`Checking integrity of revisions in ${collectionName} collection`);
  await forEachDocumentBatchInCollection({
    collection,
    batchSize: 1000,
    callback: async (batch: Array<any>) => {
      const editableFieldNames = editableCollectionsFields[collectionName];
      for (const fieldName of editableFieldNames) {
        // Get latest revisions by querying the Revisions collection for the
        // one with the highest version number
        const latestRevs: Array<DbRevision|null> = await asyncMapParallel(batch,
          async (doc) => await getLatestRev(doc._id, fieldName));
        const latestRevsNonnull: Array<DbRevision> = _.filter(latestRevs, r=>!!r) as Array<DbRevision>;
        
        const latestRevsByDocumentId: Record<string,DbRevision> = keyBy(latestRevsNonnull, r=>r.documentId);
        
        for (let doc of batch) {
          if (!(doc._id in latestRevsByDocumentId)) {
            // No latest revision. Verify that the field is in fact blank.
            if (!fieldIsBlank(doc, fieldName)) {
              throw new Error(`${doc._id}.${fieldName} has no latest revision`);
            }
          } else {
            const latestRev: DbRevision = latestRevsByDocumentId[doc._id];
            assertFieldsMatch(doc, collectionName, fieldName, latestRev);
          }
        }
      }
    }
  });
  // eslint-disable-next-line no-console
  console.log(`Done checking integrity of revisions in ${collectionName} collection`);
}

const checkRevisionsIntegrity = async () => {
  for (let collectionName of editableCollections) {
    await checkCollectionRevisionsIntegrity(collectionName as CollectionNameString);
  }
}

Globals.checkCollectionRevisionsIntegrity = checkCollectionRevisionsIntegrity;
Globals.checkRevisionsIntegrity = checkRevisionsIntegrity;
