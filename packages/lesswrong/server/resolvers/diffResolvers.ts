import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { diff } from '../vendor/node-htmldiff/htmldiff';
import { Utils } from '../vulcan-lib';
import { Revisions } from '../../lib/collections/revisions/collection';
import { sanitize } from '../vulcan-lib/utils';
import Users from '../../lib/collections/users/collection';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable';

addGraphQLResolvers({
  Query: {
    async RevisionsDiff(root, {collectionName, fieldName, id, beforeRev, afterRev}: { collectionName: string, fieldName: string, id: string, beforeRev: string, afterRev: string }, context): Promise<string> {
      const {currentUser}: {currentUser: DbUser|null} = context;
      
      // Validate collectionName, fieldName
      if (!editableCollections.has(collectionName)) {
        throw new Error(`Invalid collection for RevisionsDiff: ${collectionName}`);
      }
      if (!editableCollectionsFields[collectionName].find(f=>f===fieldName)) {
        throw new Error(`Invalid field for RevisionsDiff: ${collectionName}.${fieldName}`);
      }
      
      const collection = context[collectionName];
      
      const documentUnfiltered = await collection.loader.load(id);
      
      // Check that the user has access to the document
      const document = Users.restrictViewableFields(currentUser, collection, documentUnfiltered);
      if (!document) {
        throw new Error(`Could not find document: ${id}`);
      }
      
      // Load the revisions
      const beforeUnfiltered = await Revisions.findOne({
        documentId: id,
        version: beforeRev,
        fieldName: fieldName,
      });
      const afterUnfiltered = await Revisions.findOne({
        documentId: id,
        version: afterRev,
        fieldName: fieldName,
      });
      const before = Users.restrictViewableFields(currentUser, Revisions, beforeUnfiltered);
      const after = Users.restrictViewableFields(currentUser, Revisions, afterUnfiltered);
      if (!before || !beforeUnfiltered) {
        throw new Error(`Could not find revision: ${beforeRev}`);
      }
      if (!after || !afterUnfiltered) {
        throw new Error(`Could not find revision: ${afterRev}`);
      }
      
      // Diff the revisions
      const diffHtmlUnsafe = diff(before.html, after.html);
      
      // Sanitize (in case node-htmldiff has any parsing glitches that would
      // otherwise lead to XSS)
      const diffHtml = sanitize(diffHtmlUnsafe);
      return diffHtml;
    }
  },
});
addGraphQLQuery('RevisionsDiff(collectionName: String, fieldName: String, id: String, beforeRev: String, afterRev: String): String');

