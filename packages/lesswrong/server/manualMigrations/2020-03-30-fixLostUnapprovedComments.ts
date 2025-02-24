import { registerMigration } from './migrationUtils';
import { Comments } from '../../lib/collections/comments/collection';
import Users from '../../lib/collections/users/collection';
import * as _ from 'underscore';

// There was a bug where, when a user is approved, only one post/comment is
// marked as reviewed, rather than all of them. So if they posted multiple times
// before being reviewed, some of their comments would be mis-marked.
//
// (Only done for comments, not posts, because posts had proper UI for showing
// that they were awaiting moderation, and suddenly posting old posts would
// mostly create spam and duplicates.)
export default registerMigration({
  name: "fixLostUnapprovedComments",
  dateWritten: "2020-03-30",
  idempotent: true,
  action: async () => {
    const unreviewedComments = await Comments.find({authorIsUnreviewed: true, deleted: false}).fetch();
    const authorIds = _.uniq(unreviewedComments.map(comment => comment.userId));
    
    const authors = await Users.find({_id: {$in: authorIds}}).fetch();
    const authorsById: Record<string,DbUser> = {};
    for (let author of authors)
      authorsById[author._id] = author;
    
    const commentsToMarkReviewed = _.filter(unreviewedComments,
      comment => !authorsById[comment.userId].banned)
      .map(comment => comment._id);
    
    // eslint-disable-next-line no-console
    console.log(commentsToMarkReviewed.length+" comments to mark as reviewed");
    await Comments.rawUpdateMany({_id: {$in: commentsToMarkReviewed}}, {$set: {authorIsUnreviewed: false}}, {multi: true});
  }
});
