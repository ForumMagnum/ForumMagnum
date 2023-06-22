import { Posts } from '../../lib/collections/posts/collection';
import { sideCommentFilterMinKarma, sideCommentAlwaysExcludeKarma } from '../../lib/collections/posts/constants';
import { Comments } from '../../lib/collections/comments/collection';
import { SideCommentsCache, SideCommentsResolverResult, sideCommentCacheVersion } from '../../lib/collections/posts/schema';
import { augmentFieldsDict, denormalizedField } from '../../lib/utils/schemaUtils'
import { getLocalTime } from '../mapsUtils'
import { isNotHostedHere } from '../../lib/collections/posts/helpers';
import { getDefaultPostLocationFields } from '../posts/utils'
import { matchSideComments } from '../sideComments';
import { captureException } from '@sentry/core';
import { getToCforPost } from '../tableOfContents';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';
import keyBy from 'lodash/keyBy';
import GraphQLJSON from 'graphql-type-json';
import { addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema } from '../vulcan-lib';
import PostsRepo from '../repos/PostsRepo';
import VotesRepo from '../repos/VotesRepo';
import { postIsCriticism } from '../languageModels/autoTagCallbacks';

augmentFieldsDict(Posts, {
  // Compute a denormalized start/end time for events, accounting for the
  // timezone the event's location is in. This is subtly wrong: it computes a
  // correct timestamp, but then the timezone part of that timezone gets lost
  // on the way in/out of the database, so if you use this field, what you're
  // getting is "local time mislabeled as UTC".
  localStartTime: {
    ...denormalizedField({
      needsUpdate: (data) => ('startTime' in data || 'googleLocation' in data),
      getValue: async (post) => {
        if (!post.startTime) return null
        const googleLocation = post.googleLocation || (await getDefaultPostLocationFields(post)).googleLocation
        if (!googleLocation) return null
        return await getLocalTime(post.startTime, googleLocation)
      }
    })
  },
  localEndTime: {
    ...denormalizedField({
      needsUpdate: (data) => ('endTime' in data || 'googleLocation' in data),
      getValue: async (post) => {
        if (!post.endTime) return null
        const googleLocation = post.googleLocation || (await getDefaultPostLocationFields(post)).googleLocation
        if (!googleLocation) return null
        return await getLocalTime(post.endTime, googleLocation)
      }
    })
  },
  tableOfContents: {
    resolveAs: {
      type: GraphQLJSON,
      resolver: async (document: DbPost, args: void, context: ResolverContext) => {
        try {
          return await getToCforPost({document, version: null, context});
        } catch(e) {
          captureException(e);
          return null;
        }
    },
    },
  },
  tableOfContentsRevision: {
    resolveAs: {
      type: GraphQLJSON,
      arguments: 'version: String',
      resolver: async (document: DbPost, args: {version:string}, context: ResolverContext) => {
        const { version=null } = args;
        try {
          return await getToCforPost({document, version, context});
        } catch(e) {
          captureException(e);
          return null;
        }
      },
    }
  },
  sideComments: {
    resolveAs: {
      type: GraphQLJSON,
      resolver: async (post: DbPost, args: void, context: ResolverContext): Promise<SideCommentsResolverResult|null> => {
        if (isNotHostedHere(post)) {
          return null;
        }
        const cache = post.sideCommentsCache as SideCommentsCache|undefined;
        const cacheIsValid = cache
          && cache.generatedAt>post.lastCommentedAt
          && cache.generatedAt > post.contents?.editedAt
          && cache.version === sideCommentCacheVersion;
        let unfilteredResult: {annotatedHtml: string, commentsByBlock: Record<string,string[]>}|null = null;
        
        const now = new Date();
        const comments = await Comments.find({
          ...getDefaultViewSelector("Comments"),
          postId: post._id,
        }).fetch();
        
        if (cacheIsValid) {
          unfilteredResult = {annotatedHtml: cache.annotatedHtml, commentsByBlock: cache.commentsByBlock};
        } else {
          const toc = await getToCforPost({document: post, version: null, context});
          const html = toc?.html || post?.contents?.html
          const sideCommentMatches = await matchSideComments({
            postId: post._id,
            html: html,
            comments: comments.map(comment => ({_id: comment._id, html: comment.contents?.html ?? ""})),
          });
          
          const newCacheEntry = {
            version: sideCommentCacheVersion,
            generatedAt: now,
            annotatedHtml: sideCommentMatches.html,
            commentsByBlock: sideCommentMatches.sideCommentsByBlock,
          }
          
          await Posts.rawUpdateOne({_id: post._id}, {$set: {"sideCommentsCache": newCacheEntry}});
          unfilteredResult = {
            annotatedHtml: sideCommentMatches.html,
            commentsByBlock: sideCommentMatches.sideCommentsByBlock
          };
        }

        const alwaysShownIds = new Set<string>([]);
        alwaysShownIds.add(post.userId);
        if (post.coauthorStatuses) {
          for (let {userId} of post.coauthorStatuses) {
            alwaysShownIds.add(userId);
          }
        }

        const commentsById = keyBy(comments, comment=>comment._id);
        let highKarmaCommentsByBlock: Record<string,string[]> = {};
        let nonnegativeKarmaCommentsByBlock: Record<string,string[]> = {};
        
        for (let blockID of Object.keys(unfilteredResult.commentsByBlock)) {
          const commentIdsHere = unfilteredResult.commentsByBlock[blockID];
          const highKarmaCommentIdsHere = commentIdsHere.filter(commentId => {
            const comment: DbComment = commentsById[commentId];
            if (!comment)
              return false;
            else if (comment.baseScore >= sideCommentFilterMinKarma)
              return true;
            else if (alwaysShownIds.has(comment.userId))
              return true;
            else
              return false;
          });
          if (highKarmaCommentIdsHere.length > 0) {
            highKarmaCommentsByBlock[blockID] = highKarmaCommentIdsHere;
          }
          
          const nonnegativeKarmaCommentIdsHere = commentIdsHere.filter(commentId => {
            const comment: DbComment = commentsById[commentId];
            if (!comment)
              return false;
            else if (alwaysShownIds.has(comment.userId))
              return true;
            else if (comment.baseScore <= sideCommentAlwaysExcludeKarma)
              return false;
            else
              return true;
          });
          if (nonnegativeKarmaCommentIdsHere.length > 0) {
            nonnegativeKarmaCommentsByBlock[blockID] = nonnegativeKarmaCommentIdsHere;
          }
        }
        
        return {
          html: unfilteredResult.annotatedHtml,
          commentsByBlock: nonnegativeKarmaCommentsByBlock,
          highKarmaCommentsByBlock: highKarmaCommentsByBlock,
        }
      }
    },
  },
})


export type PostIsCriticismRequest = {
  title: string,
  contentType: string,
  body: string
}

addGraphQLResolvers({
  Query: {
    async UserReadHistory(root: void, args: {limit: number|undefined}, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Must be logged in to view read history')
      }
      
      const postsRepo = new PostsRepo()
      const posts = await postsRepo.getReadHistoryForUser(currentUser._id, args.limit ?? 10)
      return {
        posts: posts,
      }
    },
    async PostIsCriticism(root: void, { args }: { args: PostIsCriticismRequest }, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        throw new Error('Must be logged in to check post')
      }
            
      return await postIsCriticism(args)
    },
    async DigestPlannerData(root: void, {digestId, startDate, endDate}: {digestId: string, startDate: Date, endDate: Date}, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser || !currentUser.isAdmin) {
        throw new Error('Permission denied')
      }
      const postsRepo = new PostsRepo()
      const eligiblePosts = await postsRepo.getEligiblePostsForDigest(digestId, startDate, endDate)
      if (!eligiblePosts.length) return []

      // TODO: finish implementing this once we figure out what to do with it
      // const votesRepo = new VotesRepo()
      // const votes = await votesRepo.getDigestPlannerVotesForPosts(eligiblePosts.map(p => p._id))
      // console.log('DigestPlannerData votes', votes)
      
      return eligiblePosts.map(post => {
        // const postVotes = votes.find(v => v.postId === post._id)
        // const rating = postVotes ?
        //   Math.round(
        //     ((postVotes.smallUpvoteCount + 2 * postVotes.bigUpvoteCount) - (postVotes.smallDownvoteCount / 2 + postVotes.bigDownvoteCount)) / 10
        //   ) : 0
        
        return {
          post,
          digestPost: {
            _id: post.digestPostId,
            emailDigestStatus: post.emailDigestStatus,
            onsiteDigestStatus: post.onsiteDigestStatus
          },
          rating: 0
        }
      })
    }
  },
})

addGraphQLSchema(`
  type UserReadHistoryResult {
    posts: [Post!]
  }
`)
addGraphQLQuery('UserReadHistory(limit: Int): UserReadHistoryResult')
addGraphQLQuery('PostIsCriticism(args: JSON): Boolean')

addGraphQLSchema(`
  type DigestPlannerPost {
    post: Post
    digestPost: DigestPost
    rating: Int
  }
`)
addGraphQLQuery('DigestPlannerData(digestId: String, startDate: Date, endDate: Date): [DigestPlannerPost]')
