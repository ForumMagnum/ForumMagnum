import { addGraphQLMutation, addGraphQLResolvers, runCallbacks, runCallbacksAsync, Utils } from '../../lib/vulcan-lib';
import Users from "../../lib/collections/users/collection";
import { accessFilterSingle } from '../../lib/utils/schemaUtils';

const specificResolvers = {
  Mutation: {
    async moderateComment(root, { commentId, deleted, deletedPublic, deletedReason}, context: ResolverContext) {
      const {currentUser} = context;
      const comment = context.Comments.findOne(commentId)
      if (!comment) throw new Error("Invalid commentId");
      const post = context.Posts.findOne(comment.postId)
      if (!post) throw new Error("Cannot find post");
      
      if (currentUser && Users.canModerateComment(currentUser, post, comment)) {

        let set: Record<string,any> = {deleted: deleted}
        if (deleted) {
          set.deletedPublic = deletedPublic;
          set.deletedDate = comment.deletedDate || new Date();
          set.deletedReason = deletedReason;
          set.deletedByUserId = currentUser._id;
        } else { //When you undo delete, reset all delete-related fields
          set.deletedPublic = false;
          set.deletedDate = null;
          set.deletedReason = "";
          set.deletedByUserId = null;
        }
        let modifier = { $set: set };
        modifier = runCallbacks('comments.moderate.sync', modifier);
        context.Comments.update({_id: commentId}, modifier);
        const updatedComment = await context.Comments.findOne(commentId)
        runCallbacksAsync('comments.moderate.async', updatedComment, comment, context);
        return await accessFilterSingle(context.currentUser, context.Comments, updatedComment, context);
      } else {
        throw new Error(Utils.encodeIntlError({id: `app.user_cannot_moderate_post`}));
      }
    }
  }
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('moderateComment(commentId: String, deleted: Boolean, deletedPublic: Boolean, deletedReason: String): Comment');
