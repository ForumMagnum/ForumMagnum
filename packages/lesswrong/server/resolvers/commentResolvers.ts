import { encodeIntlError} from '../../lib/vulcan-lib/utils';
import { userCanModerateComment } from "../../lib/collections/users/helpers";
import { accessFilterMultiple, accessFilterSingle } from '../../lib/utils/schemaUtils';
import CommentsRepo from '../repos/CommentsRepo';
import { createPaginatedResolver } from './paginatedResolver';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { isLWorAF } from '../../lib/instanceSettings';
import gql from 'graphql-tag';
import { updateComment } from '../collections/comments/mutations';
import { getEmbeddingsFromApi } from '../voyage/client';
import { userIsAdmin } from '@/lib/vulcan-users/permissions';
import { jsonArrayContainsSelector } from '@/lib/utils/viewConstants';

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
    const recencyFactor = isLWorAF() ? 175_000 : 250_000;
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
  ...popularCommentsQuery,
  async CommentEmbeddingSearch(root: void, args: { query: string, scoreBias: number | null }, context: ResolverContext) {
    const { repos, currentUser } = context;

    if (!userIsAdmin(currentUser)) {
      throw new Error('You must be an admin to search comments by embedding');
    }

    const { query, scoreBias } = args;
    // TODO: figure out what we want to do about caching or long-term storage of "search query" embeddings
    const { embeddings } = await getEmbeddingsFromApi(query, 'query');

    const comments = await repos.commentEmbeddings.searchCommentsByEmbedding(embeddings, { scoreBias: scoreBias ?? 0 });
    return await accessFilterMultiple(context.currentUser, 'Comments', comments, context);
  },
  async CommentEmbeddingSimilaritySearch(root: void, args: { commentId: string, scoreBias: number | null }, context: ResolverContext) {
    const { CommentEmbeddings, repos, currentUser } = context;

    if (!userIsAdmin(currentUser)) {
      throw new Error('You must be an admin to search comments by embedding');
    }

    const { commentId, scoreBias } = args;
    
    // Get the comment's embeddings from the database
    const commentEmbedding = await CommentEmbeddings.findOne({ commentId });
    if (!commentEmbedding || !commentEmbedding.embeddings) {
      throw new Error(`No embedding found for comment ${commentId}`);
    }

    const comments = await repos.commentEmbeddings.searchCommentsByEmbedding(commentEmbedding.embeddings, { scoreBias: scoreBias ?? 0 });
    return await accessFilterMultiple(context.currentUser, 'Comments', comments, context);
  },
  async CommentPingbacks(root: void, args: { commentId: string }, context: ResolverContext) {
    const { commentId } = args;
    const { Comments, Posts, Users, Tags } = context;

    const selector = jsonArrayContainsSelector("pingbacks.Comments", commentId);
    console.log({ selector });

    const [comments, posts, tags] = await Promise.all([
      Comments.find(selector).fetch(),
      Posts.find(selector).fetch(),
      // Users.find(selector).fetch(),
      Tags.find(selector).fetch(),
    ]);

    return {
      comments: await accessFilterMultiple(context.currentUser, 'Comments', comments, context),
      posts: await accessFilterMultiple(context.currentUser, 'Posts', posts, context),
      // users: await accessFilterMultiple(context.currentUser, 'Users', users, context),
      tags: await accessFilterMultiple(context.currentUser, 'Tags', tags, context),
    };
  }
}

export const graphqlTypeDefs = gql`
  type CommentPingbackDocuments {
    comments: [Comment!]!
    posts: [Post!]!
    # users: [User!]!
    tags: [Tag!]!
  }
  extend type Query {
    CommentEmbeddingSearch(query: String!, scoreBias: Float): [Comment!]!
    CommentEmbeddingSimilaritySearch(commentId: String!, scoreBias: Float): [Comment!]!
    CommentPingbacks(commentId: String!): CommentPingbackDocuments!
  }
  extend type Mutation {
    moderateComment(commentId: String, deleted: Boolean, deletedPublic: Boolean, deletedReason: String): Comment
  }
  ${commentsWithReactsTypeDefs}
  ${popularCommentsTypeDefs}
`

