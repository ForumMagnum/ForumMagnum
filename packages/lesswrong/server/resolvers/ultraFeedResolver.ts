import crypto from 'crypto';
import {
  FeedItemSourceType, UltraFeedResolverType, FeedItemRenderType, FeedItem,
  FeedSpotlight, FeedFullPost, FeedCommentMetaInfo,
  PreDisplayFeedComment,
  FeedCommentsThread,
  FeedCommentsThreadResolverType,
  FeedPostResolverType,
  feedPostSourceTypesArray,
  feedCommentSourceTypesArray,
  feedSpotlightSourceTypesArray,
  FeedItemDisplayStatus
} from "@/components/ultraFeed/ultraFeedTypes";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import gql from 'graphql-tag';
import { bulkRawInsert } from '../manualMigrations/migrationUtils';
import cloneDeep from 'lodash/cloneDeep';
import { getUltraFeedCommentThreads } from '@/server/ultraFeed/ultraFeedThreadHelpers';
import { DEFAULT_SETTINGS as DEFAULT_ULTRAFEED_SETTINGS, UltraFeedSettingsType } from '@/components/ultraFeed/ultraFeedSettingsTypes';
import { loadByIds } from '@/lib/loaders';
import { getUltraFeedPostThreads } from '@/server/ultraFeed/ultraFeedPostHelpers';
import { ReadStatuses } from '../collections/readStatus/collection';

export const ultraFeedGraphQLTypeDefs = gql`
  type FeedPost {
    _id: String!
    postMetaInfo: JSON
    post: Post
  }

  type FeedCommentThread {
    _id: String!
    commentMetaInfos: JSON
    comments: [Comment]
    post: Post                         
  }

  type FeedSpotlightItem {
    _id: String!
    spotlight: Spotlight
  }

  type UltraFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [UltraFeedEntryType!]
    sessionId: String
  }

  type UltraFeedEntryType {
    type: String!
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
`

interface WeightedSource {
  weight: number;
  items: FeedItem[];
  renderAsType: FeedItemRenderType;
}

type SampledItem = { renderAsType: "feedCommentThread", feedCommentThread: FeedCommentsThread }
                 | { renderAsType: "feedPost", feedPost: FeedFullPost }
                 | { renderAsType: "feedSpotlight", feedSpotlight: FeedSpotlight };

const weightedSample = (
  inputs: Record<FeedItemSourceType, WeightedSource>,
  totalItems: number
): SampledItem[] => {
  // Create deep copies of the input arrays to avoid modifying the originals
  const sourcesWithCopiedItems = cloneDeep(inputs);

  const finalFeed: SampledItem[] = [];
  let totalWeight = Object.values(sourcesWithCopiedItems).reduce(
    (sum, src) => sum + (src.items.length > 0 ? src.weight : 0),
    0
  );

  for (let i = 0; i < totalItems; i++) {
    if (totalWeight <= 0) break;

    const pick = Math.random() * totalWeight;

    let cumulative = 0;
    let chosenSourceKey: FeedItemSourceType | null = null;

    for (const [key, src] of Object.entries(sourcesWithCopiedItems)) {
      if (src.items.length === 0) continue;

      cumulative += src.weight;
      if (pick < cumulative) {
        chosenSourceKey = key as FeedItemSourceType;
        break;
      }
    }

    if (chosenSourceKey) {
      const sourceItems = sourcesWithCopiedItems[chosenSourceKey];
      const item = sourceItems.items.shift();

      if (!item) {
        continue;
      }

      if (sourceItems.renderAsType === "feedCommentThread") {
        finalFeed.push({
          renderAsType: "feedCommentThread",
          feedCommentThread: item as FeedCommentsThread
        });
      } else if (sourceItems.renderAsType === "feedPost") {
        finalFeed.push({
          renderAsType: "feedPost",
          feedPost: item as FeedFullPost
        });
      } else if (sourceItems.renderAsType === "feedSpotlight") {
        finalFeed.push({
          renderAsType: "feedSpotlight",
          feedSpotlight: item as FeedSpotlight
        });
      }

      if (sourceItems.items.length === 0) {
        totalWeight -= sourceItems.weight;
      }
    }
  }

  return finalFeed;
}

const parseUltraFeedSettings = (settingsJson?: string): UltraFeedSettingsType => {
  let parsedSettings: UltraFeedSettingsType = DEFAULT_ULTRAFEED_SETTINGS;
  if (settingsJson) {
    try {
      const settingsFromArg = JSON.parse(settingsJson);
      parsedSettings = { ...DEFAULT_ULTRAFEED_SETTINGS, ...settingsFromArg };
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
  spotlightItems: FeedSpotlight[]
): Record<FeedItemSourceType, WeightedSource> => {
  const sources = {} as Record<FeedItemSourceType, WeightedSource>;
  const commentSourceType: FeedItemSourceType = 'recentComments';
  
  // Initialize sources with empty item arrays based on sourceWeights
  Object.entries(sourceWeights).forEach(([source, weight]) => {
    const sourceType = source as FeedItemSourceType;
    if (weight <= 0) return;

    let renderAsType: FeedItemRenderType;
    if ((feedPostSourceTypesArray as readonly string[]).includes(sourceType)) {
      renderAsType = 'feedPost';
    } else if (sourceType === commentSourceType) {
      renderAsType = 'feedCommentThread';
    } else if ((feedSpotlightSourceTypesArray as readonly string[]).includes(sourceType)) {
      renderAsType = 'feedSpotlight';
    } else {
      // eslint-disable-next-line no-console
      console.warn(`UltraFeedResolver: Source type "${sourceType}" found in sourceWeights but not in known type arrays.`);
      return; // Skip sources not mappable to a render type
    }

    sources[sourceType] = {
      weight,
      items: [], 
      renderAsType
    };
  });

  // Add spotlight items
  if (sources.spotlights && spotlightItems.length > 0) {
    sources.spotlights.items = spotlightItems;
  }

  // Add post items to their sources
  postThreadsItems.forEach(postItem => {
    const itemSources = postItem.postMetaInfo?.sources;
    if (Array.isArray(itemSources)) {
      itemSources.forEach(source => {
        const sourceType = source as FeedItemSourceType;
        if (sources[sourceType]) {
          // Avoid adding duplicates to the same source list if a post somehow has multiple identical sources
          if (!sources[sourceType].items.some(item => (item as FeedFullPost).post?._id === postItem.post?._id)) {
             sources[sourceType].items.push(postItem);
          }
        }
      });
    }
  });

  // Add ALL prepared comment threads to the single 'recentComments' bucket if it exists
  if (sources[commentSourceType]) {
    sources[commentSourceType].items = commentThreadsItems; 
  } else if (commentThreadsItems.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(`UltraFeedResolver: Prepared ${commentThreadsItems.length} comment threads, but '${commentSourceType}' source is not defined or has zero weight in sourceWeights.`);
  }

  return Object.entries(sources).reduce((acc, [key, value]) => {
    if (value.items.length > 0) {
      acc[key as FeedItemSourceType] = value;
    }
    return acc;
  }, {} as Record<FeedItemSourceType, WeightedSource>);
};

/**
 * Extract IDs that need to be loaded from sampled items
 */
const extractIdsToLoad = (sampledItems: SampledItem[]) => {
  const spotlightIdsToLoad: string[] = [];
  const commentIdsToLoad = new Set<string>();

  sampledItems.forEach(item => {
    if (item.renderAsType === "feedSpotlight") {
      spotlightIdsToLoad.push(item.feedSpotlight.spotlightId);
    } else if (item.renderAsType === "feedCommentThread") {
      item.feedCommentThread.comments?.forEach(comment => {
        if (comment.commentId) {
          commentIdsToLoad.add(comment.commentId);
        }
      });
    }
  });
  
  return {
    spotlightIds: spotlightIdsToLoad,
    commentIds: Array.from(commentIdsToLoad)
  };
};

/**
 * Transform sampled items into UltraFeedResolverType results
 */
const transformItemsForResolver = (
  sampledItems: SampledItem[],
  spotlightsById: Map<string, DbSpotlight>,
  commentsById: Map<string, DbComment>
): UltraFeedResolverType[] => {
  return filterNonnull(sampledItems.map((item: SampledItem, index: number): UltraFeedResolverType | null => {
    if (item.renderAsType === "feedSpotlight") {
      const spotlight = spotlightsById.get(item.feedSpotlight.spotlightId);
      if (!spotlight) return null;
      
      return {
        type: item.renderAsType,
        feedSpotlight: {
          _id: item.feedSpotlight.spotlightId,
          spotlight
        }
      };
    }

    if (item.renderAsType === "feedCommentThread") {
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
            commentMetaInfos[comment.commentId] = comment.metaInfo;
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
        _id: threadId, // Use the hash-based ID
        comments: loadedComments,
        commentMetaInfos
      };

      return {
        type: item.renderAsType,
        feedCommentThread: resultData
      };
    }

    if (item.renderAsType === "feedPost") {
      const { post, postMetaInfo } = item.feedPost;

      if (!post) { 
        // eslint-disable-next-line no-console
        console.warn("Resolver: No post for feedPost"); return null; 
      }
      const stablePostId = post?._id ? post._id : `feed-post-${index}`;

      const resultData: FeedPostResolverType = {
        _id: stablePostId,
        post,
        postMetaInfo
      };

      return {
        type: item.renderAsType,
        feedPost: resultData
      };
    }

    // eslint-disable-next-line no-console
    console.error("Unknown item renderAsType:", item);
    return null;
  }));
};

type UltraFeedEventInsertData = Pick<DbUltraFeedEvent, 'userId' | 'eventType' | 'collectionName' | 'documentId' > & { event?: { 
  sessionId: string;
  itemIndex: number;
  commentIndex?: number;
  displayStatus?: FeedItemDisplayStatus;
} };

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
        userId,
        eventType: "served",
        collectionName: "Spotlights",
        documentId: item.feedSpotlight.spotlight._id,
        event: { sessionId, itemIndex: actualItemIndex }
      });
    } else if (item.type === "feedCommentThread" && (item.feedCommentThread?.comments?.length ?? 0) > 0) {
        const threadData = item.feedCommentThread;
        const comments = threadData?.comments;
        const commentMetaInfos = threadData?.commentMetaInfos;
        comments?.forEach((comment: DbComment, commentIndex) => {
          if (comment?._id) {
            const displayStatus = commentMetaInfos?.[comment._id]?.displayStatus;
            eventsToCreate.push({ 
               userId, 
               eventType: "served", 
               collectionName: "Comments", 
               documentId: comment._id, 
               event: { sessionId, itemIndex: actualItemIndex, commentIndex, displayStatus }
              });
          }
        });
    } else if (item.type === "feedPost" && item.feedPost?.post?._id) {
      const feedItem = item.feedPost;
      if (feedItem.post._id) { 
        eventsToCreate.push({ 
          userId, 
          eventType: "served", 
          collectionName: "Posts", 
          documentId: feedItem.post._id,
          event: { sessionId, itemIndex: actualItemIndex }
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
  bookmarkedPostsFetchLimit: number;
  recombeePostFetchLimit: number;
  hackerNewsPostFetchLimit: number;
  commentFetchLimit: number;
  spotlightFetchLimit: number;
  bufferMultiplier: number;
} => {
  const totalWeight = Object.values(sourceWeights).reduce((sum: number, weight) => sum + weight, 0);
  
  const recombeePostWeight = sourceWeights['recombee-lesswrong-custom'] ?? 0;
  const hackerNewsPostWeight = sourceWeights['hacker-news'] ?? 0;
  const totalCommentWeight = feedCommentSourceTypesArray.reduce((sum: number, type: FeedItemSourceType) => sum + (sourceWeights[type] || 0), 0);
  const totalSpotlightWeight = feedSpotlightSourceTypesArray.reduce((sum: number, type: FeedItemSourceType) => sum + (sourceWeights[type] || 0), 0);
  const bookmarkedPostsWeight = sourceWeights['bookmarks'] ?? 0;

  return {
    totalWeight,
    bookmarkedPostsFetchLimit: Math.ceil(totalLimit * (bookmarkedPostsWeight / totalWeight) * bufferMultiplier),
    recombeePostFetchLimit: Math.ceil(totalLimit * (recombeePostWeight / totalWeight) * bufferMultiplier),
    hackerNewsPostFetchLimit: Math.ceil(totalLimit * (hackerNewsPostWeight / totalWeight) * bufferMultiplier),
    commentFetchLimit: Math.ceil(totalLimit * (totalCommentWeight / totalWeight) * bufferMultiplier),
    spotlightFetchLimit: Math.ceil(totalLimit * (totalSpotlightWeight / totalWeight) * bufferMultiplier),
    bufferMultiplier
  };
};



/**
 * UltraFeed resolver
 */
export const ultraFeedGraphQLQueries = {
  UltraFeed: async (_root: void, args: UltraFeedArgs, context: ResolverContext) => {
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

      const { totalWeight,
        bookmarkedPostsFetchLimit,
        recombeePostFetchLimit,
        hackerNewsPostFetchLimit,
        commentFetchLimit,
        spotlightFetchLimit,
        bufferMultiplier } = calculateFetchLimits(sourceWeights, limit);


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

      const servedCommentThreadHashes = await ultraFeedEventsRepo.getRecentlyServedCommentThreadHashes(currentUser._id, sessionId);

      const combinedPostFetchLimit = recombeePostFetchLimit + hackerNewsPostFetchLimit + bookmarkedPostsFetchLimit;


      const [allPostItems, commentThreadsItems, spotlightItems] = await Promise.all([
        combinedPostFetchLimit > 0 ? getUltraFeedPostThreads( context, recombeePostFetchLimit, hackerNewsPostFetchLimit, bookmarkedPostsFetchLimit, parsedSettings) : Promise.resolve([]),
        commentFetchLimit > 0 ? getUltraFeedCommentThreads(context, commentFetchLimit, parsedSettings, servedCommentThreadHashes) : Promise.resolve([]),
        spotlightFetchLimit > 0 ? spotlightsRepo.getUltraFeedSpotlights(context, spotlightFetchLimit) : Promise.resolve([])
      ]) as [FeedFullPost[], FeedCommentsThread[], FeedSpotlight[]];

      const populatedSources = createSourcesMap(
        sourceWeights,
        allPostItems,
        commentThreadsItems,
        spotlightItems
      );

      // Sample items from sources based on weights
      const sampledItems = weightedSample(populatedSources, limit);
      
      // Extract IDs to load
      const { spotlightIds, commentIds } = extractIdsToLoad(sampledItems);
      
      // Load full content for sampled items
      const [spotlightsResults, commentsResults] = await Promise.all([
        loadByIds(context, "Spotlights", spotlightIds),
        loadByIds(context, "Comments", commentIds)
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
      
      // Transform sampled items into final results
      const results = transformItemsForResolver(sampledItems, spotlightsById, commentsById);
      
      if (!incognitoMode) {
        const currentOffset = offset ?? 0; 
        const eventsToCreate = createUltraFeedEvents(results, currentUser._id, sessionId, currentOffset);
        if (eventsToCreate.length > 0) {
          void bulkRawInsert("UltraFeedEvents", eventsToCreate as DbUltraFeedEvent[]);
        }
      }

      // Return response
      const response = {
        __typename: "UltraFeedQueryResults",
        cutoff: results.length > 0 ? new Date() : null,
        endOffset: (offset ?? 0) + results.length,
        results,
        sessionId
      };

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error in UltraFeed resolver:", error);
      throw error;
    }
  }
};
