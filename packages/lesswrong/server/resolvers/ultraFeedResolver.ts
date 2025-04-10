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
import shuffle from 'lodash/shuffle';
import { aboutPostIdSetting } from '@/lib/instanceSettings';
import { recombeeApi, recombeeRequestHelpers } from '@/server/recombee/client';
import { HybridRecombeeConfiguration } from '@/lib/collections/users/recommendationSettings';
import { getUltraFeedCommentThreads } from '@/lib/ultraFeed/ultraFeedThreadHelpers';
import { DEFAULT_SETTINGS as DEFAULT_ULTRAFEED_SETTINGS, UltraFeedSettingsType } from '@/components/ultraFeed/ultraFeedSettingsTypes';

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

function weightedSample(
  inputs: Record<FeedItemSourceType, WeightedSource>,
  totalItems: number
): SampledItem[] {
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
      hybridScenarios: { fixed: 'hacker-news', configurable: 'recombee-lesswrong-custom' },
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
        
        const recommInfo = (item.recommId && item.generatedAt) ? {
          recommId: item.recommId,
          scenario: scenario || 'unknown',
          generatedAt: item.generatedAt,
        } : undefined;

        return {
          post: item.post,
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
  sessionId?: string;
  settings?: string;
}

type UltraFeedEventInsertData = Pick<DbUltraFeedEvent, 'userId' | 'eventType' | 'collectionName' | 'documentId'>;

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
    const sourceWeights = parsedSettings.sourceWeights;

    try {
      const commentsRepo = context.repos.comments;
      const spotlightsRepo = context.repos.spotlights;

      const totalWeight = Object.values(sourceWeights).reduce((sum, weight) => sum + weight, 0);

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

      const bufferMultiplier = 2; // Fetch 2x the expected need as buffer

      const totalPostWeight = feedPostSourceTypesArray.reduce((sum, type) => sum + (sourceWeights[type] || 0), 0);
      const totalCommentWeight = feedCommentSourceTypesArray.reduce((sum, type) => sum + (sourceWeights[type] || 0), 0);
      const totalSpotlightWeight = feedSpotlightSourceTypesArray.reduce((sum, type) => sum + (sourceWeights[type] || 0), 0);

      const postFetchLimit = Math.ceil(limit * (totalPostWeight / totalWeight) * bufferMultiplier);
      const commentBufferLimit = Math.ceil(limit * (totalCommentWeight / totalWeight) * bufferMultiplier);
      const spotlightFetchLimit = Math.ceil(limit * (totalSpotlightWeight / totalWeight) * bufferMultiplier);

      let servedPostIds = new Set<string>();

      const servedEvents = await UltraFeedEvents.find({ 
        userId: currentUser._id, 
        eventType: "served",
        collectionName: { $in: ["Posts"] } 
      }, { projection: { documentId: 1, collectionName: 1 } }).fetch();

      servedEvents.forEach(event => {
        if (event.collectionName === "Posts") {
          servedPostIds.add(event.documentId);
        }
      });

      const [postThreadsItems, commentThreadsItems, spotlightItems] = await Promise.all([
        postFetchLimit > 0 ? getUltraFeedPostThreads(context, postFetchLimit, servedPostIds) : Promise.resolve([]),
        commentBufferLimit > 0 ? getUltraFeedCommentThreads(commentsRepo, context, commentBufferLimit) : Promise.resolve([]),
        spotlightFetchLimit > 0 ? spotlightsRepo.getUltraFeedSpotlights(context, spotlightFetchLimit) : Promise.resolve([])
      ]) as [FeedFullPost[], FeedCommentsThread[], FeedSpotlight[]];

      const sources = {} as Record<FeedItemSourceType, WeightedSource>;
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

      if (sources.spotlights) {
        sources.spotlights.items = spotlightItems;
      } else if (spotlightItems.length > 0) {
         // eslint-disable-next-line no-console
         console.warn("UltraFeedResolver: Fetched spotlights but 'spotlights' source is not defined in sourceWeights.");
      }

      // Populate posts
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

      // Populate comment threads
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

      const populatedSources = Object.entries(sources).reduce((acc, [key, value]) => {
        if (value.items.length > 0) {
          acc[key as FeedItemSourceType] = value;
        }
        return acc;
      }, {} as Record<FeedItemSourceType, WeightedSource>);

      const sampledItems = weightedSample(populatedSources, limit);
      
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
      
      const uniqueCommentIds = Array.from(commentIdsToLoad);
      
      const [spotlightsResults, commentsResults] = await Promise.all([
        context.loaders.Spotlights.loadMany(spotlightIdsToLoad),
        context.loaders.Comments.loadMany(uniqueCommentIds)
      ]);
      
      const spotlightsById = new Map<string, DbSpotlight>();
      spotlightsResults.forEach(result => {
        if (result instanceof Error) {
          // eslint-disable-next-line no-console
          console.error("Error loading spotlight:", result);
        } else if (result?._id) {
          spotlightsById.set(result._id, result);
        }
      });

      const commentsById = new Map<string, DbComment>();
      commentsResults.forEach(result => {
        if (result instanceof Error) {
          // eslint-disable-next-line no-console
          console.error("Error loading comment:", result);
        } else if (result?._id) {
          commentsById.set(result._id, result);
        }
      });
      
      const results: UltraFeedResolverType[] = filterNonnull(sampledItems.map((item: SampledItem, index: number): UltraFeedResolverType | null => {
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
        })
      );
      
      const eventsToCreate: UltraFeedEventInsertData[] = [];
      results.forEach(item => {
        if (item.type === "feedSpotlight" && item.feedSpotlight?.spotlight?._id) {
          eventsToCreate.push({
            userId: currentUser._id,
            eventType: "served",
            collectionName: "Spotlights",
            documentId: item.feedSpotlight.spotlight._id
          });
        } else if (item.type === "feedCommentThread" && (item.feedCommentThread?.comments?.length ?? 0) > 0) {
            const threadData = item.feedCommentThread;
            const comments = threadData?.comments;
            const postId = comments?.[0]?.postId;
            if (postId) {
              eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Posts", documentId: postId });
            }
            comments?.forEach((comment: DbComment) => {
              if (comment?._id) {
                 eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Comments", documentId: comment._id });
              }
            });
        } else if (item.type === "feedPost" && item.feedPost?.post?._id) {
          const feedItem = item.feedPost;
          // Explicitly check post._id again to satisfy stricter type checking
          if (feedItem.post._id) { 
            eventsToCreate.push({ 
              userId: currentUser._id, 
              eventType: "served", 
              collectionName: "Posts", 
              documentId: feedItem.post._id 
            });
          }
        }
      });

      if (eventsToCreate.length > 0) {
        void bulkRawInsert("UltraFeedEvents", eventsToCreate as DbUltraFeedEvent[]);
      }

      const shuffledResults = shuffle(results);

      const response = {
        __typename: "UltraFeedQueryResults",
        cutoff: new Date(),
        hasMoreResults: true,
        endOffset: (offset || 0) + results.length,
        results: shuffledResults,
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
