import UltraFeedRepo from "../../lib/ultraFeed/UltraFeedRepo";
import {
  FeedItemSourceType, UltraFeedResolverType, FeedItemRenderType, FeedItem,
  FeedSpotlight, FeedFullPost, FeedCommentMetaInfo,
  PreDisplayFeedComment,
  FeedCommentsThread,
  FeedCommentsThreadResolverType,
  FeedPostResolverType
} from "@/components/ultraFeed/ultraFeedTypes";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import gql from 'graphql-tag';
import { createMutator } from '../vulcan-lib/mutators';
import { UltraFeedEvents } from '../collections/ultraFeedEvents/collection';

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
const SOURCE_WEIGHTS = {
  postThreads: 20,
  commentThreads: 40,
  spotlights: 1,
};

type UsedFeedItemSourceType = Extract<FeedItemSourceType, "postThreads" | "commentThreads" | "spotlights">;
interface WeightedSource {
  weight: number;
  items: FeedItem[];
  renderAsType: FeedItemRenderType;
}

type SampledItem = { renderAsType: "feedCommentThread", feedCommentThread: FeedCommentsThread }
                 | { renderAsType: "feedPost", feedPost: FeedFullPost }
                 | { renderAsType: "feedSpotlight", feedSpotlight: FeedSpotlight };

function weightedSample(
  inputs: Record<UsedFeedItemSourceType, WeightedSource>, 
  totalItems: number
): SampledItem[] {
  // Create deep copies of the input arrays to avoid modifying the originals
  const sourcesWithCopiedItems = Object.entries(inputs).reduce((acc, [key, value]) => {
    acc[key as UsedFeedItemSourceType] = {
      ...value,
      items: [...value.items] // Create a copy of the items array
    };
    return acc;
  }, {} as Record<UsedFeedItemSourceType, WeightedSource>);

  const finalFeed: SampledItem[] = [];
  let totalWeight = Object.values(sourcesWithCopiedItems).reduce(
    (sum, src) => sum + (src.items.length > 0 ? src.weight : 0),
    0
  );

  for (let i = 0; i < totalItems; i++) {
    if (totalWeight <= 0) break;

    const pick = Math.random() * totalWeight;

    let cumulative = 0;
    let chosenSourceKey: UsedFeedItemSourceType | null = null;

    for (const [key, src] of Object.entries(sourcesWithCopiedItems)) {
      if (src.items.length === 0) continue;

      cumulative += src.weight;
      if (pick < cumulative) {
        chosenSourceKey = key as UsedFeedItemSourceType;
        break;
      }
    }

    if (chosenSourceKey) {
      const sourceItems = sourcesWithCopiedItems[chosenSourceKey];
      const item = sourceItems.items.shift();

      if (!item) continue;

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
    
    const profiling = {
      startTime: Date.now(),
      servedIdFetch: { time: 0 },
      sources: {
        postThreads: { count: 0, time: 0 },
        commentThreads: { count: 0, time: 0, totalComments: 0 },
        spotlights: { count: 0, time: 0 },
      },
      transformation: { time: 0 },
      dbLoading: { time: 0 },
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
          timingTarget.time = Date.now() - start; 
          throw error; // Re-throw error
        }
      }

    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in to fetch UltraFeed.");
    }

    try {
      const ultraFeedRepo = new UltraFeedRepo();

      // --- Calculate Dynamic Fetch Limits ---
      const totalWeight = Object.values(SOURCE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
      const bufferMultiplier = 2.5; // Fetch 2.5x the expected need as buffer
      const minPosts = 8;
      const minComments = 8;
      const minSpotlights = 5;

      const postFetchLimit = Math.max(minPosts, Math.ceil(limit * (SOURCE_WEIGHTS.postThreads / totalWeight) * bufferMultiplier));
      const commentBufferLimit = Math.max(minComments, Math.ceil(limit * (SOURCE_WEIGHTS.commentThreads / totalWeight) * bufferMultiplier));
      // Keep spotlights simpler, ensure a minimum
      const spotlightFetchLimit = Math.max(minSpotlights, Math.ceil(limit / 3)); // Slightly increased from /4

      // --- End Calculate Dynamic Fetch Limits ---


      // --- Fetch Previously Served Item IDs ---
      let servedPostIds = new Set<string>();
      let servedSpotlightIds = new Set<string>();
      // We could fetch servedCommentIds here too if needed later

      if (currentUser) {
        // Query UltraFeedEvents for items served to this user
        // NOTE: Consider adding limits or date constraints if this collection grows large
        const servedEvents = await UltraFeedEvents.find({ 
          userId: currentUser._id, 
          eventType: "served",
          collectionName: { $in: ["Posts", "Spotlights"] } 
        }, { projection: { documentId: 1, collectionName: 1 } }).fetch();

        servedEvents.forEach(event => {
          if (event.collectionName === "Posts") {
            servedPostIds.add(event.documentId);
          } else if (event.collectionName === "Spotlights") {
            servedSpotlightIds.add(event.documentId);
          }
        });
      }

      // ---> PARALLELIZE SOURCE FETCHING WITH DYNAMIC LIMITS & INDIVIDUAL TIMING <---
      const startSourceFetch = Date.now();

      const [postThreadsItems, commentThreadsItems, spotlightItems] = await Promise.all([
        timePromise(
          () => ultraFeedRepo.getUltraFeedPostThreads(context, postFetchLimit, servedPostIds),
          profiling.sources.postThreads
        ),
        timePromise(
          () => ultraFeedRepo.getUltraFeedCommentThreads(context, commentBufferLimit),
          profiling.sources.commentThreads
        ),
        timePromise(
          () => ultraFeedRepo.getUltraFeedSpotlights(context, spotlightFetchLimit, servedSpotlightIds),
          profiling.sources.spotlights
        )
      ]);

      const sourceFetchTime = Date.now() - startSourceFetch;
      // --- END PARALLELIZED FETCHING ---

      // Update Profiling (Individual counts are now set)
      profiling.sources.postThreads.count = postThreadsItems.length;
      profiling.sources.commentThreads.count = commentThreadsItems.length;
      commentThreadsItems.forEach(thread => {
        profiling.sources.commentThreads.totalComments += (thread.comments?.length || 0);
      });
      profiling.sources.spotlights.count = spotlightItems.length;

      const sources: Record<UsedFeedItemSourceType, WeightedSource> = {
        postThreads: {
          weight: SOURCE_WEIGHTS.postThreads,
          items: postThreadsItems, // FeedFullPost[]
          renderAsType: "feedPost"
        },
        commentThreads: {
          weight: SOURCE_WEIGHTS.commentThreads,
          items: commentThreadsItems, // FeedCommentsThread[]
          renderAsType: "feedCommentThread"
        },
        spotlights: {
          weight: SOURCE_WEIGHTS.spotlights,
          items: spotlightItems, // FeedSpotlight[]
          renderAsType: "feedSpotlight"
        }
      };

      // Log input counts before sampling (to be moved to final profiling log)
      const samplingInputCounts = {
        postThreadsCount: sources.postThreads.items.length,
        commentThreadsCount: sources.commentThreads.items.length,
        spotlightsCount: sources.spotlights.items.length,
        requestedLimit: limit
      };

      // Profile the sampling process - REMOVED TIMING
      const sampledItems = weightedSample(sources, limit);
      sampledItems.forEach(item => {
        if (item.renderAsType === "feedPost") profiling.sampledItems.feedPost++;
        else if (item.renderAsType === "feedCommentThread") profiling.sampledItems.feedCommentThread++;
        else if (item.renderAsType === "feedSpotlight") profiling.sampledItems.feedSpotlight++;
      });
      
      // Profile the transformation and DB loading process
      const startTransformation = Date.now();
      
      // Transform results for the feed
      const results: UltraFeedResolverType[] = filterNonnull(await Promise.all(
        sampledItems.map(async (item: SampledItem, index: number):
        Promise<UltraFeedResolverType | null> => {

          // --- Load Spotlights ---
          if (item.renderAsType === "feedSpotlight") {
            const startDbLoading = Date.now();
            const spotlight = await context.loaders.Spotlights.load(item.feedSpotlight.spotlightId);
            profiling.dbLoading.time += (Date.now() - startDbLoading);
            if (!spotlight) return null;
            profiling.results.feedSpotlight++;
            // Ensure the returned object matches UltraFeedResolverType shape
            return {
              type: item.renderAsType,
              feedSpotlight: {
                _id: item.feedSpotlight.spotlightId,
                spotlight
              }
            };
          }

          // --- Load Comment Threads ---
          if (item.renderAsType === "feedCommentThread") {
            const { comments } = item.feedCommentThread;


            let loadedComments: DbComment[] = []; // Expect full DbComment[]

            const startDbLoading = Date.now();
            if (comments && comments.length > 0) {
              const fetchedComments = await Promise.all(comments.map(comment => context.loaders.Comments.load(comment.commentId)));
              loadedComments = filterNonnull(fetchedComments);
            }
            profiling.dbLoading.time += (Date.now() - startDbLoading);

            profiling.results.feedCommentThread++;
            profiling.results.totalComments += (loadedComments?.length || 0);

            const commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo} = {};
            if (comments) {
              comments.forEach((comment: PreDisplayFeedComment) => {
                if (comment.commentId && comment.metaInfo) {
                  commentMetaInfos[comment.commentId] = comment.metaInfo;
                }
              });
            }

            // Generate a stable ID based on post and first comment ID
            const firstCommentId = loadedComments?.[0]?._id;
            const postId = loadedComments?.[0]?.postId;
            const stableThreadId = postId && firstCommentId ? `${postId}:${firstCommentId}` : `feed-comment-thread-${index}`;

            const resultData: FeedCommentsThreadResolverType = {
              _id: stableThreadId, // Use stable ID
              comments: loadedComments,
              commentMetaInfos
            };

            return {
              type: item.renderAsType,
              feedCommentThread: resultData
            };
          }

          // --- Handle Posts ---
          if (item.renderAsType === "feedPost") {
            const { post, postMetaInfo } = item.feedPost;

            if (!post) { console.warn("Resolver: No post for feedPost"); return null; }

            profiling.results.feedPost++;

            // Use the actual post._id as the stable ID for the wrapper
            const stablePostId = post?._id ? post._id : `feed-post-${index}`; // Fallback added

            const resultData: FeedPostResolverType = {
              _id: stablePostId, // Use stable ID
              post,
              postMetaInfo
            };

            return {
              type: item.renderAsType,
              feedPost: resultData
            };
          }

          console.error("Unknown item renderAsType:", item);
          return null;
        })
      ));
      
      profiling.transformation.time = Date.now() - startTransformation;

      // ---> Bulk Create "served" Events <--- 
      if (currentUser) {
        const eventsToCreate: Partial<DbUltraFeedEvent>[] = [];
        results.forEach(item => {
          if (item.type === "feedSpotlight" && item.feedSpotlight?.spotlight?._id) {

            eventsToCreate.push({
              userId: currentUser._id,
              eventType: "served",
              collectionName: "Spotlights",
              documentId:
              item.feedSpotlight.spotlight._id
            });

          } else if (item.type === "feedCommentThread" && (item.feedCommentThread?.comments?.length ?? 0) > 0) {
              const threadData = item.feedCommentThread;
              const comments = threadData?.comments;
              const postId = comments?.[0]?.postId;
              eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Posts", documentId: postId ?? undefined });
              comments?.forEach((comment: DbComment) => {
                if (comment?._id) eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Comments", documentId: comment._id });
              });
          } else if (item.type === "feedPost" && item.feedPost?.post?._id) {
            const feedItem = item.feedPost;
            eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Posts", documentId: feedItem.post._id });
          }
        });

        if (eventsToCreate.length > 0) {
          console.log(`Creating ${eventsToCreate.length} 'served' UltraFeedEvents...`);
          const creationPromises = eventsToCreate.map(eventDoc => 
            createMutator({
              collection: UltraFeedEvents,
              document: eventDoc,
              currentUser: currentUser,
              validate: true, // Keep validation
              context,
            }).catch(error => {
              // Catch individual errors to prevent Promise.all from rejecting early
              console.error(`Failed to create UltraFeedEvent for ${eventDoc.collectionName} ${eventDoc.documentId}:`, error);
              return null; // Resolve with null on error
            })
          );
          
          try {
             void Promise.all(creationPromises);
             console.log("Finished creating 'served' UltraFeedEvents.");
          } catch (error) { 
             console.error("Error during bulk creation of UltraFeedEvents:", error);
          }
        }
      }
      // ---> End Bulk Create Events <--- 

      // Determine if there are likely more results that could be returned
      const hasMoreResults = true;
      
      const response = {
        __typename: "UltraFeedQueryResults",
        cutoff: hasMoreResults ? new Date() : null,
        endOffset: (offset || 0) + results.length,
        results,
        sessionId
      };

      const totalTime = Date.now() - profiling.startTime;
      
      // Recalculate breakdown using wall-clock source fetch time
      const trackedPhaseTime = profiling.servedIdFetch.time + sourceFetchTime + profiling.transformation.time;
      const otherTime = totalTime - trackedPhaseTime;
      
      // Generate comprehensive profiling log object
      const profilingData = {
        sourceWeights: SOURCE_WEIGHTS,
        samplingInputs: samplingInputCounts,
        breakdown: {
          servedIdFetch: `${profiling.servedIdFetch.time}ms (${Math.round(profiling.servedIdFetch.time / totalTime * 100)}%)`,
          numPreviouslyServedIds: {servedPostIds: servedPostIds.size, servedSpotlightIds: servedSpotlightIds.size},
          sourceRetrieval: { // Fetching initial candidates (parallel)
            wallClockTime: `${sourceFetchTime}ms (${Math.round(sourceFetchTime / totalTime * 100)}%)`, // Total time for Promise.all
            individualFetches: { // Individual execution times
              postThreads: `${profiling.sources.postThreads.count} items (${profiling.sources.postThreads.time}ms)`,
              commentThreads: `${profiling.sources.commentThreads.count} items, ${profiling.sources.commentThreads.totalComments} comments (${profiling.sources.commentThreads.time}ms)`,
              spotlights: `${profiling.sources.spotlights.count} items (${profiling.sources.spotlights.time}ms)`,
            },
          },
          transformation: `${profiling.transformation.time}ms (${Math.round(profiling.transformation.time / totalTime * 100)}%)`,
          dbLoadingWait: `${profiling.dbLoading.time}ms (${Math.round(profiling.dbLoading.time / totalTime * 100)}%)`,
          other: `${otherTime}ms (${Math.round(otherTime / totalTime * 100)}%)`,
        },
        sampledCounts: { // Renamed from 'results' in profiling object for clarity
            feedPost: profiling.sampledItems.feedPost,
            feedCommentThread: profiling.sampledItems.feedCommentThread,
            feedSpotlight: profiling.sampledItems.feedSpotlight
        },
        finalResults: { // Renamed from 'results' in profiling object for clarity
          feedPost: profiling.results.feedPost,
          feedCommentThread: profiling.results.feedCommentThread,
          feedSpotlight: profiling.results.feedSpotlight,
          totalComments: profiling.results.totalComments,
        }
      };

      // Log the title and the stringified, pretty-printed data object
      console.log(`✨ UltraFeed PROFILING (${totalTime}ms) ✨ [${results.length} items]`, JSON.stringify(profilingData, null, 2));
      
      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error in UltraFeed resolver:", error);
      throw error;
    }
  }
};
