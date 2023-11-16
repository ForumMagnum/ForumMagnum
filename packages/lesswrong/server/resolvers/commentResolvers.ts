import {addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema} from '../../lib/vulcan-lib';
import { encodeIntlError} from '../../lib/vulcan-lib/utils';
import { userCanModerateComment } from "../../lib/collections/users/helpers";
import { accessFilterMultiple, accessFilterSingle } from '../../lib/utils/schemaUtils';
import { updateMutator } from '../vulcan-lib';
import { Comments } from '../../lib/collections/comments';
import {CommentsRepo} from "../repos";
import { createPaginatedResolver } from './paginatedResolver';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { defineQuery } from '../utils/serverGraphqlUtil';
import uniqBy from 'lodash/uniqBy';

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


createPaginatedResolver({
  name: "CommentsWithReacts",
  graphQLType: "Comment",
  callback: async (context: ResolverContext, limit: number): Promise<DbComment[]> => {
    const commentsRepo = new CommentsRepo()
    const commentsWithReacts = await commentsRepo.getCommentsWithReacts(limit);
    return filterNonnull(commentsWithReacts);
  }
})

createPaginatedResolver({
  name: "PopularComments",
  graphQLType: "Comment",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbComment[]> => context.repos.comments.getPopularComments({limit}),
  cacheMaxAgeMs: 300000, // 5 mins
});

defineQuery({
  name: "GetTwoUserTopicRecommendations",
  resultType: "[Comment]",
  argTypes: "(userId: String!, targetUserId: String!, limit: Int!)",
  schema: `
    type TopicRecommendationData { 
      comments: [Comment]
    }
  `,
  fn: async (root: void, {userId, targetUserId, limit}: {userId: string, targetUserId: string, limit: number}, context: ResolverContext): Promise<DbComment[]> => {

    // iterate through different lists of comments. return as soon as we've accumulated enough to meet the limit
    async function* commentSources() {
      yield context.repos.comments.getPopularPollCommentsWithTwoUserVotes(userId, targetUserId, limit);
      yield context.repos.comments.getPopularPollCommentsWithUserVotes(userId, limit);
      yield context.repos.comments.getPopularPollCommentsWithUserVotes(targetUserId, limit);
      yield context.repos.comments.getPopularPollComments(limit);
    }
    
    let recommendedComments : DbComment[] = []
    
    for await (const source of commentSources()) {
      recommendedComments = uniqBy([...recommendedComments, ...source], comment => comment._id).slice(0, limit);
      if (recommendedComments.length >= limit) {
        break;
      }
    }

    return accessFilterMultiple(context.currentUser, context.Comments, recommendedComments, context);
  },
});
