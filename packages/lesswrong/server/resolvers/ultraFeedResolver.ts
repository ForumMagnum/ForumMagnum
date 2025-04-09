import crypto from 'crypto';
import UltraFeedRepo from "../../lib/ultraFeed/UltraFeedRepo";
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
      sessionId: String
    ): UltraFeedQueryResults!
  }
`
const SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  // Post sources
  'recombee-lesswrong-custom': 20,
  'hacker-news': 10,
  'welcome-post': 1, // Low weight, maybe only for new users?
  'curated': 2,
  'stickied': 0,

  // Comment sources
  'quickTakes': 20,
  'topComments': 30,

  // Spotlight sources
  'spotlights': 3,
};

// Re-add WeightedSource interface
interface WeightedSource {
  weight: number;
  items: FeedItem[];
  renderAsType: FeedItemRenderType; // This might need rethinking later
}

type SampledItem = { renderAsType: "feedCommentThread", feedCommentThread: FeedCommentsThread }
                 | { renderAsType: "feedPost", feedPost: FeedFullPost }
                 | { renderAsType: "feedSpotlight", feedSpotlight: FeedSpotlight };

function weightedSample(
  inputs: Record<FeedItemSourceType, WeightedSource>,
  totalItems: number
): SampledItem[] {
  // Create deep copies of the input arrays to avoid modifying the originals
  const sourcesWithCopiedItems = Object.entries(inputs).reduce((acc, [key, value]) => {
    acc[key as FeedItemSourceType] = {
      ...value,
      items: [...value.items] // Create a copy of the items array
    };
    return acc;
  }, {} as Record<FeedItemSourceType, WeightedSource>);

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
        // eslint-disable-next-line no-console
        console.warn("WeightedSample: No item found for chosen source key:", chosenSourceKey);
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
 * UltraFeed resolver
 */
export const ultraFeedGraphQLQueries = {
  UltraFeed: async (_root: void, args: any, context: ResolverContext) => {
    const {limit = 20, cutoff, offset, sessionId} = args;
    
    console.log("UltraFeed resolver called with:", { limit, cutoff: cutoff ? cutoff.toISOString() : null, offset, sessionId });

    const profiling = {
      startTime: Date.now(),
      servedIdFetch: { time: 0 },
      sources: {
        // We'll track each source type individually
        postSources: { count: 0, time: 0 },
        commentSources: { count: 0, time: 0, totalComments: 0 },
        spotlightSources: { count: 0, time: 0 },
      },
      transformation: { time: 0 },
      dbLoading: { time: 0 },
      eventCreation: { time: 0, count: 0 },
      sampledItems: {
        feedPost: 0,
        feedCommentThread: 0,
        feedSpotlight: 0
      },
      results: {
        feedPost: 0,
        feedCommentThread: 0,
        feedSpotlight: 0,
        totalComments: 0
      }
    };

    // Helper to time an individual promise
    async function timePromise<T>(
      promiseFn: () => Promise<T>,
      timingTarget: { time: number }
    ): Promise<T> {
      const start = Date.now();
      try {
        const result = await promiseFn();
        timingTarget.time = Date.now() - start;
        return result;
      } catch (error) {
        timingTarget.time = Date.now() - start; // Record time even on error
        throw error; // Re-throw error
      }
    }
    
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in to fetch UltraFeed.");
    }

    try {
      const ultraFeedRepo = new UltraFeedRepo();

      const totalWeight = Object.values(SOURCE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

      if (totalWeight <= 0) {
        // eslint-disable-next-line no-console
        console.warn("UltraFeedResolver: Total source weight is zero. No items can be fetched or sampled. Returning empty results.");
        return {
          __typename: "UltraFeedQueryResults",
          cutoff: null, // No more results possible if weights are zero
          endOffset: offset || 0,
          results: [],
          sessionId
        };
      }

      const bufferMultiplier = 5; // Fetch 5x the expected need as buffer

      // --- Calculate weights per category using imported arrays directly ---
      const totalPostWeight = feedPostSourceTypesArray.reduce((sum, type) => sum + (SOURCE_WEIGHTS[type] || 0), 0);
      const totalCommentWeight = feedCommentSourceTypesArray.reduce((sum, type) => sum + (SOURCE_WEIGHTS[type] || 0), 0);
      const totalSpotlightWeight = feedSpotlightSourceTypesArray.reduce((sum, type) => sum + (SOURCE_WEIGHTS[type] || 0), 0);

      // --- Calculate fetch limits based on summed weights ---
      const postFetchLimit = Math.ceil(limit * (totalPostWeight / totalWeight) * bufferMultiplier);
      const commentBufferLimit = Math.ceil(limit * (totalCommentWeight / totalWeight) * bufferMultiplier);
      const spotlightFetchLimit = Math.ceil(limit * (totalSpotlightWeight / totalWeight) * bufferMultiplier);

      // --- Profile servedIdFetch ---
      const startServedIdFetch = Date.now();
      let servedPostIds = new Set<string>();

      if (currentUser) {
        const servedEvents = await UltraFeedEvents.find({ 
          userId: currentUser._id, 
          eventType: "served",
          collectionName: { $in: ["Posts"] } 
        }, { projection: { documentId: 1, collectionName: 1 } }).fetch();

        servedEvents.forEach(event => {
          if (event.collectionName === "Posts") {
            servedPostIds.add(event.documentId);
          } else {
            console.warn("UltraFeedResolver: Served event for unconfigured collection:", event.collectionName);
          }
        });
        console.log(`[UltraFeed Debug] Served Post IDs count: ${servedPostIds.size}`);
      }
      profiling.servedIdFetch.time = Date.now() - startServedIdFetch;

      // ---> PARALLELIZE SOURCE FETCHING WITH TIMING <---
      const startSourceFetch = Date.now();
      const [postThreadsItems, commentThreadsItems, spotlightItems] = await Promise.all([
        timePromise(
          () => ultraFeedRepo.getUltraFeedPostThreads(context, postFetchLimit, servedPostIds),
          profiling.sources.postSources
        ),
        timePromise(
          () => ultraFeedRepo.getUltraFeedCommentThreads(context, commentBufferLimit),
          profiling.sources.commentSources
        ),
        timePromise(
          () => ultraFeedRepo.getUltraFeedSpotlights(context, spotlightFetchLimit),
          profiling.sources.spotlightSources
        )
      ]);
      const sourceFetchTime = Date.now() - startSourceFetch;
      // --- END PARALLELIZED FETCHING ---

      // Update Profiling Counts
      profiling.sources.postSources.count = postThreadsItems.length;
      profiling.sources.commentSources.count = commentThreadsItems.length;
      commentThreadsItems.forEach(thread => {
        profiling.sources.commentSources.totalComments += (thread.comments?.length || 0);
      });
      profiling.sources.spotlightSources.count = spotlightItems.length;

      // --- Initialize sources object dynamically ---
      const sources = {} as Record<FeedItemSourceType, WeightedSource>;
      Object.entries(SOURCE_WEIGHTS).forEach(([source, weight]) => {
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
          console.warn(`UltraFeedResolver: Source type "${sourceType}" found in SOURCE_WEIGHTS but not in known type arrays.`);
          return; // Skip sources not mappable to a render type
        }

        sources[sourceType] = {
          weight,
          items: [], // Initialize with empty items
          renderAsType
        };
      });

      // --- Populate sources with fetched items ---
      if (sources.spotlights) {
        sources.spotlights.items = spotlightItems;
      } else if (spotlightItems.length > 0) {
         // eslint-disable-next-line no-console
         console.warn("UltraFeedResolver: Fetched spotlights but 'spotlights' source is not defined in SOURCE_WEIGHTS.");
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
                foundSources = true; // Mark that we added this thread for at least one source
              } else {
                console.warn(`Comment thread containing ${comment?.commentId} has source "${sourceType}" not in SOURCE_WEIGHTS.`);
              }
            });
            if (foundSources) {
              break; // Stop searching once we've assigned the thread based on the first comment with sources
            }
          }
        }
        // Optional: Warn if no comment in the thread had sources
        // if (!foundSources) {
        //   const commentIds = commentThread.comments.map(c => c?.commentId).join(', ');
        //   console.warn(`No sources found for any comment in thread: [${commentIds}]`);
        // }
      });

      // --- Filter out sources with no items ---
      const populatedSources = Object.entries(sources).reduce((acc, [key, value]) => {
        if (value.items.length > 0) {
          acc[key as FeedItemSourceType] = value;
        }
        return acc;
      }, {} as Record<FeedItemSourceType, WeightedSource>);

      // Log input counts before sampling
      const samplingInputCounts = {
        perSource: Object.entries(populatedSources).reduce((acc, [key, source]) => {
          acc[key] = source.items.length;
          return acc;
        }, {} as Record<string, number>),
        totals: {
          postSources: postThreadsItems.length,
          commentSources: commentThreadsItems.length,
          spotlightSources: spotlightItems.length
        },
        requestedLimit: limit
      };
      
      // === Debug Logging: Sources Before Sampling ===
      console.log(`[UltraFeed Debug] Sources before sampling (Session: ${sessionId}):`, JSON.stringify(samplingInputCounts.perSource));
      // === End Debug Logging ===

      // --- Profile Sampling ---
      const startSampling = Date.now();
      const sampledItems = weightedSample(populatedSources, limit);
      const samplingTime = Date.now() - startSampling;

      // Update sample counts
      sampledItems.forEach(item => {
        if (item.renderAsType === "feedPost") profiling.sampledItems.feedPost++;
        else if (item.renderAsType === "feedCommentThread") profiling.sampledItems.feedCommentThread++;
        else if (item.renderAsType === "feedSpotlight") profiling.sampledItems.feedSpotlight++;
      });
      
      // --- Profile Transformation and DB Loading ---
      const startTransformation = Date.now();
      
      // Transform results for the feed
      const results: UltraFeedResolverType[] = filterNonnull(await Promise.all(
        sampledItems.map(async (item: SampledItem, index: number):
        Promise<UltraFeedResolverType | null> => {

          if (item.renderAsType === "feedSpotlight") {
            const startDbLoading = Date.now();
            const spotlight = await context.loaders.Spotlights.load(item.feedSpotlight.spotlightId);
            profiling.dbLoading.time += (Date.now() - startDbLoading);
            
            if (!spotlight) return null;
            
            profiling.results.feedSpotlight++;
            return {
              type: item.renderAsType,
              feedSpotlight: {
                _id: item.feedSpotlight.spotlightId,
                spotlight
              }
            };
          }

          if (item.renderAsType === "feedCommentThread") {
            const { comments } = item.feedCommentThread;

            let loadedComments: DbComment[] = [];

            const startDbLoading = Date.now();
            if (comments && comments.length > 0) {
              const fetchedComments = await Promise.all(comments.map(comment => context.loaders.Comments.load(comment.commentId)));
              loadedComments = filterNonnull(fetchedComments);
            }
            profiling.dbLoading.time += (Date.now() - startDbLoading);
            
            const commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo} = {};
            if (comments) {
              comments.forEach((comment: PreDisplayFeedComment) => {
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
                .filter((id): id is string => typeof id === 'string') // Filter out null/undefined
                .sort(); // Sort IDs for consistent hashing
              if (sortedCommentIds.length > 0) {
                // Use sha256 for consistency with other parts of the codebase
                const hash = crypto.createHash('sha256');
                hash.update(sortedCommentIds.join(','));
                threadId = hash.digest('hex');
              } else {
                console.warn(`UltraFeedResolver: Thread at index ${index} resulted in empty sortedCommentIds list.`);
              }
            } else {
               console.warn(`UltraFeedResolver: Thread at index ${index} has no loaded comments.`);
            }
            
            profiling.results.feedCommentThread++;
            profiling.results.totalComments += loadedComments.length;

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

            profiling.results.feedPost++;

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
      ));
      
      profiling.transformation.time = Date.now() - startTransformation - profiling.dbLoading.time;

      // --- Profile event creation ---
      const startEventCreation = Date.now();
      
      if (currentUser) {
        const eventsToCreate: Partial<DbUltraFeedEvent>[] = [];
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
            eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Posts", documentId: feedItem.post._id });
          }
        });

        // Filter out any partial events that might be missing required fields
        const validEventsToCreate = eventsToCreate.filter(
          (event): event is DbUltraFeedEvent =>
            typeof event.userId === 'string' &&
            typeof event.eventType === 'string' && 
            typeof event.collectionName === 'string' &&
            typeof event.documentId === 'string'
        );

        profiling.eventCreation.count = validEventsToCreate.length;

        if (validEventsToCreate.length > 0) {
          try {
            await bulkRawInsert(UltraFeedEvents.options.collectionName, validEventsToCreate);
          } catch (error) {
            // eslint-disable-next-line no-console
             console.error("Error during bulk insertion of UltraFeedEvents:", error);
          }
        }
      }
      
      profiling.eventCreation.time = Date.now() - startEventCreation;

      const response = {
        __typename: "UltraFeedQueryResults",
        cutoff: new Date(),
        hasMoreResults: true,
        endOffset: (offset || 0) + results.length,
        results,
        sessionId
      };

      const totalTime = Date.now() - profiling.startTime;
      
      // Calculate main time components (excluding overlapping DB load time)
      const trackedPhaseTime = profiling.servedIdFetch.time + 
                              sourceFetchTime + 
                              samplingTime + 
                              profiling.transformation.time + 
                              profiling.eventCreation.time;
                              
      const otherTime = totalTime - trackedPhaseTime;
      
      // Generate comprehensive profiling log object
      const profilingData = {
        sourceWeights: SOURCE_WEIGHTS,
        samplingInputs: samplingInputCounts,
        breakdown: {
          servedIdFetch: `${profiling.servedIdFetch.time}ms (${Math.round(profiling.servedIdFetch.time / totalTime * 100)}%)`,
          numServedPostIds: servedPostIds.size,
          sourceRetrieval: { // Fetching initial candidates (parallel)
            wallClockTime: `${sourceFetchTime}ms (${Math.round(sourceFetchTime / totalTime * 100)}%)`, // Total time for Promise.all
            individualFetches: { // Individual execution times
              postSources: `${profiling.sources.postSources.count} items (${profiling.sources.postSources.time}ms)`,
              commentSources: `${profiling.sources.commentSources.count} items with ${profiling.sources.commentSources.totalComments} comments (${profiling.sources.commentSources.time}ms)`,
              spotlightSources: `${profiling.sources.spotlightSources.count} items (${profiling.sources.spotlightSources.time}ms)`,
            },
          },
          sampling: `${samplingTime}ms (${Math.round(samplingTime / totalTime * 100)}%)`,
          transformation: `${profiling.transformation.time}ms (${Math.round(profiling.transformation.time / totalTime * 100)}%)`, // CPU time
          dbLoadingWait: `${profiling.dbLoading.time}ms (${Math.round(profiling.dbLoading.time / totalTime * 100)}%)`, // Overlapping time
          eventCreation: `${profiling.eventCreation.time}ms (${Math.round(profiling.eventCreation.time / totalTime * 100)}%) for ${profiling.eventCreation.count} events`,
          other: `${otherTime}ms (${Math.round(otherTime / totalTime * 100)}%)`,
        },
        sampledCounts: { // Counts after sampling
          feedPost: profiling.sampledItems.feedPost,
          feedCommentThread: profiling.sampledItems.feedCommentThread,
          feedSpotlight: profiling.sampledItems.feedSpotlight
        },
        finalResults: { // Counts after transformation (could differ due to null results)
          feedPost: profiling.results.feedPost,
          feedCommentThread: profiling.results.feedCommentThread,
          feedSpotlight: profiling.results.feedSpotlight,
          totalComments: profiling.results.totalComments,
        }
      };

      // Log the title and the stringified, pretty-printed data object
      console.log(`✨ UltraFeed PROFILING (${totalTime}ms) ✨ [${results.length} items]`, JSON.stringify(profilingData, null, 2));
      
      // === Debug Logging: Comment Thread IDs per Session ===
      console.log(`[UltraFeed Debug] Session ID: ${sessionId}`);
      results.forEach((item, index) => {
        if (item.type === "feedCommentThread" && item.feedCommentThread?.comments) {
          const commentIds = item.feedCommentThread.comments.map(c => c?._id).filter(id => !!id);
          const threadId = item.feedCommentThread._id;
          console.log(`[UltraFeed Debug]   Thread ${index} (ID: ${threadId}): [${commentIds.join(', ')}]`);
        }
      });
      // === End Debug Logging ===

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error in UltraFeed resolver:", error);
      throw error;
    }
  }
};
