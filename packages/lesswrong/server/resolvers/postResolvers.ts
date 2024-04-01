import { Posts } from '../../lib/collections/posts/collection';
import { sideCommentFilterMinKarma, sideCommentAlwaysExcludeKarma } from '../../lib/collections/posts/constants';
import { Comments } from '../../lib/collections/comments/collection';
import { SideCommentsCache, SideCommentsResolverResult, getLastReadStatus, sideCommentCacheVersion } from '../../lib/collections/posts/schema';
import { augmentFieldsDict, denormalizedField, accessFilterMultiple } from '../../lib/utils/schemaUtils'
import { getLocalTime } from '../mapsUtils'
import { canUserEditPostMetadata, extractGoogleDocId, isNotHostedHere } from '../../lib/collections/posts/helpers';
import { matchSideComments } from '../sideComments';
import { captureException } from '@sentry/core';
import { getToCforPost } from '../tableOfContents';
import { getDefaultViewSelector } from '../../lib/utils/viewUtils';
import keyBy from 'lodash/keyBy';
import GraphQLJSON from 'graphql-type-json';
import { addGraphQLMutation, addGraphQLQuery, addGraphQLResolvers, addGraphQLSchema, createMutator } from '../vulcan-lib';
import { postIsCriticism } from '../languageModels/autoTagCallbacks';
import { createPaginatedResolver } from './paginatedResolver';
import { getDefaultPostLocationFields, getDialogueResponseIds, getDialogueMessageTimestamps } from "../posts/utils";
import { buildRevision } from '../editor/make_editable_callbacks';
import { cheerioParse } from '../utils/htmlUtil';
import { isDialogueParticipant } from '../../components/posts/PostsPage/PostsPage';
import { marketInfoLoader } from '../posts/annualReviewMarkets';
import { getWithCustomLoader } from '../../lib/loaders';
import { isLWorAF } from '../../lib/instanceSettings';
import { drive } from "@googleapis/drive";
import { convertImportedGoogleDoc } from '../editor/conversionUtils';
import Revisions from '../../lib/collections/revisions/collection';
import { randomId } from '../../lib/random';
import { getLatestRev, getNextVersion, htmlToChangeMetrics } from '../editor/utils';
import { canAccessGoogleDoc, getGoogleDocImportOAuthClient } from '../posts/googleDocImport';
import type { GoogleDocMetadata } from '../../lib/collections/revisions/helpers';
import { userIsAdmin } from '../../lib/vulcan-users';
import { recombeeApi } from '../recombee/client';
import { RecombeeRecommendationArgs } from '../../lib/collections/users/recommendationSettings';

/**
 * Extracts the contents of tag with provided messageId for a collabDialogue post, extracts using Cheerio
 * Do not use this for anyone who doesn't have privileged access to document since it can return unpublished edits
*/
const getDialogueMessageContents = async (post: DbPost, messageId: string): Promise<string|null> => {
  if (!post.collabEditorDialogue) throw new Error("Post is not a dialogue!")

  // fetch remote document from storage / fetch latest revision / post latest contents
  const latestRevision = await getLatestRev(post._id, "contents")
  const html = latestRevision?.html ?? post.contents.html ?? ""

  const $ = cheerioParse(html)
  const message = $(`[message-id="${messageId}"]`);
  return message.html();
}


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
      resolver: async (document: DbPost, args: {version: string}, context: ResolverContext) => {
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
  totalDialogueResponseCount: {
    resolveAs: {
      type: 'Int!', 
      resolver: (post, _, context) => {
        if (!post.debate) return 0;
        return getDialogueResponseIds(post).length
      }
    }
  },
  unreadDebateResponseCount: {
    resolveAs: {
      type: 'Int!',
      resolver: async (post, _, context): Promise<number> => {
        if (!post.collabEditorDialogue) return 0;

        const lastReadStatus = await getLastReadStatus(post, context);
        if (!lastReadStatus) return 0;

        const messageTimestamps = getDialogueMessageTimestamps(post)
        const newMessageTimestamps = messageTimestamps.filter(ts => ts > lastReadStatus.lastUpdated)

        return newMessageTimestamps.length ?? 0
      }
    }
  },
  mostRecentPublishedDialogueResponseDate: {
    ...denormalizedField({
      getValue: (post: DbPost) => {
        if ((!post.debate && !post.collabEditorDialogue) || post.draft) return null;
        const messageTimestamps = getDialogueMessageTimestamps(post)
        if (messageTimestamps.length === 0) { return null } 
        const lastTimestamp = messageTimestamps[messageTimestamps.length - 1]
        return lastTimestamp
      }
    })
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
          && (!post.lastCommentedAt || cache.generatedAt > post.lastCommentedAt)
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
          const sideCommentMatches = matchSideComments({
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
  dialogueMessageContents: {
    resolveAs: {
      type: 'String',
      arguments: 'dialogueMessageId: String',
      resolver: async (post: DbPost, args: {dialogueMessageId?: string}, context: ResolverContext): Promise<string|null> => {
        const { currentUser } = context
        const { dialogueMessageId } = args
        if (!post.collabEditorDialogue) return null;
        if (!dialogueMessageId) return null;
        if (!currentUser) return null;
        const isParticipant = isDialogueParticipant(currentUser._id, post)
        if (!isParticipant) return null;

        return getDialogueMessageContents(post, dialogueMessageId)
      }
    }
  },
  annualReviewMarketProbability: {
    resolveAs: {
      type: 'Float',
      resolver: async (post: DbPost, args: void, context: ResolverContext) => {
        if (!isLWorAF) {
          return 0;
        }
        const market = await getWithCustomLoader(context, 'manifoldMarket', post._id, marketInfoLoader);
        return market?.probability
      }
    }
  },
  annualReviewMarketIsResolved: {
    resolveAs: {
      type: 'Boolean',
      resolver: async (post: DbPost, args: void, context: ResolverContext) => {
        if (!isLWorAF) {
          return false;
        }
        const market = await getWithCustomLoader(context, 'manifoldMarket', post._id, marketInfoLoader)
        return market?.isResolved
      }
    }
  },
  annualReviewMarketYear: {
    resolveAs: {
      type: 'Int',
      resolver: async (post: DbPost, args: void, context: ResolverContext) => {
        if (!isLWorAF) {
          return 0;
        }
        const market = await getWithCustomLoader(context, 'manifoldMarket', post._id, marketInfoLoader)
        return market?.year
      }
    }
  },
  
  firstVideoAttribsForPreview: {
    resolveAs: {
      type: GraphQLJSON,
      resolver: async (post: DbPost, args: void, context: ResolverContext) => {
        const videoHosts = [
          "https://www.youtube.com",
          "https://youtube.com",
          "https://youtu.be",
        ];
        const $ = cheerioParse(post.contents?.html);
        const iframes = $("iframe").toArray();
        for (const iframe of iframes) {
          if ("attribs" in iframe) {
            const src = iframe.attribs.src ?? "";
            for (const host of videoHosts) {
              if (src.indexOf(host) === 0) {
                return iframe.attribs;
              }
            }
          }
        }
        return null;
      },
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
      const { currentUser, repos } = context
      if (!currentUser) {
        throw new Error('Must be logged in to view read history')
      }

      const posts = await repos.posts.getReadHistoryForUser(currentUser._id, args.limit ?? 10)
      const filteredPosts = accessFilterMultiple(currentUser, Posts, posts, context);
      return {
        posts: filteredPosts,
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
      const { currentUser, repos } = context
      if (!currentUser || !currentUser.isAdmin) {
        throw new Error('Permission denied')
      }
      const eligiblePosts = await repos.posts.getEligiblePostsForDigest(digestId, startDate, endDate)
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
    },
    async UsersReadPostsOfTargetUser(root: void, { userId, targetUserId, limit = 20 }: { userId: string, targetUserId: string, limit: number }, context: ResolverContext) {
      const { currentUser, repos } = context
      if (!currentUser) {
        throw new Error('Must be logged in to view read posts of target user')
      }

      const posts = await repos.posts.getUsersReadPostsOfTargetUser(userId, targetUserId, limit)
      return await accessFilterMultiple(currentUser, Posts, posts, context)
    },
    async CanAccessGoogleDoc(root: void, { fileUrl }: { fileUrl: string }, context: ResolverContext) {
      const { currentUser } = context
      if (!currentUser) {
        return null;
      }

      return canAccessGoogleDoc(fileUrl)
    },
  },
  Mutation: {
    async ImportGoogleDoc(root: void, { fileUrl, postId }: { fileUrl: string, postId?: string | null }, context: ResolverContext) {
      if (!fileUrl) {
        throw new Error("fileUrl must be given")
      }
      const fileId = extractGoogleDocId(fileUrl)

      if (!fileId) {
        throw new Error(`Could not extract id from google doc url: ${fileUrl}`)
      }

      const { currentUser } = context;
      if (!currentUser) {
        throw new Error('Must be logged in to import google doc')
      }

      if (postId) {
        const post = await Posts.findOne({_id: postId})

        if (!post) {
          throw new Error(`No post with id: ${postId}`)
        }

        if (!canUserEditPostMetadata(currentUser, post)) {
          throw new Error(`User doesn't have permission to edit post with id: ${postId}`)
        }
      }

      const oauth2Client = await getGoogleDocImportOAuthClient();

      const googleDrive = drive({
        version: "v3",
        auth: oauth2Client,
      });

      // Retrieve the file's metadata to get the name
      const fileMetadata = await googleDrive.files.get({
        fileId,
        fields: 'id, name, description, version, createdTime, modifiedTime, size'
      });

      const docMetadata = fileMetadata.data as GoogleDocMetadata;

      const fileContents = await googleDrive.files.export(
        {
          fileId,
          mimeType: "text/html",
        },
        { responseType: "text" }
      );

      const html = fileContents.data as string;

      if (!html || !docMetadata) {
        throw new Error("Unable to import google doc")
      }

      const finalPostId = postId ?? randomId()
      // Converting to ckeditor markup does some thing like removing styles to standardise
      // the result, so we always want to do this first before converting to whatever format the user
      // is using
      const ckEditorMarkup = await convertImportedGoogleDoc({ html, postId: finalPostId })
      const commitMessage = `[Google Doc import] Last modified: ${docMetadata.modifiedTime}, Name: "${docMetadata.name}"`
      const originalContents = {type: "ckEditorMarkup", data: ckEditorMarkup}

      if (postId) {
        const previousRev = await getLatestRev(postId, "contents")
        const revisionType = "major"

        const newRevision: Partial<DbRevision> = {
          ...(await buildRevision({
            originalContents,
            currentUser,
          })),
          documentId: postId,
          draft: true,
          fieldName: "contents",
          collectionName: "Posts",
          version: getNextVersion(previousRev, revisionType, true),
          updateType: revisionType,
          commitMessage,
          changeMetrics: htmlToChangeMetrics(previousRev?.html || "", html),
          googleDocMetadata: docMetadata
        };

        await createMutator({
          collection: Revisions,
          document: newRevision,
          validate: false,
        });

        return await Posts.findOne({_id: postId})
      } else {
        // Create a draft post if one doesn't exist. This runs `buildRevision` itself via a callback
        const { data: post } = await createMutator({
          collection: Posts,
          document: {
            _id: finalPostId,
            userId: currentUser._id,
            title: docMetadata.name,
            contents: {
              originalContents,
              commitMessage,
              googleDocMetadata: docMetadata
            },
            draft: true
          },
          currentUser,
          validate: false,
        })

        return post;
      }
    },
  }
})

addGraphQLQuery("UsersReadPostsOfTargetUser(userId: String!, targetUserId: String!, limit: Int): [Post!]");

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

addGraphQLQuery("CanAccessGoogleDoc(fileUrl: String!): Boolean");
addGraphQLMutation("ImportGoogleDoc(fileUrl: String!, postId: String): Post");

createPaginatedResolver({
  name: "DigestHighlights",
  graphQLType: "Post",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => context.repos.posts.getDigestHighlights({limit}),
});

createPaginatedResolver({
  name: "DigestPostsThisWeek",
  graphQLType: "Post",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => context.repos.posts.getTopWeeklyDigestPosts(limit),
  cacheMaxAgeMs: 1000 * 60 * 60, // 1 hour
});

createPaginatedResolver({
  name: "CuratedAndPopularThisWeek",
  graphQLType: "Post",
  callback: async (
    {repos, currentUser}: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => repos.posts.getCuratedAndPopularPosts({
    currentUser,
    limit,
  }),
  cacheMaxAgeMs: 1000 * 60 * 60, // 1 hour
});

createPaginatedResolver({
  name: "RecentlyActiveDialogues",
  graphQLType: "Post",
  callback: async (
    {repos}: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => repos.posts.getRecentlyActiveDialogues(limit),
  cacheMaxAgeMs: 1000 * 60 * 10, // 10 min
});

createPaginatedResolver({
  name: "MyDialogues",
  graphQLType: "Post",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbPost[]> => {
      const {repos, currentUser} = context
      if (!currentUser) return []
      return repos.posts.getMyActiveDialogues(currentUser._id, limit);
    },
  // Caching is not user specific, do not use caching here else you will share users' drafts
  cacheMaxAgeMs: 0, 
});

addGraphQLSchema(`
  type RecombeeRecommendedPost {
    post: Post!
    recommId: String!
  }
`)

interface RecombeeRecommendedPost {
  post: Partial<DbPost>,
  recommId: string
}

createPaginatedResolver({
  name: "RecombeeLatestPosts",
  graphQLType: "RecombeeRecommendedPost",
  args: { settings: "JSON" },
  callback: async (
    context: ResolverContext,
    limit: number,
    args: { settings: RecombeeRecommendationArgs }
  ): Promise<RecombeeRecommendedPost[]> => {
    const { repos, currentUser } = context;

    if (!userIsAdmin(currentUser)) {
      throw new Error(`You must be an admin to use Recombee recommendations right now`);
    }

    return await recombeeApi.getRecommendationsForUser(currentUser._id, limit, args.settings, context);
  }
})
