import crypto from 'crypto';
import {
  FeedItemSourceType, UltraFeedResolverType,
  FeedSpotlight, FeedFullPost, FeedCommentMetaInfo,
  PreDisplayFeedComment,
  FeedCommentsThread,
  FeedCommentsThreadResolverType,
  feedCommentSourceTypesArray,
  feedSpotlightSourceTypesArray,
  FeedItemDisplayStatus,
  FeedPostStub,
  ServedEventData
} from "@/components/ultraFeed/ultraFeedTypes";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import gql from 'graphql-tag';
import { bulkRawInsert } from '../manualMigrations/migrationUtils';
import cloneDeep from 'lodash/cloneDeep';
import { getUltraFeedCommentThreads, generateThreadHash } from '@/server/ultraFeed/ultraFeedThreadHelpers';
import { DEFAULT_SETTINGS as DEFAULT_ULTRAFEED_SETTINGS, UltraFeedResolverSettings } from '@/components/ultraFeed/ultraFeedSettingsTypes';
import { loadByIds } from '@/lib/loaders';
import { getUltraFeedPostThreads, getSubscribedPostsForUltraFeed } from '@/server/ultraFeed/ultraFeedPostHelpers';
import { getUltraFeedBookmarks, PreparedBookmarkItem } from '../ultraFeed/ultraFeedBookmarkHelpers';
import { randomId } from '@/lib/random';
import { captureEvent } from '@/lib/analyticsEvents';
import union from 'lodash/union';
import groupBy from 'lodash/groupBy';
import mergeWith from 'lodash/mergeWith';

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
  threadEngagementLookbackDays: 45,
};

export const ultraFeedGraphQLTypeDefs = gql`
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
  }

  type FeedSpotlightItem {
    _id: String!
    spotlight: Spotlight
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
  }

  type UltraFeedEntry {
    type: UltraFeedEntryType!
    feedCommentThread: FeedCommentThread
    feedPost: FeedPost
    feedSpotlight: FeedSpotlightItem
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

// items now carry `type`
type SampledItem =
  | { type: "feedCommentThread"; feedCommentThread: FeedCommentsThread }
  | { type: "feedPostWithContents"; feedPost: FeedFullPost }
  | { type: "feedPost"; feedPostStub: FeedPostStub }
  | { type: "feedSpotlight"; feedSpotlight: FeedSpotlight };

interface WeightedSource {
  weight: number;
  items: SampledItem[];
}

const weightedSample = (
  inputs: Partial<Record<FeedItemSourceType, WeightedSource>>,
  totalItems: number
): SampledItem[] => {
  const sourcesWithCopiedItems = cloneDeep(inputs);
  const finalFeed: SampledItem[] = [];

  let totalWeight = Object.values(sourcesWithCopiedItems)
    .reduce((sum, s) => sum + (s?.items.length ? s.weight : 0), 0);

  for (let i = 0; i < totalItems; i++) {
    if (totalWeight <= 0) break;
    const pick = Math.random() * totalWeight;
    let cumulative = 0;
    let chosen: FeedItemSourceType | null = null;

    for (const [k, src] of Object.entries(sourcesWithCopiedItems)) {
      if (!src || !src.items.length) continue;
      cumulative += src.weight;
      if (pick < cumulative) {
        chosen = k as FeedItemSourceType;
        break;
      }
    }

    if (chosen) {
      const src = sourcesWithCopiedItems[chosen]!;
      const item = src.items.shift();
      if (item) {
        finalFeed.push(item);
      }
      if (!src.items.length) {
        totalWeight -= src.weight;
      }
    }
  }
  return finalFeed;
};

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
    captureEvent?.('ultraFeedDuplicateAfterSample', { duplicates: duplicateLog, location: 'ultraFeedResolver' });
  }

  return Object.values(mergedObject);
}

const DEFAULT_RESOLVER_SETTINGS: UltraFeedResolverSettings = DEFAULT_ULTRAFEED_SETTINGS.resolverSettings;

const parseUltraFeedSettings = (settingsJson?: string): UltraFeedResolverSettings => {
  let parsedSettings: UltraFeedResolverSettings = DEFAULT_RESOLVER_SETTINGS;
  if (settingsJson) {
    try {
      const settingsFromArg = JSON.parse(settingsJson);
      const resolverKeys = Object.keys(DEFAULT_RESOLVER_SETTINGS) as Array<keyof UltraFeedResolverSettings>;
      const filteredSettings: Partial<UltraFeedResolverSettings> = {};
      resolverKeys.forEach(key => {
         if (settingsFromArg[key] !== undefined) {
            filteredSettings[key] = settingsFromArg[key];
         }
      });
      parsedSettings = { ...DEFAULT_RESOLVER_SETTINGS, ...filteredSettings };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("UltraFeedResolver: Failed to parse settings argument", e);
    }
  }
  return parsedSettings;
};

/**
 * Create a map of source type to weighted source with items
 */
const createSourcesMap = (
  sourceWeights: Record<string, number>,
  postThreadsItems: FeedFullPost[],
  commentThreadsItems: FeedCommentsThread[],
  spotlightItems: FeedSpotlight[],
  bookmarkItems: PreparedBookmarkItem[],
  subscribedPostItems: FeedPostStub[]
): Partial<Record<FeedItemSourceType, WeightedSource>> => {

  const sources = Object.entries(sourceWeights)
    .filter(([, w]) => w > 0)
    .reduce((acc, [src, w]) => {
      acc[src as FeedItemSourceType] = { weight: w, items: [] };
      return acc;
    }, {} as Partial<Record<FeedItemSourceType, WeightedSource>>);

  const addedPostIds = new Set<string>();

  if (sources.spotlights) {
    spotlightItems.forEach(s => {
      sources.spotlights?.items.push({ type: "feedSpotlight", feedSpotlight: s });
    });
  }

  postThreadsItems.forEach(p => {
    const postId = p.post?._id;
    if (!postId || addedPostIds.has(postId)) {
      return;
    }
    let addedToAnySource = false;
    (p.postMetaInfo?.sources ?? []).forEach(src => {
      const bucket = sources[src];
      if (bucket) {
        bucket.items.push({ type: "feedPostWithContents", feedPost: p });
        addedToAnySource = true;
      }
    });
    if (addedToAnySource) {
        addedPostIds.add(postId);
    }
  });

  subscribedPostItems.forEach(p => {
    const postId = p.postId;
    if (!postId || addedPostIds.has(postId)) {
      return;
    }
    const bucket = sources['subscriptionsPosts' as const]; 
    if (bucket) {
      bucket.items.push({ 
        type: "feedPost", 
        feedPostStub: { 
          postId: postId, 
          postMetaInfo: p.postMetaInfo 
        } 
      });
      addedPostIds.add(postId);
    }
  });

  if (sources.bookmarks) {
    bookmarkItems.forEach(item => {
      if (item.type === "feedPost") {
        const postId = item.feedPostStub.postId;
        if (addedPostIds.has(postId)) {
          return;
        }
        sources.bookmarks?.items.push(item);
        addedPostIds.add(postId);
      } else if (item.type === "feedCommentThread") {
        sources.bookmarks?.items.push(item);
      }
    });
  }

  // Handle comment threads - distribute into appropriate buckets
  // For backwards compatibility, if client has recentComments weight > 0 but new weights = 0,
  // we still populate all threads there
  const hasNewCommentBuckets = (sources.quicktakes || 
    sources.subscriptionsComments);
  const useOldBucket = sources.recentComments && !hasNewCommentBuckets;

  commentThreadsItems.forEach(t => {
    const primarySource = t.primarySource;
    
    if (useOldBucket && sources.recentComments) {
      // Backwards compatibility mode
      sources.recentComments.items.push({ type: "feedCommentThread", feedCommentThread: t });
    } else {
      // New bucket distribution
      if (primarySource === 'quicktakes' && sources.quicktakes) {
        sources.quicktakes.items.push({ type: "feedCommentThread", feedCommentThread: t });
      } else if (primarySource === 'subscriptionsComments' && sources.subscriptionsComments) {
        sources.subscriptionsComments.items.push({ type: "feedCommentThread", feedCommentThread: t });
      } else if (primarySource === 'recentComments' && sources.recentComments) {
        sources.recentComments.items.push({ type: "feedCommentThread", feedCommentThread: t });
      }
    }
  });

  return Object.fromEntries(Object.entries(sources).filter(([, v]) => v?.items.length ?? 0 > 0));
};

/**
 * Extract IDs that need to be loaded from sampled items
 */
const extractIdsToLoad = (sampled: SampledItem[]) => {
  const postIds: string[] = [];
  const spotlightIds: string[] = [];
  const commentIdsSet = new Set<string>();

  sampled.forEach(it => {
    if (it.type === "feedSpotlight") {
      spotlightIds.push(it.feedSpotlight.spotlightId);
    } else if (it.type === "feedCommentThread") {
      it.feedCommentThread.comments?.forEach(c => c.commentId && commentIdsSet.add(c.commentId));
    } else if (it.type === "feedPost") {
      postIds.push(it.feedPostStub.postId);
    }
  });

  return {
    spotlightIds,
    commentIds: Array.from(commentIdsSet),
    postIds
  };
};

/**
 * Transform sampled items into UltraFeedResolverType results
 */
const transformItemsForResolver = (
  sampled: SampledItem[],
  spotlightsById: Map<string, DbSpotlight>,
  commentsById: Map<string, DbComment>,
  postsById: Map<string, DbPost>
): UltraFeedResolverType[] => {
  return filterNonnull(sampled.map((item, index): UltraFeedResolverType | null => {
    if (item.type === "feedSpotlight") {
      const spotlight = spotlightsById.get(item.feedSpotlight.spotlightId);
      if (!spotlight) return null;
      
      return {
        type: item.type,
        feedSpotlight: {
          _id: item.feedSpotlight.spotlightId,
          spotlight
        }
      };
    }

    if (item.type === "feedCommentThread") {
      const { comments: preDisplayComments } = item.feedCommentThread;
      let loadedComments: DbComment[] = [];

      if (preDisplayComments && preDisplayComments.length > 0) {
        loadedComments = filterNonnull(
          preDisplayComments.map(comment => commentsById.get(comment.commentId))
        );
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

      // Generate ID by hashing sorted comment IDs
      let threadId = `feed-comment-thread-${index}`; // Fallback ID
      if (loadedComments.length > 0) {
        const sortedCommentIds = loadedComments
          .map(c => c?._id)
          .sort();
        if (sortedCommentIds.length > 0) {
          const hash = crypto.createHash('sha256');
          hash.update(sortedCommentIds.join(','));
          threadId = hash.digest('hex');
        } else {
          // eslint-disable-next-line no-console
          console.warn(`UltraFeedResolver: Thread at index ${index} resulted in empty sortedCommentIds list.`);
        }
      } else {
         // Only warn if we expected comments based on preDisplayComments
         if (preDisplayComments && preDisplayComments.length > 0) {
           // eslint-disable-next-line no-console
           console.warn(`UltraFeedResolver: Thread at index ${index} has no loaded comments despite having preDisplayComments.`);
         }
      }
      
      const resultData: FeedCommentsThreadResolverType = {
        _id: threadId,
        comments: loadedComments,
        commentMetaInfos
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

    // eslint-disable-next-line no-console
    console.error("Unknown item type:", item);
    return null;
  }));
};

type UltraFeedEventInsertData = Pick<DbUltraFeedEvent, '_id' | 'userId' | 'eventType' | 'collectionName' | 'documentId' > & { event?: ServedEventData };

/**
 * Create UltraFeed events for tracking served items
 */
const createUltraFeedEvents = (
  results: UltraFeedResolverType[],
  userId: string,
  sessionId: string,
  offset: number
): UltraFeedEventInsertData[] => {
  const eventsToCreate: UltraFeedEventInsertData[] = [];
  
  results.forEach((item, index) => {
    const actualItemIndex = offset + index;
    
    if (item.type === "feedSpotlight" && item.feedSpotlight?.spotlight?._id) {
      eventsToCreate.push({
        _id: randomId(),
        userId,
        eventType: "served",
        collectionName: "Spotlights",
        documentId: item.feedSpotlight.spotlight._id,
        event: { sessionId, itemIndex: actualItemIndex, sources: ["spotlights"] }
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
                  sources
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
          event: { sessionId, itemIndex: actualItemIndex, sources }
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
  bufferMultiplier = 1.2
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

  return {
    totalWeight,
    recombeePostFetchLimit: Math.ceil(totalLimit * (recombeePostWeight / totalWeight) * bufferMultiplier),
    hackerNewsPostFetchLimit: Math.ceil(totalLimit * (hackerNewsPostWeight / totalWeight) * bufferMultiplier),
    subscribedPostFetchLimit: Math.ceil(totalLimit * (subscribedPostWeight / totalWeight) * bufferMultiplier),
    commentFetchLimit: Math.ceil(totalLimit * (totalCommentWeight / totalWeight) * bufferMultiplier),
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
    
    const {limit = 20, cutoff, offset, sessionId, settings: settingsJson} = args;
    
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in to fetch UltraFeed.");
    }

    const parsedSettings = parseUltraFeedSettings(settingsJson);
    const sourceWeights = parsedSettings.sourceWeights;
    const incognitoMode = parsedSettings.incognitoMode;

    try {
      const spotlightsRepo = context.repos.spotlights;
      const ultraFeedEventsRepo = context.repos.ultraFeedEvents;

      const { totalWeight, recombeePostFetchLimit, hackerNewsPostFetchLimit, subscribedPostFetchLimit, commentFetchLimit, spotlightFetchLimit, bookmarkFetchLimit } = calculateFetchLimits(sourceWeights, limit);

      if (totalWeight <= 0) {
        // eslint-disable-next-line no-console
        console.warn("UltraFeedResolver: Total source weight is zero. No items can be fetched or sampled. Returning empty results.");
        return {
          __typename: "UltraFeedQueryResults",
          cutoff: null,
          endOffset: offset || 0,
          results: [],
          sessionId
        };
      }

      const [servedCommentThreadHashes, excludedPostIds] = await Promise.all([
        ultraFeedEventsRepo.getRecentlyServedCommentThreadHashes(currentUser._id),
        ultraFeedEventsRepo.getPostsToExclude(currentUser._id, sessionId)
      ]);

      const [recombeeAndLatestPostItems, subscribedPostItemsResult, commentThreadsItemsResult, spotlightItemsResult, bookmarkItemsResult] = await Promise.all([
        (recombeePostFetchLimit + hackerNewsPostFetchLimit > 0) 
          ? getUltraFeedPostThreads( 
              context, 
              recombeePostFetchLimit, 
              hackerNewsPostFetchLimit, 
              parsedSettings,
              ULTRA_FEED_DATE_CUTOFFS.latestPostsMaxAgeDays,
              excludedPostIds
            ) 
          : Promise.resolve([]),
        (subscribedPostFetchLimit > 0)
          ? getSubscribedPostsForUltraFeed(
              context, 
              subscribedPostFetchLimit, 
              parsedSettings,
              ULTRA_FEED_DATE_CUTOFFS.subscribedPostsMaxAgeDays,
              excludedPostIds
            )
          : Promise.resolve([]),
        commentFetchLimit > 0 
          ? getUltraFeedCommentThreads(
              context, 
              commentFetchLimit, 
              parsedSettings, 
              servedCommentThreadHashes,
              ULTRA_FEED_DATE_CUTOFFS.initialCommentCandidateLookbackDays,
              ULTRA_FEED_DATE_CUTOFFS.commentServedEventRecencyHours,
              ULTRA_FEED_DATE_CUTOFFS.threadEngagementLookbackDays
            ) 
          : Promise.resolve([]),
        spotlightFetchLimit > 0 ? spotlightsRepo.getUltraFeedSpotlights(context, spotlightFetchLimit) : Promise.resolve([]),
        bookmarkFetchLimit > 0 ? getUltraFeedBookmarks(context, bookmarkFetchLimit) : Promise.resolve([])
      ]) as [FeedFullPost[], FeedPostStub[], FeedCommentsThread[], FeedSpotlight[], PreparedBookmarkItem[]];
      
      const populatedSources = createSourcesMap(
        sourceWeights,
        recombeeAndLatestPostItems,
        commentThreadsItemsResult,
        spotlightItemsResult,
        bookmarkItemsResult,
        subscribedPostItemsResult
      );

      // Sample items from sources based on weights
      const sampledItemsRaw = weightedSample(populatedSources, limit);
      const sampledItems = dedupSampledItems(sampledItemsRaw);
      
      // Extract IDs to load
      const { spotlightIds, commentIds, postIds } = extractIdsToLoad(sampledItems);
      
      // Load full content for sampled items
      const [spotlightsResults, commentsResults, postsResults] = await Promise.all([
        loadByIds(context, "Spotlights", spotlightIds),
        loadByIds(context, "Comments", commentIds),
        loadByIds(context, "Posts",     postIds)
      ]);
      
      // Create lookup maps for loaded content
      const spotlightsById = new Map<string, DbSpotlight>();
      spotlightsResults.forEach(result => {
        if (result && result._id) {
          spotlightsById.set(result._id, result);
        }
      });

      const commentsById = new Map<string, DbComment>();
      commentsResults.forEach(result => {
        if (result && result._id) {
          commentsById.set(result._id, result);
        }
      });

      const postsById = new Map<string, DbPost>();
      postsResults.forEach(p => p?._id && postsById.set(p._id, p));
      
      const results = transformItemsForResolver(sampledItems, spotlightsById, commentsById, postsById);
      
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
        captureEvent?.("ultraFeedDuplicateDetected", {
          keys: duplicateKeys,
          resolverName: "UltraFeed",
          duplicateStage: "server-resolver-after-transform",
          sessionId,
          offset: offset ?? 0,
        });
      }
      
      if (!incognitoMode) {
        const currentOffset = offset ?? 0; 
        const eventsToCreate = createUltraFeedEvents(results, currentUser._id, sessionId, currentOffset);
        if (eventsToCreate.length > 0) {
          void bulkRawInsert("UltraFeedEvents", eventsToCreate as DbUltraFeedEvent[]);
        }
      }

      const response = {
        __typename: "UltraFeedQueryResults" as const,
        cutoff: results.length > 0 ? new Date() : null,
        endOffset: (offset ?? 0) + results.length,
        results,
        sessionId
      };

      const executionTime = Date.now() - startTime;
      captureEvent('ultraFeedPerformance', { 
        ultraFeedResolverTotalExecutionTime: executionTime,
        sessionId,
        offset: offset ?? 0
      });

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error in UltraFeed resolver:", error);
      
      throw error;
    }
  }
};
