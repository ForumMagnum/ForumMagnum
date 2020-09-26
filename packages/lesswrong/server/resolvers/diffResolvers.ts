import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { diff } from '../vendor/node-htmldiff/htmldiff';
import { Revisions } from '../../lib/collections/revisions/collection';
import { sanitize } from '../vulcan-lib/utils';
import { editableCollections, editableCollectionsFields, } from '../../lib/editor/make_editable';
import { getPrecedingRev } from '../editor/make_editable_callbacks';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import cheerio from 'cheerio';

addGraphQLResolvers({
  Query: {
    // Diff resolver
    // After revision required, before revision optional (if not provided, diff
    // is against the preceding revision, whatever that is.)
    async RevisionsDiff(root: void, {collectionName, fieldName, id, beforeRev, afterRev, trim}: { collectionName: string, fieldName: string, id: string, beforeRev: string|null, afterRev: string, trim: boolean }, context: ResolverContext): Promise<string> {
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
      const document = await accessFilterSingle(currentUser, collection, documentUnfiltered, context);
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
        beforeUnfiltered = await getPrecedingRev(afterUnfiltered);
      }
      
      if (!beforeUnfiltered || !afterUnfiltered)
        return "";
      
      const before: DbRevision|null = await accessFilterSingle(currentUser, Revisions, beforeUnfiltered, context);
      const after: DbRevision|null = await accessFilterSingle(currentUser, Revisions, afterUnfiltered, context);
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

export const diffHtml = (before: string, after: string, trim: boolean): string => {
  // Diff the revisions
  const diffHtmlUnsafe = diff(before, after);
  
  const $ = cheerio.load(diffHtmlUnsafe)
  if (trim) {
    $('body').children().each(function(i, elem) {
      const e = $(elem)
      if (!e.find('ins').length && !e.find('del').length) {
        e.remove()
      }
    })
  }

  // Sanitize (in case node-htmldiff has any parsing glitches that would
  // otherwise lead to XSS)
  const diffHtml = sanitize($.html());
  return diffHtml;
}

addGraphQLQuery('RevisionsDiff(collectionName: String!, fieldName: String!, id: String, beforeRev: String, afterRev: String!, trim: Boolean): String');

