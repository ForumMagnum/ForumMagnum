/* eslint-disable no-console */
import Comments from "../collections/comments/collection";
import { updateComment } from "../collections/comments/mutations";
import { createAdminContext } from "../vulcan-lib/createContexts";

/**
 * Find comments which have a parentCommentId but not a postId or tagId, and
 * fill in the postId/tagId by copying them from the parent.
 */
export async function fixMisparentedComments() {
  console.log("Checking for reply comments with no post/tag");
  const orphanedComments = await Comments.find({ 
    postId: null,
    tagId: null,
    parentCommentId: {$ne: null},
  }).fetch();
  
  const context = createAdminContext();
  
  console.log(`Fixing ${orphanedComments.length} comments`);
  for (const orphanedComment of orphanedComments) {
    if (!orphanedComment.parentCommentId) continue;
    const parent = await Comments.findOne({_id: orphanedComment.parentCommentId});
    if (parent) {
      const {postId, tagId} = parent;
      await updateComment({
        selector: { _id: orphanedComment._id },
        data: {
          postId, tagId
        }
      }, context);
    }
  }
}
