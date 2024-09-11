import {addGraphQLMutation, addGraphQLResolvers} from '../../lib/vulcan-lib';
import { encodeIntlError} from '../../lib/vulcan-lib/utils';
import { userCanModerateComment } from "../../lib/collections/users/helpers";
import { accessFilterMultiple, accessFilterSingle, augmentFieldsDict } from '../../lib/utils/schemaUtils';
import { createAdminContext, createMutator, runFragmentQuery, updateMutator } from '../vulcan-lib';
import { Comments } from '../../lib/collections/comments';
import {CommentsRepo} from "../repos";
import { createPaginatedResolver } from './paginatedResolver';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { defineQuery } from '../utils/serverGraphqlUtil';
import uniqBy from 'lodash/uniqBy';
import sampleSize from 'lodash/sampleSize';
import { isLWorAF } from '../../lib/instanceSettings';
import { fetchFragmentSingle } from '../fetchFragment';
import DoppelComments from '@/lib/collections/doppelComments/collection';
import Users from '@/lib/collections/users/collection';
import { constructMessageHistory } from '../autocompleteEndpoint';
import { Posts } from '@/lib/collections/posts';
import { getAnthropicPromptCachingClientOrThrow } from '../languageModels/anthropicClient';
import { markdownToHtmlSimple } from '@/lib/editor/utils';
import { captureException, captureMessage } from '@sentry/core';
import { Severity } from '@sentry/types';
import { userHasDoppelComments } from '@/lib/betas';
import { getWithCustomLoader, getWithLoader } from '@/lib/loaders';
import groupBy from 'lodash/groupBy';

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
  ): Promise<DbComment[]> => {
    const recencyFactor = isLWorAF ? 175_000 : 250_000;
    return context.repos.comments.getPopularComments({limit, recencyFactor});
  },
  cacheMaxAgeMs: 300000, // 5 mins
});

type TopicRecommendation = {
  comment: DbComment,
  yourVote?: string,
  theirVote?: string,
  recommendationReason: string
}

defineQuery({
  name: "GetTwoUserTopicRecommendations",
  resultType: "[TopicRecommendation]",
  argTypes: "(userId: String!, targetUserId: String!, limit: Int!)",
  schema: `
    type TopicRecommendation {
      comment: Comment,
      yourVote: String,
      theirVote: String,
      recommendationReason: String
    }
  `,
  fn: async (root: void, {userId, targetUserId, limit}: {userId: string, targetUserId: string, limit: number}, context: ResolverContext): Promise<TopicRecommendation[]> => {

    const bensInterestingDisagreementsCommentId = 'NtsPs9wcwrpeK6KYL'; // LW only! This is site specific to get the popular comments on the Bens Interesting Disagreements post
    const worthwhileOpenAIDisagreementsCommentId = 'xvCYLgygAXqip2kXt';

    const getIntersectingUsersVotesOnPoll = async (userId: string, targetUserId: string, pollCommentId: string) => {
      const comments = await context.repos.comments.getPopularPollCommentsWithTwoUserVotes(userId, targetUserId, limit, pollCommentId)
      const result = comments.map(comment => ({comment, recommendationReason: "You both reacted on this comment", yourVote: comment.yourVote, theirVote: comment.theirVote}));
      return result
    }

    const getUserVotesOnPoll = async (userId: string, pollCommentId: string, recommendationReason: string, whoseVote: "you"|"they") => {
      const comments = await context.repos.comments.getPopularPollCommentsWithUserVotes(userId, limit * 3, pollCommentId)
      const sampled = sampleSize(comments, Math.round(limit / 2))
      const result = sampled.map(comment => {
        return whoseVote === "you" 
          ? {comment, recommendationReason: recommendationReason, yourVote: comment.userVote }
          : {comment, recommendationReason: recommendationReason, theirVote: comment.userVote};
      });
      return result
    }

    const getPopularVotesOnPoll = async (pollCommentId: string, recommendationReason: string) => {
      const comments = await context.repos.comments.getPopularPollComments(limit * 3, pollCommentId)
      const sampled = sampleSize(comments, limit)
      const result = sampled.map(comment => ({comment, recommendationReason: recommendationReason}));
      return result
    }

    // iterate through different lists of comments. return as soon as we've accumulated enough to meet the limit
    async function* commentSources() {
      yield await getIntersectingUsersVotesOnPoll(userId, targetUserId, bensInterestingDisagreementsCommentId);
      yield await getIntersectingUsersVotesOnPoll(userId, targetUserId, worthwhileOpenAIDisagreementsCommentId);
      yield await getUserVotesOnPoll(targetUserId, bensInterestingDisagreementsCommentId, "They reacted on this comment", "they"); 
      yield await getUserVotesOnPoll(targetUserId, worthwhileOpenAIDisagreementsCommentId, "They reacted on this comment", "they");
      yield await getUserVotesOnPoll(userId, bensInterestingDisagreementsCommentId, "You reacted on this comment", "you");
      yield await getPopularVotesOnPoll(bensInterestingDisagreementsCommentId, "This comment is popular");
    }
    
    let recommendedComments: TopicRecommendation[] = []
    
    for await (const source of commentSources()) {
      const rawComments = source.map(({comment}) => comment);

      const newAnnotatedComments = (await accessFilterMultiple(context.currentUser, context.Comments, rawComments, context))
        .flatMap(comment => source.find(({comment: rawComment}) => rawComment._id === comment._id) || []);

      recommendedComments = uniqBy([...recommendedComments, ...newAnnotatedComments], ({comment}) => comment._id).slice(0, limit);
      if (recommendedComments.length >= limit) {
        break;
      }
    }

    return recommendedComments
  },
});

defineQuery({
  name: "UsersRecommendedCommentsOfTargetUser",
  resultType: "[Comment]",
  argTypes: "(userId: String!, targetUserId: String!, limit: Int!)",
  fn: async (root: void, {userId, targetUserId, limit}: {userId: string, targetUserId: string, limit: number}, context: ResolverContext) => {
    const { currentUser, repos } = context
    if (!currentUser) {
      throw new Error('Must be logged in to view recommended comments of target user')
    }

    const comments = await repos.comments.getUsersRecommendedCommentsOfTargetUser(userId, targetUserId, limit)
    return await accessFilterMultiple(currentUser, Comments, comments, context)
  },
});

augmentFieldsDict(Comments, {
  postVersion: {
    onCreate: async ({newDocument}) => {
      if (!newDocument.postId) {
        return "1.0.0";
      }
      const post = await fetchFragmentSingle({
        collectionName: "Posts",
        fragmentName: "PostsRevision",
        currentUser: null,
        selector: {_id: newDocument.postId},
      });
      return (post && post.contents && post.contents.version) || "1.0.0";
    },
  },
  doppelComments: {
    resolveAs: {
      type: '[DoppelComment]',
      resolver: async (dbComment, context: ResolverContext) => {
        const {DoppelComments, currentUser} = context
        if (!userHasDoppelComments(currentUser)) return []
        // This should always be a single user
        const [user] = await getWithLoader(context, Users, "usersByIdsForDoppelComments", {}, "_id", dbComment.userId, {karma: 1})
        const doppelComments = await getWithCustomLoader(context, "doppelCommentsForComment", dbComment._id, async (commentIds: string[]) => {
          if (!user) return []
          if (user.karma < 10_000) return []
          const doppelComments = await DoppelComments.find({commentId: {$in: commentIds}}).fetch()
          const doppelsByComment = groupBy(doppelComments, 'commentId')
          return commentIds.map(commentId => doppelsByComment[commentId] ?? [])
        })
        if (doppelComments.length < 2) {
          // We'll make 'em for next time
          void [createDoppelComment(dbComment, user), createDoppelComment(dbComment, user)]
        }
        return doppelComments
      }
    }
  }
});

const createDoppelComment = async (dbComment: DbComment, user: DbUser) => {
  const [interestingGwernComment, eightShortStudies, topUserComment, topUserPost] = await Promise.all([
    Comments.findOne({ _id: 'hxMNNJRF6o644aNTa'}),
    Posts.findOne({_id: 'gFMH3Cqw4XxwL69iy'}),
    Comments.findOne({ userId: dbComment.userId }, { sort: { 'baseScore': -1 }, limit: 1, projection: { '_id': 1 } }),
    Posts.findOne({ userId: dbComment.userId }, { sort: { 'baseScore': -1 }, limit: 1, projection: { '_id': 1 } }),
  ])
  if (!interestingGwernComment || !eightShortStudies || !topUserComment || !topUserPost) {
    const docIdentifiers = ["interestingGwernComment", "eightShortStudies", "topUserComment", "topUserPost"]
    const failedToFind = [interestingGwernComment, eightShortStudies, topUserComment, topUserPost].flatMap((doc, i) => !doc ? [docIdentifiers[i]] : [])
    captureMessage(`Failed to find all necessary documents for doppel comments on ${dbComment._id}. Failed to find: ${failedToFind.join('\n')}`, Severity.Warning)
    return
  }
  const messageHistory = await constructMessageHistory(
    '',
    [interestingGwernComment, topUserComment].map(comment => comment._id),
    [eightShortStudies, topUserPost].map(post => post._id),
    user,
    createAdminContext(),
    dbComment.parentCommentId ?? undefined,
    dbComment.postId ?? undefined,
  )

  const client = getAnthropicPromptCachingClientOrThrow()

  let res = null
  try {
    res = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2000,
      system: "The assistant is in CLI simulation mode, and responds to the user's CLI commands only with the output of the command.",
      messages: messageHistory,
      stop_sequences: ['---'],
    })
  } catch (e) {
    captureException(e)
    return
  }

  if (res.content[0].type === 'tool_use') {
    captureMessage(`The LLM thinks this comment (${dbComment._id}) would be a tool use. That's surprising.`, Severity.Warning)
    return
  }

  const html = markdownToHtmlSimple(res.content[0].text)

  void createMutator({
    collection: DoppelComments,
    document: {
      commentId: dbComment._id,
      content: html,
    },
    context: createAdminContext(),
  })
}
