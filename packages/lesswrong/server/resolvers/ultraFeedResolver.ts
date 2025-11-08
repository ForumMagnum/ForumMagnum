import {
  FeedItemSourceType, UltraFeedResolverType,
  FeedSpotlight, FeedFullPost, FeedCommentMetaInfo,
  PreDisplayFeedComment,
  FeedCommentsThread,
  FeedCommentsThreadResolverType,
  feedCommentSourceTypesArray,
  feedSpotlightSourceTypesArray,
  FeedPostStub,
  UserOrClientId,
  ThreadEngagementStats,
  FeedPostMetaInfo,
  RankedItemMetadata,
} from "@/components/ultraFeed/ultraFeedTypes";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import gql from 'graphql-tag';
import { getUltraFeedCommentThreads, generateThreadHash } from '@/server/ultraFeed/ultraFeedThreadHelpers';
import { DEFAULT_SETTINGS as DEFAULT_ULTRAFEED_SETTINGS, UltraFeedResolverSettings } from '@/components/ultraFeed/ultraFeedSettingsTypes';
import { getUltraFeedPostThreads } from '@/server/ultraFeed/ultraFeedPostHelpers';
import { getUltraFeedBookmarks, PreparedBookmarkItem } from '../ultraFeed/ultraFeedBookmarkHelpers';
import { randomId } from '@/lib/random';
import union from 'lodash/union';
import groupBy from 'lodash/groupBy';
import merge from 'lodash/merge';
import mergeWith from 'lodash/mergeWith';
import cloneDeep from 'lodash/cloneDeep';
import { backgroundTask } from "../utils/backgroundTask";
import { serverCaptureEvent } from "../analytics/serverAnalyticsWriter";
import { bulkRawInsert } from '../manualMigrations/migrationUtils';
import {
  loadMultipleEntitiesById,
  createUltraFeedResponse,
  UltraFeedEventInsertData,
  insertSubscriptionSuggestions
} from './ultraFeedResolverHelpers';
import {
  toPostRankable,
  toThreadRankable,
} from '../ultraFeed/ultraFeedRanking';
import type {
  RankableItem,
  MappablePreparedThread
} from '../ultraFeed/ultraFeedRankingTypes';
import { getAlgorithm, type UltraFeedAlgorithmName } from '../ultraFeed/algorithms/algorithmRegistry';
import { ultraFeedDebug, ULTRAFEED_DEBUG_ENABLED } from '../ultraFeed/ultraFeedDebug';


interface UltraFeedDateCutoffs {
  latestPostsMaxAgeDays: number;
  subscribedPostsMaxAgeDays: number;
  initialCommentCandidateLookbackDays: number;
  commentServedEventRecencyHours: number;
  threadEngagementLookbackDays: number;
}

const ULTRA_FEED_DATE_CUTOFFS: UltraFeedDateCutoffs = {
  latestPostsMaxAgeDays: 30,
  subscribedPostsMaxAgeDays: 30,
  initialCommentCandidateLookbackDays: 14,
  commentServedEventRecencyHours: 48,
  threadEngagementLookbackDays: 30,
};

export const ultraFeedGraphQLTypeDefs = gql`
  type FeedSpotlightMetaInfo {
    sources: [String!]!
    servedEventId: String!
    rankingMetadata: JSON
  }

  type FeedPost {
    _id: String!
    postMetaInfo: JSON
    post: Post!
  }

  type FeedCommentThread {
    _id: String!
    commentMetaInfos: JSON
    comments: [Comment!]!
    post: Post
    postSources: [String!]
    postMetaInfo: JSON
  }

  type FeedSpotlightItem {
    _id: String!
    spotlight: Spotlight
    post: Post
    spotlightMetaInfo: FeedSpotlightMetaInfo
  }

  type FeedSubscriptionSuggestions {
    _id: String!
    suggestedUsers: [User!]!
  }

  type UltraFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [UltraFeedEntry!]
    sessionId: String
  }
  
  enum UltraFeedEntryType {
    feedCommentThread
    feedPost
    feedSpotlight
    feedSubscriptionSuggestions
  }

  type UltraFeedEntry {
    type: UltraFeedEntryType!
    feedCommentThread: FeedCommentThread
    feedPost: FeedPost
    feedSpotlight: FeedSpotlightItem
    feedSubscriptionSuggestions: FeedSubscriptionSuggestions
  }

  extend type Query {
    UltraFeed(
      limit: Int,
      cutoff: Date,
      offset: Int,
      sessionId: String,
      settings: JSON
    ): UltraFeedQueryResults!
  }
`;

type SampledItem =
  | { type: "feedCommentThread"; feedCommentThread: FeedCommentsThread }
  | { type: "feedPostWithContents"; feedPost: FeedFullPost }
  | { type: "feedPost"; feedPostStub: FeedPostStub }
  | { type: "feedSpotlight"; feedSpotlight: FeedSpotlight }
  | { type: "feedSubscriptionSuggestions"; feedSubscriptionSuggestions: { suggestedUserIds: string[] } };

const getSampledItemKey = (item: SampledItem): string | undefined => {
  switch (item.type) {
    case "feedPostWithContents":
      return item.feedPost.post?._id;
    case "feedPost":
      return item.feedPostStub.postId;
    case "feedCommentThread": {
      const ids = item.feedCommentThread.comments?.map(c => c.commentId).sort();
      if (!ids || ids.length === 0) return undefined;
      return generateThreadHash(ids);
    }
    case "feedSpotlight":
      return item.feedSpotlight.spotlightId;
    case "feedSubscriptionSuggestions":
      return "subscription-suggestions"; // Fixed key since we only want one per feed
    default:
      return undefined;
  }
};

const mergeDuplicateSampledItems = (target: SampledItem, incoming: SampledItem): SampledItem => {
  const customizer = (objVal: any, srcVal: any, key: string) => {
    if (key === 'sources') {
      return union(objVal, srcVal);
    }
    return undefined; // default merge for other keys
  };

  return mergeWith(target, incoming, customizer);
};

function dedupSampledItems(sampled: SampledItem[]): SampledItem[] {
  const grouped = groupBy(sampled, getSampledItemKey);

  const duplicateLog: Array<{key: string, count: number}> = [];

  const mergedObject = Object.fromEntries(
    Object.entries(grouped).map(([key, items]) => {
      if (items.length > 1) {
        duplicateLog.push({ key, count: items.length });
      }
      const [first, ...rest] = items as SampledItem[];
      const merged = rest.reduce<SampledItem>((acc, itm) => mergeDuplicateSampledItems(acc, itm), first);
      return [key ?? randomId(), merged];
    })
  );

  if (duplicateLog.length > 0) {
    serverCaptureEvent?.('ultraFeedDuplicateAfterSample', { duplicates: duplicateLog, location: 'ultraFeedResolver' });
  }

  return Object.values(mergedObject);
}

const DEFAULT_RESOLVER_SETTINGS: UltraFeedResolverSettings = DEFAULT_ULTRAFEED_SETTINGS.resolverSettings;

const parseUltraFeedSettings = (settingsJson?: string): UltraFeedResolverSettings => {
  let parsedSettings: UltraFeedResolverSettings = DEFAULT_RESOLVER_SETTINGS;
  if (settingsJson) {
    try {
      const settingsFromArg = JSON.parse(settingsJson);
      // Deep merge user settings with defaults to handle missing fields, e.g. prevent breaking changes
      parsedSettings = merge(
        cloneDeep(DEFAULT_RESOLVER_SETTINGS),
        settingsFromArg
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("UltraFeedResolver: Failed to parse settings argument", e);
    }
  }
  return parsedSettings;
};

/**
 * Extract IDs that need to be loaded from sampled items
 */
const extractIdsToLoad = (sampled: SampledItem[]) => {
  const postIds: string[] = [];
  const spotlightIds: string[] = [];
  const commentIdsSet = new Set<string>();
  let needsSuggestedUsers = false;

  sampled.forEach(it => {
    if (it.type === "feedSpotlight") {
      spotlightIds.push(it.feedSpotlight.spotlightId);
      // Also extract post IDs from spotlights that have posts so we can load them
      if (it.feedSpotlight.documentType === 'Post') {
        postIds.push(it.feedSpotlight.documentId);
      }
    } else if (it.type === "feedCommentThread") {
      it.feedCommentThread.comments?.forEach(c => c.commentId && commentIdsSet.add(c.commentId));
      // Extract post ID from the first comment to preload the post
      const firstComment = it.feedCommentThread.comments?.[0];
      const isParentPostRead = firstComment?.metaInfo?.isParentPostRead ?? false;
      if (firstComment?.postId && !isParentPostRead) {
        postIds.push(firstComment.postId);
      }
    } else if (it.type === "feedPost") {
      postIds.push(it.feedPostStub.postId);
    } else if (it.type === "feedSubscriptionSuggestions") {
      needsSuggestedUsers = true;
    }
  });

  return {
    spotlightIds,
    commentIds: Array.from(commentIdsSet),
    postIds,
    needsSuggestedUsers
  };
};

/**
 * Deduplicate posts that appear both as standalone items and in comment threads.
 * When a comment thread will show the post (parent post not read), we remove the standalone
 * post item and transfer its source information to the thread.
 */
const deduplicatePostsInThreads = (results: UltraFeedResolverType[]): UltraFeedResolverType[] => {
  const postIdsInExpandedThreads = new Map<string, FeedItemSourceType[]>();
  const threadsByPostId = new Map<string, UltraFeedResolverType>();
  
  // First pass: identify threads that will show posts
  for (const result of results) {
    if (result.type === "feedCommentThread" && result.feedCommentThread) {
      const thread = result.feedCommentThread;
      // If parent post is not read, the post will be shown with the thread
      const firstComment = thread.comments?.[0];
      const firstCommentMetaInfo = firstComment?._id ? thread.commentMetaInfos?.[firstComment._id] : undefined;
      const isParentPostRead = firstCommentMetaInfo?.isParentPostRead ?? false;
      if (!isParentPostRead && thread.comments?.length > 0) {
        const postId = firstComment?.postId;
        if (postId) {
          postIdsInExpandedThreads.set(postId, []);
          threadsByPostId.set(postId, result);
        }
      }
    }
  }
  
  // If no threads will show posts, return unchanged
  if (postIdsInExpandedThreads.size === 0) {
    return results;
  }
  
  // Second pass: collect sources from standalone posts and filter them out
  const filteredResults = results.filter(result => {
    if (result.type === "feedPost" && result.feedPost?.post?._id) {
      const postId = result.feedPost.post._id;
      if (postIdsInExpandedThreads.has(postId)) {
        const postSources = result.feedPost.postMetaInfo?.sources ?? [];
        postIdsInExpandedThreads.set(postId, postSources);
        return false;
      }
    }
    return true;
  });
  
  // Third pass: add the collected sources to the comment threads
  for (const [postId, postSources] of postIdsInExpandedThreads) {
    const threadResult = threadsByPostId.get(postId);
    if (threadResult?.type === "feedCommentThread" && threadResult.feedCommentThread && postSources.length > 0) {
      threadResult.feedCommentThread.postSources = postSources;
    }
  }
  
  return filteredResults;
};

/**
 * Transform sampled items into UltraFeedResolverType results
 */
const transformItemsForResolver = (
  sampled: SampledItem[],
  spotlightsById: Map<string, DbSpotlight>,
  commentsById: Map<string, DbComment>,
  postsById: Map<string, DbPost>,
  suggestedUsers?: DbUser[]
): UltraFeedResolverType[] => {
  return filterNonnull(sampled.map((item, index): UltraFeedResolverType | null => {
    if (item.type === "feedSpotlight") {
      const spotlight = spotlightsById.get(item.feedSpotlight.spotlightId);
      if (!spotlight) return null;
      
      const post = spotlight.documentType === 'Post' 
        ? postsById.get(spotlight.documentId) 
        : undefined;
      
      return {
        type: item.type,
        feedSpotlight: {
          _id: item.feedSpotlight.spotlightId,
          spotlight,
          ...(post && { post }),
          spotlightMetaInfo: {
            servedEventId: randomId(),
            sources: ['spotlights' as const],
            rankingMetadata: item.feedSpotlight.rankingMetadata
          }
        }
      };
    }

    if (item.type === "feedCommentThread") {
      const { comments: preDisplayComments, postSources, rankingMetadata } = item.feedCommentThread;
      let loadedComments: DbComment[] = [];

      if (preDisplayComments && preDisplayComments.length > 0) {
        loadedComments = filterNonnull(
          preDisplayComments.map(comment => commentsById.get(comment.commentId))
        );
      }
      
      // Load the post if the thread will display it (parent post not read)
      let post: DbPost | null = null;
      const isParentPostRead = preDisplayComments?.[0]?.metaInfo?.isParentPostRead ?? false;
      if (!isParentPostRead && loadedComments.length > 0) {
        const postId = loadedComments[0]?.postId;
        if (postId) {
          post = postsById.get(postId) ?? null;
        }
      }
      
      const commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo} = {};
      if (preDisplayComments) {
        preDisplayComments.forEach((comment: PreDisplayFeedComment) => {
          if (comment.commentId && comment.metaInfo) {
            commentMetaInfos[comment.commentId] = {
              ...comment.metaInfo,
              servedEventId: randomId()
            };
          }
        });
      }
      
      // Attach ranking metadata to the first comment's metaInfo
      if (rankingMetadata && loadedComments.length > 0) {
        const firstCommentId = loadedComments[0]._id;
        if (!commentMetaInfos[firstCommentId]) {
          commentMetaInfos[firstCommentId] = {
            sources: [],
            descendentCount: 0,
            displayStatus: 'expanded',
          };
        }
        commentMetaInfos[firstCommentId].rankingMetadata = rankingMetadata;
      }

      let threadId = `feed-comment-thread-${index}`; // Fallback ID
      if (loadedComments.length > 0) {
        const commentIds = loadedComments
          .map(c => c?._id)
          .filter((id): id is string => !!id);
        if (commentIds.length > 0) {
          threadId = generateThreadHash(commentIds);
        } else {
          // eslint-disable-next-line no-console
          console.warn(`UltraFeedResolver: Thread at index ${index} resulted in empty comment IDs list.`);
        }
      } else {
         // Only warn if we expected comments based on preDisplayComments
         if (preDisplayComments && preDisplayComments.length > 0) {
           // eslint-disable-next-line no-console
           console.warn(`UltraFeedResolver: Thread at index ${index} has no loaded comments despite having preDisplayComments.`);
         }
      }
      
      // Construct postMetaInfo for the thread (only when we're showing the post)
      let postMetaInfo: FeedPostMetaInfo | undefined;
      if (!isParentPostRead && loadedComments.length > 0) {
        const firstCommentMetaInfo = commentMetaInfos[loadedComments[0]._id];
        postMetaInfo = {
          sources: postSources ?? firstCommentMetaInfo?.sources ?? [],
          displayStatus: 'expanded',
          servedEventId: firstCommentMetaInfo?.servedEventId ?? '',
          highlight: true,
          isRead: false,
          rankingMetadata: firstCommentMetaInfo?.rankingMetadata,
        };
      }
      
           const resultData: FeedCommentsThreadResolverType = {
       _id: threadId,
       comments: loadedComments,
       commentMetaInfos,
       postSources,
       post,
       postMetaInfo,
     };

      return {
        type: item.type,
        feedCommentThread: resultData
      };
    }

    if (item.type === "feedPostWithContents") {
      const { post, postMetaInfo } = item.feedPost;
      if (!post) return null;
      const stableId = post._id ?? `feed-post-${index}`;
      return {
        type: "feedPost",
        feedPost: { 
          _id: stableId, 
          post, 
          postMetaInfo: {
            ...postMetaInfo,
            servedEventId: randomId()
          }
        }
      };
    }

    if (item.type === "feedPost") {
      const post = postsById.get(item.feedPostStub.postId);
      if (!post) return null;
      const { postMetaInfo } = item.feedPostStub;
      const stableId = post._id ?? `feed-post-${index}`;
      return {
        type: "feedPost",
        feedPost: { 
          _id: stableId, 
          post, 
          postMetaInfo: {
            ...postMetaInfo,
            servedEventId: randomId()
          }
        }
      };
    }

    if (item.type === "feedSubscriptionSuggestions") {
      return {
        type: "feedSubscriptionSuggestions",
        feedSubscriptionSuggestions: {
          _id: `subscription-suggestions-${index}`,
          suggestedUsers: suggestedUsers ?? []
        }
      };
    }

    // eslint-disable-next-line no-console
    console.error("Unknown item type:", item);
    return null;
  }));
};

/**
 * Create UltraFeed events for tracking served items
 */
const createUltraFeedEvents = (
  results: UltraFeedResolverType[],
  userOrClientId: UserOrClientId,
  sessionId: string,
  offset: number
): UltraFeedEventInsertData[] => {
  const eventsToCreate: UltraFeedEventInsertData[] = [];
  const userId = userOrClientId.id;
  const isLoggedOut = userOrClientId.type === 'client';
  
  results.forEach((item, index) => {
    const actualItemIndex = offset + index;
    
    if (item.type === "feedSpotlight" && item.feedSpotlight?.spotlight?._id) {
      const servedEventId = item.feedSpotlight.spotlightMetaInfo.servedEventId;
      eventsToCreate.push({
        _id: servedEventId,
        userId,
        eventType: "served",
        collectionName: "Spotlights",
        documentId: item.feedSpotlight.spotlight._id,
        event: { sessionId, itemIndex: actualItemIndex, sources: ["spotlights"], ...(isLoggedOut ? { loggedOut: true } : {}) }
      });
    } else if (item.type === "feedCommentThread" && (item.feedCommentThread?.comments?.length ?? 0) > 0) {
        const threadData = item.feedCommentThread;
        const comments = threadData?.comments;
        const commentMetaInfos = threadData?.commentMetaInfos;
        const sources = threadData?.commentMetaInfos?.[comments?.[0]?._id ?? ""]?.sources ?? [];
        comments?.forEach((comment: DbComment, commentIndex) => {
          if (comment?._id) {
            const displayStatus = commentMetaInfos?.[comment._id]?.displayStatus;
            const servedEventId = commentMetaInfos?.[comment._id]?.servedEventId;
            if (servedEventId) {
              eventsToCreate.push({ 
                 _id: servedEventId,
                 userId, 
                 eventType: "served", 
                 collectionName: "Comments", 
                 documentId: comment._id, 
                 event: { 
                  sessionId, 
                  itemIndex: actualItemIndex, 
                  commentIndex, 
                  displayStatus,
                  sources,
                  ...(isLoggedOut ? { loggedOut: true } : {})
                }
                });
            }
          }
        });
    } else if (item.type === "feedPost" && item.feedPost?.post?._id) {
      const feedItem = item.feedPost;
      const servedEventId = feedItem.postMetaInfo?.servedEventId;
      const sources = feedItem.postMetaInfo?.sources ?? [];
      if (feedItem.post._id && servedEventId) { 
        eventsToCreate.push({ 
          _id: servedEventId,
          userId, 
          eventType: "served", 
          collectionName: "Posts", 
          documentId: feedItem.post._id,
          event: { sessionId, itemIndex: actualItemIndex, sources, ...(isLoggedOut ? { loggedOut: true } : {}) }
        });
      }
    }
  });
  
  return eventsToCreate;
};

interface UltraFeedArgs {
  limit?: number;
  cutoff?: Date;
  offset?: number;
  sessionId: string;
  settings: string;
}

const calculateFetchLimits = (
  sourceWeights: Record<string, number>,
  totalLimit: number,
  offset: number = 0,
  bufferMultiplier = 3.6,
  latestAndSubscribedPostMultiplier = 3.0,
  recombeeMultiplier = 3.6,
): {
  totalWeight: number;
  recombeePostFetchLimit: number;
  hackerNewsPostFetchLimit: number;
  subscribedPostFetchLimit: number;
  commentFetchLimit: number;
  spotlightFetchLimit: number;
  bookmarkFetchLimit: number;
  bufferMultiplier: number;
} => {
  const totalWeight = Object.values(sourceWeights).reduce((sum: number, weight) => sum + weight, 0);
  
  const recombeePostWeight = sourceWeights['recombee-lesswrong-custom'] ?? 0;
  const hackerNewsPostWeight = sourceWeights['hacker-news'] ?? 0;
  const subscribedPostWeight = sourceWeights['subscriptionsPosts'] ?? 0;
  const bookmarkWeight = sourceWeights['bookmarks'] ?? 0;
  const totalCommentWeight = feedCommentSourceTypesArray.reduce((sum: number, type: FeedItemSourceType) => sum + (sourceWeights[type] || 0), 0);
  const totalSpotlightWeight = feedSpotlightSourceTypesArray.reduce((sum: number, type: FeedItemSourceType) => sum + (sourceWeights[type] || 0), 0);

  const baseCommentFetchLimit = Math.ceil(totalLimit * (totalCommentWeight / totalWeight) * bufferMultiplier);
  
  // Scale up comment fetch limit based on offset to reduce repetition in subsequent calls: grows incrementally with each call, capped at 200
  const commentFetchLimit = Math.min(baseCommentFetchLimit + Math.round(offset / 2), 200);
  
  if (offset > 0 && commentFetchLimit > baseCommentFetchLimit) {
    ultraFeedDebug.log(`Scaled up comment fetch limit: ${baseCommentFetchLimit} → ${commentFetchLimit} (base from limit=${totalLimit}, offset=${offset})`);
  }

  return {
    totalWeight,
    recombeePostFetchLimit: Math.ceil(totalLimit * (recombeePostWeight / totalWeight) * recombeeMultiplier),
    hackerNewsPostFetchLimit: Math.ceil(totalLimit * (hackerNewsPostWeight / totalWeight) * latestAndSubscribedPostMultiplier),
    subscribedPostFetchLimit: Math.ceil(totalLimit * (subscribedPostWeight / totalWeight) * latestAndSubscribedPostMultiplier),
    commentFetchLimit,
    spotlightFetchLimit: Math.ceil(totalLimit * (totalSpotlightWeight / totalWeight) * bufferMultiplier),
    bookmarkFetchLimit: Math.ceil(totalLimit * (bookmarkWeight / totalWeight) * bufferMultiplier),
    bufferMultiplier
  };
};

/**
 * UltraFeed resolver
 */
export const ultraFeedGraphQLQueries = {
  UltraFeed: async (_root: void, args: UltraFeedArgs, context: ResolverContext) => {
    const startTime = Date.now();
    ultraFeedDebug.log(`============================================================================ Session ID: ${args.sessionId}`);
    ultraFeedDebug.log('UltraFeed resolver called', { args });
    
    const {limit = 20, cutoff, offset, sessionId, settings: settingsJson} = args;
    
    const { currentUser, clientId } = context;
    
    let userOrClientId: UserOrClientId | null = null;
    if (currentUser) {
      userOrClientId = { type: 'user', id: currentUser._id };
    } else if (clientId) {
      userOrClientId = { type: 'client', id: clientId };
    }
    
    if (!userOrClientId) {
      throw new Error("Must be logged in or have a client ID to use the feed.");
    }

    const parsedSettings = parseUltraFeedSettings(settingsJson);
    const sourceWeights = parsedSettings.sourceWeights;
    const incognitoMode = parsedSettings.incognitoMode;

    try {
      const spotlightsRepo = context.repos.spotlights;

      const { totalWeight, recombeePostFetchLimit, hackerNewsPostFetchLimit, subscribedPostFetchLimit, commentFetchLimit, spotlightFetchLimit, bookmarkFetchLimit } = calculateFetchLimits(sourceWeights, limit, offset);

      if (totalWeight <= 0) {
        // eslint-disable-next-line no-console
        console.warn("UltraFeedResolver: Total source weight is zero. No items can be fetched or sampled. Returning empty results.");
        return createUltraFeedResponse([], offset || 0, sessionId, null);
      }

      // TODO: This is a little hand-wavy since fetching them together breaks the paradigm. Figure out better solution later.
      const latestAndSubscribedPostLimit = hackerNewsPostFetchLimit + subscribedPostFetchLimit;

      ultraFeedDebug.log('Fetch limits requested:', {
        recombeePostFetchLimit,
        hackerNewsPostFetchLimit,
        subscribedPostFetchLimit,
        latestAndSubscribedPostLimit,
        commentFetchLimit,
        spotlightFetchLimit,
        bookmarkFetchLimit,
      });

      // Fetch engagement stats for threads separately to pass to ranking
      const userIdOrClientId = currentUser?._id ?? clientId;
      const engagementStatsListPromise = userIdOrClientId && commentFetchLimit > 0
        ? context.repos.comments.getThreadEngagementStatsForRecentlyActiveThreads(
            userIdOrClientId,
            ULTRA_FEED_DATE_CUTOFFS.threadEngagementLookbackDays
          )
        : Promise.resolve([]);

      const [combinedPostItems, commentThreadsItemsResult, spotlightItemsResult, bookmarkItemsResult, engagementStatsList] = await Promise.all([
        (recombeePostFetchLimit + latestAndSubscribedPostLimit > 0) 
          ? getUltraFeedPostThreads( 
              context, 
              recombeePostFetchLimit, 
              latestAndSubscribedPostLimit,  // This now includes both latest AND subscribed posts
              parsedSettings,
              ULTRA_FEED_DATE_CUTOFFS.latestPostsMaxAgeDays
            ) 
          : Promise.resolve([]),
        commentFetchLimit > 0 
          ? getUltraFeedCommentThreads(
              context, 
              commentFetchLimit, 
              parsedSettings, 
              ULTRA_FEED_DATE_CUTOFFS.initialCommentCandidateLookbackDays,
              ULTRA_FEED_DATE_CUTOFFS.commentServedEventRecencyHours,
              ULTRA_FEED_DATE_CUTOFFS.threadEngagementLookbackDays,
              sessionId
            ) 
          : Promise.resolve([]),
        spotlightFetchLimit > 0 ? spotlightsRepo.getUltraFeedSpotlights(context, spotlightFetchLimit) : Promise.resolve([]),
        bookmarkFetchLimit > 0 ? getUltraFeedBookmarks(context, bookmarkFetchLimit) : Promise.resolve([]),
        engagementStatsListPromise
      ]) as [FeedFullPost[], FeedCommentsThread[], FeedSpotlight[], PreparedBookmarkItem[], ThreadEngagementStats[]];
      
      ultraFeedDebug.log('Fetch results returned:', {
        postsReturned: combinedPostItems.length,
        commentThreadsReturned: commentThreadsItemsResult.length,
        spotlightsReturned: spotlightItemsResult.length,
        bookmarksReturned: bookmarkItemsResult.length,
        engagementStatsReturned: engagementStatsList.length,
      });
      
      const engagementStatsMap = new Map(engagementStatsList.map(stats => [stats.threadTopLevelId, stats]));

      // Convert fetched items to rankable format
      const now = new Date();
      
      // Convert posts to rankable items
      const rankablePosts = combinedPostItems.map(post => toPostRankable(post, now));
      
      // Convert threads to rankable items with engagement stats
      const rankableThreads = commentThreadsItemsResult.map(thread => {
        const threadCommentIds = thread.comments?.map(c => c.commentId) ?? [];
        const topLevelId = threadCommentIds.length > 0 
          ? (thread.comments?.[0]?.topLevelCommentId ?? threadCommentIds[0])
          : undefined;
        const engagement = topLevelId ? engagementStatsMap.get(topLevelId) : undefined;
        return toThreadRankable(thread as MappablePreparedThread, engagement, now);
      });
      
      // Convert spotlights and bookmarks to minimal rankable items
      const rankableSpotlights: RankableItem[] = spotlightItemsResult.map(s => ({
        id: s.spotlightId,
        itemType: 'post' as const, // Use 'post' type since we don't have separate spotlight type
        postId: s.spotlightId,
        sources: ['spotlights' as FeedItemSourceType],
        ageHrs: null, // No recency bonus for spotlights (evergreen content)
        isRead: false,
        userSubscribedToAuthor: false,
        karma: 0,
      }));
      
      // Bookmarks can be either posts or threads
      const rankableBookmarks: RankableItem[] = bookmarkItemsResult.map(b => {
        if (b.type === 'feedPost') {
          return {
            id: b.feedPostStub.postId,
            itemType: 'post' as const,
            postId: b.feedPostStub.postId,
            sources: ['bookmarks' as FeedItemSourceType],
            ageHrs: null, // No recency bonus for bookmarks (saved items, not based on post age)
            isRead: false,
            userSubscribedToAuthor: false,
            karma: 0,
          };
        } else {
          // feedCommentThread bookmark
          const threadCommentIds = b.feedCommentThread.comments?.map(c => c.commentId) ?? [];
          return {
            id: generateThreadHash(threadCommentIds),
            itemType: 'commentThread' as const,
            threadId: generateThreadHash(threadCommentIds),
            sources: ['bookmarks' as FeedItemSourceType],
            ageHrs: 0, // Threads still need a number for now
            isRead: false,
            userSubscribedToAuthor: false,
            stats: {
              commentCount: threadCommentIds.length,
              unviewedCount: 0,
              lastActivityAgeHrs: 0,
              hasShortform: false,
            },
            comments: [],
          };
        }
      });

      const rankableItems: RankableItem[] = [
        ...rankablePosts,
        ...rankableThreads,
        ...rankableSpotlights,
        ...rankableBookmarks,
      ];

      // Get the user's preferred algorithm from settings (defaults to 'sampling')
      const algorithmName = parsedSettings.algorithm as UltraFeedAlgorithmName;
      const algorithm = getAlgorithm(algorithmName);
      
      // Rank items using the selected algorithm
      const rankedItemsWithMetadata = algorithm.rankItems(
        rankableItems, 
        limit,
        parsedSettings
      );
      
      ultraFeedDebug.log(`Ranked ${rankedItemsWithMetadata.length} items using ${algorithm.name} algorithm`);
      
      // Log ranked items with scores for analysis (only when debug enabled)

      if (ULTRAFEED_DEBUG_ENABLED) {
        backgroundTask((async () => {
          const itemsForLogging = rankedItemsWithMetadata
            .filter((item): item is { id: string; metadata: RankedItemMetadata } => item.metadata !== undefined)
            .map(({ id, metadata }) => {
              const item = rankableItems.find(r => r.id === id);
              return {
                itemId: id,
                itemType: item?.itemType ?? 'unknown',
                position: metadata.position,
                totalScore: metadata.scoreBreakdown.total,
                constraints: metadata.selectionConstraints.join(','),
                sources: item?.sources?.join(',') ?? '',
                repetitionPenaltyMultiplier: metadata.rankedItemType === 'commentThread'
                  ? metadata.scoreBreakdown.repetitionPenaltyMultiplier
                  : 1,
                scoreComponents: metadata.scoreBreakdown.components,
              };
          });
          
          serverCaptureEvent('ultraFeedItemsRanked', {
            sessionId,
            userId: currentUser?._id ?? undefined,
            clientId: clientId ?? undefined,
            offset: offset ?? 0,
            itemCount: rankedItemsWithMetadata.length,
            algorithm: algorithm.name,
            items: itemsForLogging,
          });
        })());
      }
      
      // Create a map to store metadata by ID
      const metadataById = new Map(
        rankedItemsWithMetadata.map(({ id, metadata }) => [id, metadata])
      );
      
      // Extract just the IDs for mapping
      const rankedIds = rankedItemsWithMetadata.map(({ id }) => id);
      
      // Create maps to look up original items by their rankable ID
      const postIdToOriginal = new Map<string, FeedFullPost>();
      combinedPostItems.forEach(post => {
        if (post.post?._id) {
          postIdToOriginal.set(post.post._id, post);
        }
      });
      
      const threadIdToOriginal = new Map<string, FeedCommentsThread>();
      commentThreadsItemsResult.forEach(thread => {
        const threadCommentIds = thread.comments?.map(c => c.commentId) ?? [];
        if (threadCommentIds.length > 0) {
          const threadHash = generateThreadHash(threadCommentIds);
          threadIdToOriginal.set(threadHash, thread);
        }
      });
      
      const spotlightIdToOriginal = new Map<string, FeedSpotlight>();
      spotlightItemsResult.forEach(s => {
        spotlightIdToOriginal.set(s.spotlightId, s);
      });
      
      const bookmarkIdToOriginal = new Map<string, PreparedBookmarkItem>();
      bookmarkItemsResult.forEach(b => {
        if (b.type === 'feedPost') {
          bookmarkIdToOriginal.set(b.feedPostStub.postId, b);
        } else {
          const threadCommentIds = b.feedCommentThread.comments?.map(c => c.commentId) ?? [];
          const threadHash = generateThreadHash(threadCommentIds);
          bookmarkIdToOriginal.set(threadHash, b);
        }
      });
      
      // Build sampled items in ranked order, attaching metadata
      const sampledItemsRaw: SampledItem[] = filterNonnull(rankedIds.map(id => {
        const metadata = metadataById.get(id);
        
        
        // Try to find in each map
        const post = postIdToOriginal.get(id);
        if (post) {
          // Attach ranking metadata to post
          const postWithMetadata: FeedFullPost = {
            ...post,
            postMetaInfo: {
              ...post.postMetaInfo,
              rankingMetadata: metadata,
            },
          };
          return { type: "feedPostWithContents" as const, feedPost: postWithMetadata };
        }
        
        const thread = threadIdToOriginal.get(id);
        if (thread) {
          // Attach ranking metadata to thread
          const threadWithMetadata: FeedCommentsThread = {
            ...thread,
            rankingMetadata: metadata,
          };
          return { type: "feedCommentThread" as const, feedCommentThread: threadWithMetadata };
        }
        
        const spotlight = spotlightIdToOriginal.get(id);
        if (spotlight) {
          // Spotlights get minimal metadata
          const spotlightWithMetadata: FeedSpotlight = {
            ...spotlight,
            rankingMetadata: metadata,
          };
          return { type: "feedSpotlight" as const, feedSpotlight: spotlightWithMetadata };
        }
        
        const bookmark = bookmarkIdToOriginal.get(id);
        if (bookmark) {
          // Attach metadata to bookmark
          if (bookmark.type === 'feedPost') {
            return {
              ...bookmark,
              feedPostStub: {
                ...bookmark.feedPostStub,
                postMetaInfo: {
                  ...bookmark.feedPostStub.postMetaInfo,
                  rankingMetadata: metadata,
                },
              },
            } as SampledItem;
          } else {
            return {
              ...bookmark,
              feedCommentThread: {
                ...bookmark.feedCommentThread,
                rankingMetadata: metadata,
              },
            } as SampledItem;
          }
        }
        
        return null;
      }));

      const sampledItemsDeduped = dedupSampledItems(sampledItemsRaw);
      
      // Maybe insert subscription suggestions with 20% probability
      const sampledItems = insertSubscriptionSuggestions(sampledItemsDeduped, (): SampledItem => ({
        type: "feedSubscriptionSuggestions",
        feedSubscriptionSuggestions: { suggestedUserIds: [] }
      }), 0.2, 4);
      
      // Extract IDs to load
      const { spotlightIds, commentIds, postIds, needsSuggestedUsers } = extractIdsToLoad(sampledItems);

      // Load full content for sampled items and suggested users in parallel
      const [{ postsById, commentsById, spotlightsById }, suggestedUsers] = await Promise.all([
        loadMultipleEntitiesById(context, {
          posts: postIds,
          comments: commentIds,
          spotlights: spotlightIds
        }),
      needsSuggestedUsers
        ? (userOrClientId.type === 'user'
            ? context.repos.users.getSubscriptionFeedSuggestedUsersForLoggedIn(userOrClientId.id, 40)
            : context.repos.users.getSubscriptionFeedSuggestedUsersForLoggedOut(userOrClientId.id, 40)
          )
        : Promise.resolve([])
      ]);
      const resultsWithoutDuplication = transformItemsForResolver(sampledItems, spotlightsById, commentsById, postsById, suggestedUsers);
      
      const results = deduplicatePostsInThreads(resultsWithoutDuplication);
      
      const keyFunc = (result: any) => `${result.type}_${result[result.type]?._id}`;
      const seenKeys = new Set<string>();
      const duplicateKeys: string[] = [];
      for (const result of results) {
        const key = keyFunc(result);
        if (seenKeys.has(key)) {
          duplicateKeys.push(key);
        } else {
          seenKeys.add(key);
        }
      }

      if (duplicateKeys.length > 0) {
        serverCaptureEvent("ultraFeedDuplicateDetected", {
          keys: duplicateKeys,
          resolverName: "UltraFeed",
          duplicateStage: "server-resolver-after-transform",
          sessionId,
          userId: currentUser?._id,
          clientId,
          offset: offset ?? 0,
        });
      }
      
      if (!incognitoMode) {
        const currentOffset = offset ?? 0; 
        const eventsToCreate = createUltraFeedEvents(results, userOrClientId, sessionId, currentOffset);
        if (eventsToCreate.length > 0) {
          backgroundTask(bulkRawInsert('UltraFeedEvents', eventsToCreate as DbUltraFeedEvent[]));
        }
      }

      const response = createUltraFeedResponse(results, offset ?? 0, sessionId);

      const executionTime = Date.now() - startTime;
      serverCaptureEvent('ultraFeedPerformance', { 
        ultraFeedResolverTotalExecutionTime: executionTime,
        sessionId,
        offset: offset ?? 0,
        userId: currentUser?._id,
        clientId,
      });

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error in UltraFeed resolver:", error);
      
      throw error;
    }
  }
};
