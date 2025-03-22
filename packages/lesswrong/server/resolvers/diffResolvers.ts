import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { isValidCollectionName } from '@/server/collections/allCollections';
import { Revisions } from '../../server/collections/revisions/collection';
import { getEditableCollectionNames, getEditableFieldNamesForCollection, } from '../../lib/editor/make_editable';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { diffHtml } from './htmlDiff';
import { getPrecedingRev } from '../editor/utils';

addGraphQLResolvers({
  Query: {
    // Diff resolver
    // After revision required, before revision optional (if not provided, diff
    // is against the preceding revision, whatever that is.)
    async RevisionsDiff(root: void, {collectionName, fieldName, id, beforeRev, afterRev, trim}: { collectionName: CollectionNameString, fieldName: string, id: string, beforeRev: string|null, afterRev: string, trim: boolean }, context: ResolverContext): Promise<string> {
      const {currentUser}: {currentUser: DbUser|null} = context;
      
      // Validate collectionName, fieldName
      if (!isValidCollectionName(collectionName)) {
        throw new Error(`Invalid collection for RevisionsDiff: ${collectionName}`);
      }
      if (!getEditableCollectionNames().includes(collectionName)) {
        throw new Error(`Invalid collection for RevisionsDiff: ${collectionName}`);
      }
      if (!getEditableFieldNamesForCollection(collectionName).find(f=>f===fieldName)) {
        throw new Error(`Invalid field for RevisionsDiff: ${collectionName}.${fieldName}`);
      }
      
      const documentUnfiltered = await context.loaders[collectionName].load(id);
      
      // Check that the user has access to the document
      const document = await accessFilterSingle(currentUser, collectionName, documentUnfiltered, context);
      if (!document) {
        throw new Error(`Could not find document: ${id}`);
      }
      
      // Load the revisions
      const afterUnfiltered = await Revisions.findOne({
        documentId: id,
        version: afterRev,
        fieldName: fieldName,
      });
      if (!afterUnfiltered)
        throw new Error("Revision not found");
      let beforeUnfiltered: DbRevision|null;
      if (beforeRev) {
        beforeUnfiltered = await Revisions.findOne({
          documentId: id,
          version: beforeRev,
          fieldName: fieldName,
        })
      } else {
        beforeUnfiltered = await getPrecedingRev(afterUnfiltered, context);
      }
      
      const before: Partial<DbRevision>|null = await accessFilterSingle(currentUser, 'Revisions', beforeUnfiltered, context);
      const after: Partial<DbRevision>|null = await accessFilterSingle(currentUser, 'Revisions', afterUnfiltered, context);
      // If we don't provide a beforeRev at all, then just assume that all in the current revision is new
      if (beforeRev && (!before || !beforeUnfiltered)) {
        throw new Error(`Could not find revision: ${beforeRev}`);
      }
      if (!after || !afterUnfiltered) {
        throw new Error(`Could not find revision: ${afterRev}`);
      }
      
      // Diff the revisions
      return diffHtml(before?.html||"", after.html||"", trim);
    }
  },
});

addGraphQLQuery('RevisionsDiff(collectionName: String!, fieldName: String!, id: String, beforeRev: String, afterRev: String!, trim: Boolean): String');
