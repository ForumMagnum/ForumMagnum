import { encodeIntlError} from '../../lib/vulcan-lib/utils';
import { userCanModerateComment } from "../../lib/collections/users/helpers";
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import CommentsRepo from '../repos/CommentsRepo';
import { createPaginatedResolver } from './paginatedResolver';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { isLWorAF } from '../../lib/instanceSettings';
import gql from 'graphql-tag';
import { updateComment } from '../collections/comments/mutations';

const { Query: commentsWithReactsQuery, typeDefs: commentsWithReactsTypeDefs } = createPaginatedResolver({
  name: "CommentsWithReacts",
  graphQLType: "Comment",
  callback: async (context: ResolverContext, limit: number): Promise<DbComment[]> => {
    const commentsRepo = new CommentsRepo()
    const commentsWithReacts = await commentsRepo.getCommentsWithReacts(limit);
    return filterNonnull(commentsWithReacts);
  }
})

const { Query: popularCommentsQuery, typeDefs: popularCommentsTypeDefs } = createPaginatedResolver({
  name: "PopularComments",
  graphQLType: "Comment",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbComment[]> => {
    const recencyFactor = isLWorAF ? 175_000 : 250_000;
    return context.repos.comments.getPopularComments({limit, recencyFactor});
  },
  cacheMaxAgeMs: 300000, // 5 mins
});

export const graphqlMutations = {
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
      let set: Record<string,any> = {}
      
      // Handle editing delete reason on already-deleted comments
      if (deleted && comment.deleted) {
        // Just updating metadata on an already-deleted comment
        if (deletedPublic !== undefined) {
          set.deletedPublic = deletedPublic;
        }
        if (deletedReason !== undefined) {
          set.deletedReason = deletedReason;
        }
        // Don't update deletedDate or deletedByUserId when just editing the reason
      } else if (deleted && !comment.deleted) {
        // Deleting a comment
        set.deleted = true;
        if (deletedPublic !== undefined) {
          set.deletedPublic = deletedPublic;
        }
        set.deletedDate = new Date();
        if (deletedReason !== undefined) {
          set.deletedReason = deletedReason;
        }
        set.deletedByUserId = currentUser._id;
      } else if (!deleted && comment.deleted) {
        // Undeleting a comment
        set.deleted = false;
        set.deletedPublic = false;
        set.deletedDate = null;
        set.deletedReason = "";
        set.deletedByUserId = null;
      } else {
        // !deleted && !comment.deleted - no change to deletion status
        // This shouldn't normally happen but handle it gracefully
        return comment;
      }
      
      const updatedComment = await updateComment({
        data: set,
        selector: { _id: commentId },
      }, context);
      return await accessFilterSingle(context.currentUser, 'Comments', updatedComment, context);
    } else {
      throw new Error(encodeIntlError({id: `app.user_cannot_moderate_post`}));
    }
  }
}

export const graphqlQueries = {
  ...commentsWithReactsQuery,
  ...popularCommentsQuery
}

export const graphqlTypeDefs = gql`
  extend type Mutation {
    moderateComment(commentId: String, deleted: Boolean, deletedPublic: Boolean, deletedReason: String): Comment
  }
  ${commentsWithReactsTypeDefs}
  ${popularCommentsTypeDefs}
`

