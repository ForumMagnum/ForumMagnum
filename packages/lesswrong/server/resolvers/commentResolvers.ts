import {addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema} from '../../lib/vulcan-lib';
import { encodeIntlError} from '../../lib/vulcan-lib/utils';
import { userCanModerateComment } from "../../lib/collections/users/helpers";
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { updateMutator } from '../vulcan-lib';
import { Comments } from '../../lib/collections/comments';
import {CommentsRepo} from "../repos";

const specificResolvers = {
  Mutation: {
    async moderateComment(root: void, { commentId, deleted, deletedPublic, deletedReason}: {
      commentId: string, deleted: boolean, deletedPublic: boolean, deletedReason: string
    }, context: ResolverContext) {
      const {currentUser} = context;
      const comment = await context.Comments.findOne(commentId)
      if (!comment) throw new Error("Invalid commentId");
      const post = comment.postId ? await context.Posts.findOne(comment.postId) : null;
      const tag = comment.tagId ? await context.Tags.findOne(comment.tagId) : null;
      
      if (currentUser && userCanModerateComment(currentUser, post, tag, comment))
      {
        let set: Record<string,any> = {deleted: deleted}
        if (deleted) {
          if(deletedPublic !== undefined) {
            set.deletedPublic = deletedPublic;
          }
          set.deletedDate = comment.deletedDate || new Date();
          if(deletedReason !== undefined) {
            set.deletedReason = deletedReason;
          }
          set.deletedByUserId = currentUser._id;
        } else { //When you undo delete, reset all delete-related fields
          set.deletedPublic = false;
          set.deletedDate = null;
          set.deletedReason = "";
          set.deletedByUserId = null;
        }
        
        const {data: updatedComment} = await updateMutator({
          collection: Comments,
          documentId: commentId,
          set,
          currentUser: currentUser,
          validate: false,
          context
        });
        return await accessFilterSingle(context.currentUser, context.Comments, updatedComment, context);
      } else {
        throw new Error(encodeIntlError({id: `app.user_cannot_moderate_post`}));
      }
    }
  }
};

addGraphQLResolvers(specificResolvers);
addGraphQLMutation('moderateComment(commentId: String, deleted: Boolean, deletedPublic: Boolean, deletedReason: String): Comment');


addGraphQLResolvers({
  Query: {
    async CommentsWithReacts(root: void, args: {limit: number|undefined}, context: ResolverContext) {
      const commentsRepo = new CommentsRepo()
      const comments = await commentsRepo.getCommentsWithReacts(args.limit??50)
      return {
        comments: comments
      }
    }
  }
})

addGraphQLSchema(`
  type CommentsWithReactsResult {
   comments: [Comment!]
  }
`);

addGraphQLQuery('CommentsWithReacts(limit: Int): CommentsWithReactsResult')
