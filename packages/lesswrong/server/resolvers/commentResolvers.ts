import { addGraphQLMutation, addGraphQLResolvers, runCallbacks, runCallbacksAsync, Utils } from '../../lib/vulcan-lib';
import { Comments } from '../../lib/collections/comments/collection';
import { Posts } from '../../lib/collections/posts/collection';
import Users from "../../lib/collections/users/collection";
import { addFieldsDict, accessFilterSingle } from '../../lib/utils/schemaUtils';
import { loadRevision } from '../revisionsCache';

addFieldsDict(Comments, {
  postVersion: {
    onCreate: async ({newDocument}: {newDocument: DbComment}) => {
      if (!newDocument.postId) return "1.0.0";
      const post = await Posts.findOne({_id: newDocument.postId})
      const contents = await loadRevision({collection: Posts, doc: post});
      return contents?.version || "1.0.0"
    }
  },
  wordCount: {
    type: Number,
    resolveAs: {
      type: "Int",
      resolver: async (doc: DbComment, args: void, context: ResolverContext): Promise<number> => {
        const contents = await loadRevision({collection: Comments, doc});
        if (!contents) return 0;
        return contents.wordCount;
      }
    }
  },
  htmlBody: {
    type: String,
    resolveAs: {
      type: "String",
      resolver: async (doc: DbComment, args: void, { Posts }: ResolverContext): Promise<string> => {
        const contents = await loadRevision({collection: Comments, doc});
        if (!contents) return "";
        return contents.html;
      }
    }
  },
});

addGraphQLResolvers({
  Mutation: {
    async moderateComment(root, { commentId, deleted, deletedPublic, deletedReason}, context: ResolverContext) {
      const {currentUser} = context;
      const comment = context.Comments.findOne(commentId)
      if (!comment) throw new Error("Invalid commentId");
      const post = comment.postId && context.Posts.findOne(comment.postId)
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
        modifier = runCallbacks({
          name: 'comments.moderate.sync',
          iterator: modifier
        });
        context.Comments.update({_id: commentId}, modifier);
        const updatedComment = await context.Comments.findOne(commentId)
        runCallbacksAsync({
          name: 'comments.moderate.async',
          properties: [updatedComment, comment, context]
        });
        return await accessFilterSingle(context.currentUser, context.Comments, updatedComment, context);
      } else {
        throw new Error(Utils.encodeIntlError({id: `app.user_cannot_moderate_post`}));
      }
    }
  }
});

addGraphQLMutation('moderateComment(commentId: String, deleted: Boolean, deletedPublic: Boolean, deletedReason: String): Comment');
