/*
 * This migration accompanies a change to sunshineNewPosts, to make all posts
 * without reviewedByUserId show up in the sidebar. This allows posts to be put
 * onto the frontpage by default. Given that change, we should clean up
 * historical posts to make sure they're marked as having been reviewed by
 * someone.
 *
 * +---------------------------------------------------------------------------
 * | NOTICE: You'll want to make sure there are no unreviwed posts in the
 * | sidebar before you run this!
 * +---------------------------------------------------------------------------
 */
import { registerMigration, forEachDocumentBatchInCollection } from './migrationUtils';
import Posts from '../../lib/collections/posts/collection';
import { postStatuses } from '../../lib/collections/posts/constants';
import { ForumOptions, forumSelect } from '../../lib/forumTypeUtils';

// TODO: LessWrong, you'll want to set this
// lw-look-here
const defaultReviewerByForum: ForumOptions<string | null> = {
  LessWrong: "XtphY3uYHwruKqDyG",
  AlignmentForum: null,            // Shoudn't be necessary to set
  EAForum: '9qZsZAzbC2zxsPHzN',    // JP
  default: null,
}
const defaultReviewer = forumSelect(defaultReviewerByForum)

registerMigration({
  name: "guaranteedPostReviewer",
  dateWritten: "2020-11-12",
  idempotent: true,
  action: async () => {
    if (!defaultReviewer) throw new Error("This migration requires a default reviewer")
    await forEachDocumentBatchInCollection({
      collection: Posts,
      batchSize: 100,
      filter: {
        reviewedByUserId: {$exists: false},
        status: postStatuses.STATUS_APPROVED,
        draft: false,
        isFuture: false,
        unlisted: false,
        shortform: false,
        authorIsUnreviewed: false,
        hiddenRelatedQuestion: false,
      },
      callback: async (posts: Array<DbPost>) => {
        // eslint-disable-next-line no-console
        console.log("Migrating post batch");
        const changes = posts.map(post => ({
          updateOne: {
            filter: { _id: post._id },
            update: {$set: {reviewedByUserId: defaultReviewer}}
          }
        }))
        await Posts.rawCollection().bulkWrite(changes, { ordered: false });
      }
    });
  }
});
