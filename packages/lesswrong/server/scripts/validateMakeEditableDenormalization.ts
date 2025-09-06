import { getEditableCollectionNames, getEditableFieldNamesForCollection, editableFieldIsNormalized } from '@/server/editor/editableSchemaFieldHelpers';
import { Revisions } from '../../server/collections/revisions/collection';
import { forEachDocumentBatchInCollection } from '../manualMigrations/migrationUtils';
import { getCollection } from "../collections/allCollections";
import groupBy from 'lodash/groupBy';
import sortBy from 'lodash/sortBy';
import last from 'lodash/last';

// Check that the denormalized contents field of objects with make_editable match
// the newest revision in the revisions table. This is important because we're
// going to be dropping those denormalized fields, but there's a risk that for
// some subset of content (eg particular types of important posts), they may
// contain real unique content rather than just being denormalized copies.
export const validateMakeEditableDenormalization = async () => {
  function recordError(err: string) {
    // eslint-disable-next-line no-console
    console.error("    "+err);
  }
  
  for (let collectionName of getEditableCollectionNames()) {
    for (let editableField of getEditableFieldNamesForCollection(collectionName)) {
      if (editableFieldIsNormalized(collectionName, editableField)) {
        continue;
      }

      // eslint-disable-next-line no-console
      console.log(`Checking ${collectionName}.${editableField}...`);
      
      const collection = getCollection(collectionName);
      await forEachDocumentBatchInCollection({
        collection: collection, batchSize: 100,
        callback: async (documents: Array<any>) => {
          const documentIds = documents.map(d=>d._id);
          const revs = await Revisions.find({
            documentId: {$in: documentIds},
            fieldName: editableField,
          }).fetch();
          const revsByDocument = groupBy(revs, rev=>rev.documentId);
          
          for (let doc of documents) {
            if (!doc[editableField]) {
              // Editable field is optional, and not present in the denormalized version
              continue;
            }
            if (!(doc._id in revsByDocument)) {
              recordError(`Document ${doc._id} has no revisions`);
              continue;
            }
            const latestRev: DbRevision|undefined = last(sortBy(revsByDocument[doc._id], r=>r.version));
            
            const denormalizedContents = doc[editableField].originalContents;
            const revContents = latestRev?.originalContents;
            if (JSON.stringify(denormalizedContents) !== JSON.stringify(revContents)) {
              recordError(`Document ${doc._id} denormalized contents don't match latest rev contents`);
            }
          }
        }
      });
    }
  }
}
