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
  feedSpotlightSourceTypesArray
} from "@/components/ultraFeed/ultraFeedTypes";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import gql from 'graphql-tag';
import { UltraFeedEvents } from '../collections/ultraFeedEvents/collection';
import { bulkRawInsert } from '../manualMigrations/migrationUtils';
import cloneDeep from 'lodash/cloneDeep';
import { aboutPostIdSetting } from '@/lib/instanceSettings';
import { recombeeApi, recombeeRequestHelpers } from '@/server/recombee/client';
import { HybridRecombeeConfiguration } from '@/lib/collections/users/recommendationSettings';
import { getUltraFeedCommentThreads } from '@/lib/ultraFeed/ultraFeedThreadHelpers';
import { DEFAULT_SETTINGS as DEFAULT_ULTRAFEED_SETTINGS, UltraFeedSettingsType } from '@/components/ultraFeed/ultraFeedSettingsTypes';
import { loadByIds } from '@/lib/loaders';

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
 * Calculate fetch limits for each content type based on source weights and overall number of requested items
 */
const calculateFetchLimits = (
  sourceWeights: Record<string, number>,
  totalLimit: number,
  bufferMultiplier = 2
) => {
  const totalWeight = Object.values(sourceWeights).reduce((sum, weight) => sum + weight, 0);
  
  const totalPostWeight = feedPostSourceTypesArray.reduce((sum, type) => sum + (sourceWeights[type] || 0), 0);
  const totalCommentWeight = feedCommentSourceTypesArray.reduce((sum, type) => sum + (sourceWeights[type] || 0), 0);
  const totalSpotlightWeight = feedSpotlightSourceTypesArray.reduce((sum, type) => sum + (sourceWeights[type] || 0), 0);

  return {
    totalWeight,
    postFetchLimit: Math.ceil(totalLimit * (totalPostWeight / totalWeight) * bufferMultiplier),
    commentFetchLimit: Math.ceil(totalLimit * (totalCommentWeight / totalWeight) * bufferMultiplier),
    spotlightFetchLimit: Math.ceil(totalLimit * (totalSpotlightWeight / totalWeight) * bufferMultiplier)
  };
};

/**
 * Fetch served post IDs for the current user
 */
const getServedPostIds = async (userId: string) => {
  const servedPostIds = new Set<string>();
  const servedEvents = await UltraFeedEvents.find({ 
    userId: userId, 
    eventType: "served",
    collectionName: { $in: ["Posts"] } 
  }, { projection: { documentId: 1, collectionName: 1 } }).fetch();

  servedEvents.forEach(event => {
    if (event.collectionName === "Posts") {
      servedPostIds.add(event.documentId);
    }
  });
  
  return servedPostIds;
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
  
  // Initialize sources with empty item arrays
  Object.entries(sourceWeights).forEach(([source, weight]) => {
    const sourceType = source as FeedItemSourceType;
    let renderAsType: FeedItemRenderType;

    if ((feedPostSourceTypesArray as readonly string[]).includes(sourceType)) {
      renderAsType = 'feedPost';
    } else if ((feedCommentSourceTypesArray as readonly string[]).includes(sourceType)) {
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
      items: [], // Initialize with empty items
      renderAsType
    };
  });

  // Add spotlight items
  if (sources.spotlights) {
    sources.spotlights.items = spotlightItems;
  } else if (spotlightItems.length > 0) {
     // eslint-disable-next-line no-console
     console.warn("UltraFeedResolver: Fetched spotlights but 'spotlights' source is not defined in sourceWeights.");
  }

  // Add post items to their sources
  postThreadsItems.forEach(postItem => {
    const itemSources = postItem.postMetaInfo?.sources;
    if (Array.isArray(itemSources)) {
      itemSources.forEach(source => {
        const sourceType = source as FeedItemSourceType;
        if (sources[sourceType]) {
          sources[sourceType].items.push(postItem);
        }
      });
    }
  });

  // Add comment items to their sources
  commentThreadsItems.forEach(commentThread => {
    let foundSources = false;
    // Find the first comment that *has* source info
    for (const comment of commentThread.comments) {
      const itemSources = comment?.metaInfo?.sources;
      if (Array.isArray(itemSources) && itemSources.length > 0) {
        itemSources.forEach(source => {
          const sourceType = source as FeedItemSourceType;
          if (sources[sourceType]) {
            sources[sourceType].items.push(commentThread);
            foundSources = true;
          }
        });
        if (foundSources) {
          break;
        }
      }
    }
  });

  // Filter out sources with no items
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

/**
 * Create UltraFeed events for tracking served items
 */
const createUltraFeedEvents = (
  results: UltraFeedResolverType[],
  userId: string,
  sessionId: string
): UltraFeedEventInsertData[] => {
  const eventsToCreate: UltraFeedEventInsertData[] = [];
  
  results.forEach(item => {
    if (item.type === "feedSpotlight" && item.feedSpotlight?.spotlight?._id) {
      eventsToCreate.push({
        userId,
        eventType: "served",
        collectionName: "Spotlights",
        documentId: item.feedSpotlight.spotlight._id,
        feedItemId: sessionId
      });
    } else if (item.type === "feedCommentThread" && (item.feedCommentThread?.comments?.length ?? 0) > 0) {
        const threadData = item.feedCommentThread;
        const comments = threadData?.comments;
        const postId = comments?.[0]?.postId;
        if (postId) {
          eventsToCreate.push({ userId, eventType: "served", collectionName: "Posts", documentId: postId, feedItemId: sessionId });
        }
        comments?.forEach((comment: DbComment) => {
          if (comment?._id) {
             eventsToCreate.push({ userId, eventType: "served", collectionName: "Comments", documentId: comment._id, feedItemId: sessionId });
          }
        });
    } else if (item.type === "feedPost" && item.feedPost?.post?._id) {
      const feedItem = item.feedPost;
      // Explicitly check post._id again to satisfy stricter type checking
      if (feedItem.post._id) { 
        eventsToCreate.push({ 
          userId, 
          eventType: "served", 
          collectionName: "Posts", 
          documentId: feedItem.post._id,
          feedItemId: sessionId
        });
      }
    }
  });
  
  return eventsToCreate;
};

/**
 * Get post threads for the UltraFeed using Recombee recommendations
 */
async function getUltraFeedPostThreads(
  context: ResolverContext,
  limit = 20,
  servedPostIds: Set<string> = new Set()
): Promise<FeedFullPost[]> {
  const { currentUser } = context;
  const recombeeUser = recombeeRequestHelpers.getRecombeeUser(context);
  let displayPosts: FeedFullPost[] = [];

  if (!recombeeUser) {
    // eslint-disable-next-line no-console
    console.warn("UltraFeedResolver: No Recombee user found. Cannot fetch hybrid recommendations.");
  } else {
    const settings: HybridRecombeeConfiguration = {
      hybridScenarios: { fixed: 'forum-classic', configurable: 'recombee-lesswrong-custom' },
      excludedPostIds: Array.from(servedPostIds),
      filterSettings: currentUser?.frontpageFilterSettings,
    };

    try {
      const recommendedResults = await recombeeApi.getHybridRecommendationsForUser(
        recombeeUser,
        limit,
        settings,
        context
      );

      displayPosts = recommendedResults.map((item, idx): FeedFullPost | null => {
        if (!item.post?._id) return null;

        // Try to determine the scenario - using the same logic hierarchy as RecombeePostsList.tsx
        let scenario: string | undefined = item.scenario;
        
        if (!scenario) {
          const aboutPostId = aboutPostIdSetting.get();
          if (aboutPostId && item.post._id === aboutPostId && idx === 0) {
            scenario = 'welcome-post';
          } else if (item.curated) {
            scenario = 'curated';
          } else if (item.stickied || item.post.sticky) { 
            scenario = 'stickied';
          } else if (item.recommId) {
            if (item.recommId.includes('forum-classic')) {
              scenario = 'hacker-news';
            } else if (item.recommId.includes('recombee-lesswrong-custom')) {
              scenario = 'recombee-lesswrong-custom';
            }
          } else {
            scenario = 'hacker-news';
          }
        }

        const { post, recommId, generatedAt } = item;
        
        const recommInfo = (recommId && generatedAt) ? {
          recommId,
          scenario: scenario || 'unknown',
          generatedAt,
        } : undefined;

        return {
          post,
          postMetaInfo: {
            sources: [scenario as FeedItemSourceType],
            displayStatus: 'expanded',
            recommInfo: recommInfo,
          },
        };
      }).filter((p): p is FeedFullPost => p !== null);

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error calling getHybridRecommendationsForUser:", error);
    }
  }
  
  return displayPosts;
}

interface UltraFeedArgs {
  limit?: number;
  cutoff?: Date;
  offset?: number;
  sessionId: string;
  settings: string;
}

type UltraFeedEventInsertData = Pick<DbUltraFeedEvent, 'userId' | 'eventType' | 'collectionName' | 'documentId' | 'feedItemId'>;

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

    try {
      const spotlightsRepo = context.repos.spotlights;

      // Calculate fetch limits for different content types
      const { totalWeight, postFetchLimit, commentFetchLimit, spotlightFetchLimit } = 
        calculateFetchLimits(sourceWeights, limit);

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

      // Fetch previously served post IDs
      const servedPostIds = await getServedPostIds(currentUser._id);

      // Fetch content from all sources
      const [postThreadsItems, commentThreadsItems, spotlightItems] = await Promise.all([
        postFetchLimit > 0 ? getUltraFeedPostThreads(context, postFetchLimit, servedPostIds) : Promise.resolve([]),
        commentFetchLimit > 0 ? getUltraFeedCommentThreads(context, commentFetchLimit) : Promise.resolve([]),
        spotlightFetchLimit > 0 ? spotlightsRepo.getUltraFeedSpotlights(context, spotlightFetchLimit) : Promise.resolve([])
      ]) as [FeedFullPost[], FeedCommentsThread[], FeedSpotlight[]];

      // Create sources map and organize items
      const populatedSources = createSourcesMap(
        sourceWeights,
        postThreadsItems, 
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
      
      // Create events for tracking served items
      const eventsToCreate = createUltraFeedEvents(results, currentUser._id, sessionId);
      if (eventsToCreate.length > 0) {
        void bulkRawInsert("UltraFeedEvents", eventsToCreate as DbUltraFeedEvent[]);
      }

      // Return response
      const response = {
        __typename: "UltraFeedQueryResults",
        cutoff: new Date(),
        hasMoreResults: true,
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
