import { addGraphQLResolvers, addGraphQLQuery } from '../../lib/vulcan-lib/graphql';
import { diff } from '../vendor/node-htmldiff/htmldiff';
import { Utils } from '../vulcan-lib';
import { Revisions } from '../../lib/collections/revisions/collection';
import { sanitize } from '../vulcan-lib/utils';
import Users from '../../lib/collections/users/collection';

addGraphQLResolvers({
  Query: {
    async PostsDiff(root, {postId, beforeRev, afterRev}: { postId: string, beforeRev: string, afterRev: string }, context) {
      const {currentUser, Posts}: {currentUser: DbUser|null, Posts: CollectionBase<DbPost>} = context;
      const postUnfiltered: DbPost|null = await Posts.loader.load(postId);
      if (!postUnfiltered) return null;
      
      // Check that the user has access to the post
      const post = Users.restrictViewableFields(currentUser, Posts, postUnfiltered);
      if (!post) return null;
      
      // Load the revisions
      const beforeUnfiltered = await Revisions.findOne({
        documentId: postId,
        version: beforeRev,
        fieldName: "contents",
      });
      const afterUnfiltered = await Revisions.findOne({
        documentId: postId,
        version: afterRev,
        fieldName: "contents",
      });
      const before = Users.restrictViewableFields(currentUser, Revisions, beforeUnfiltered);
      const after = Users.restrictViewableFields(currentUser, Revisions, afterUnfiltered);
      if (!before || !after)
        return null;
      
      // Diff the revisions
      const diffHtmlUnsafe = diff(before.html, after.html);
      
      // Sanitize (in case node-htmldiff has any parsing glitches that would
      // otherwise lead to XSS)
      const diffHtml = sanitize(diffHtmlUnsafe);
      return diffHtml;
    }
  },
});
addGraphQLQuery('PostsDiff(postId: String, beforeRev: String, afterRev: String): String');

