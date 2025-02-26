import { registerMigration, dropUnusedField } from './migrationUtils';
import { Posts } from '../../lib/collections/posts/collection';
import { Comments } from '../../lib/collections/comments/collection';
import Users from '../../lib/collections/users/collection';

export default registerMigration({
  name: "dropObsoleteColumns",
  dateWritten: "2019-04-10",
  idempotent: true,
  action: async () => {
    // Denormalized field from vulcan example-forum, bulky and never used
    await dropUnusedField(Posts, "commenters");
    await dropUnusedField(Posts, "upvoters");
    await dropUnusedField(Posts, "downvoters");
    
    await dropUnusedField(Users, "upvotedComments");
    await dropUnusedField(Users, "downvotedComments");
    await dropUnusedField(Users, "upvotedPosts");
    await dropUnusedField(Users, "downvotedPosts");
    
    // Dropped or resolver-only fields since the Revisions patch
    await dropUnusedField(Posts, "htmlBody");
    await dropUnusedField(Posts, "body");
    await dropUnusedField(Posts, "content"); //Not to be confused with contents with an s
    await dropUnusedField(Posts, "htmlHighlight");
    
    await dropUnusedField(Comments, "body");
    await dropUnusedField(Comments, "htmlBody");
  }
});
