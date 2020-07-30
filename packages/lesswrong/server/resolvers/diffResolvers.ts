import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { diff } from '../vendor/node-htmldiff/htmldiff';
import { Revisions } from '../../lib/collections/revisions/collection';
import { sanitize } from '../vulcan-lib/utils';
import { editableCollections, editableCollectionsFields } from '../../lib/editor/make_editable';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import cheerio from 'cheerio';

addGraphQLResolvers({
  Query: {
    async RevisionsDiff(root, {collectionName, fieldName, id, beforeRev, afterRev}: { collectionName: string, fieldName: string, id: string, beforeRev: string, afterRev: string }, context: ResolverContext): Promise<string> {
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
      
      const before: DbRevision|null = await accessFilterSingle(currentUser, Revisions, beforeUnfiltered, context);
      const after: DbRevision|null = await accessFilterSingle(currentUser, Revisions, afterUnfiltered, context);
      if (!before || !beforeUnfiltered) {
        throw new Error(`Could not find revision: ${beforeRev}`);
      }
      if (!after || !afterUnfiltered) {
        throw new Error(`Could not find revision: ${afterRev}`);
      }
      
      // Diff the revisions
      const diffHtmlUnsafe = diff(before.html, after.html);
      
      const $ = cheerio.load(diffHtmlUnsafe)

      $('body').children().each(function(i, elem) {
        console.log()
        // console.log(elem)
        const e = $(this)
        console.log("A", i, e)
        if (e.find('ins').length) {
          console.log(e.find('ins').length)
          return
        }
        e.remove()
      })
      // $('del').each(del => {
      //   console.log("b", del)
      //   console.log($(del).html())
      // });

      // Sanitize (in case node-htmldiff has any parsing glitches that would
      // otherwise lead to XSS)
      const diffHtml = sanitize($.html());
      return diffHtml;
    }
  },
});

addGraphQLQuery('RevisionsDiff(collectionName: String, fieldName: String, id: String, beforeRev: String, afterRev: String): String');

