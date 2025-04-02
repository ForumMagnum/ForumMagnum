import UltraFeedRepo from "../../lib/ultraFeed/UltraFeedRepo";
import { 
  FeedItemSourceType,
  UltraFeedResolverType, 
  FeedItemRenderType,
  FeedItem,
  FeedPostWithComments,
  FeedSpotlight,
} from "@/components/ultraFeed/ultraFeedTypes";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import gql from 'graphql-tag';
import { createMutator } from '../vulcan-lib/mutators';
import { UltraFeedEvents } from '../collections/ultraFeedEvents/collection';

export const ultraFeedGraphQLTypeDefs = gql`
  type UltraFeedPostWithComments {
    _id: String!
    postMetaInfo: JSON                 # Metadata about the post display
    commentMetaInfos: JSON             # Metadata about comment display states
    post: Post                         # The actual post data, loaded via ID
    comments: [Comment]                # The actual comment data, loaded via IDs
  }

  type FeedSpotlightItem {
    _id: String!
    spotlight: Spotlight               # The actual spotlight data, loaded via ID
  }

  type UltraFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [UltraFeedEntryType!]
    sessionId: String
  }

  type UltraFeedEntryType {
    type: String!
    feedCommentThread: UltraFeedPostWithComments
    feedPost: UltraFeedPostWithComments
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

// Define source weights for weighted sampling
const SOURCE_WEIGHTS = {
  postThreads: 20,
  commentThreads: 40,
  spotlights: 3,
  // popularComments: 5,
  // quickTakes: 5,
  // subscribed: 0
};

// Define the subset of FeedItemSourceType that we actually use
type UsedFeedItemSourceType = Extract<FeedItemSourceType, "postThreads" | "commentThreads" | "spotlights">;

interface WeightedSource {
  weight: number;
  items: FeedItem[];
  renderAsType: FeedItemRenderType;
}

type SampledItem = { renderAsType: "feedCommentThread", feedCommentThread: FeedPostWithComments } | { renderAsType: "feedPost", feedPost: FeedPostWithComments } | { renderAsType: "feedSpotlight", feedSpotlight: FeedSpotlight };

// Helper function to perform weighted sampling
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
    // If no items remain in any source, break
    if (totalWeight <= 0) break;

    // Pick a random float in [0, totalWeight)
    const pick = Math.random() * totalWeight;

    let cumulative = 0;
    let chosenSourceKey: UsedFeedItemSourceType | null = null;

    for (const [key, src] of Object.entries(sourcesWithCopiedItems)) {
      // Skip sources that have run out of items
      if (src.items.length === 0) continue;

      cumulative += src.weight;
      if (pick < cumulative) {
        chosenSourceKey = key as UsedFeedItemSourceType;
        break;
      }
    }

    // We found a source to sample from
    if (chosenSourceKey) {
      const sourceItems = sourcesWithCopiedItems[chosenSourceKey];
      const item = sourceItems.items.shift(); // This modifies our copy, not the original

      // Skip if item is undefined
      if (!item) continue;

      // Create object based on renderAsType to avoid type errors
      if (sourceItems.renderAsType === "feedCommentThread") {
        finalFeed.push({
          renderAsType: "feedCommentThread",
          feedCommentThread: item as FeedPostWithComments
        });
      } else if (sourceItems.renderAsType === "feedPost") {
        finalFeed.push({
          renderAsType: "feedPost",
          feedPost: item as FeedPostWithComments
        });
      } else if (sourceItems.renderAsType === "feedSpotlight") {
        finalFeed.push({
          renderAsType: "feedSpotlight",
          feedSpotlight: item as FeedSpotlight
        });
      }

      // If that source is now empty, effectively set its weight to 0
      if (sourceItems.items.length === 0) {
        totalWeight -= sourceItems.weight;
      }
    }
  }

  return finalFeed;
}

/**
 * COMMENTED OUT: Fetches subscribed content for the feed
 */
/*
async function fetchSubscribedContent({
  context,
  currentUser,
  servedPostIds,
  servedPostCommentCombos
}: {
  context: ResolverContext;
  currentUser: DbUser;
  servedPostIds: Set<string>;
  servedPostCommentCombos: Set<string>;
}): Promise<FeedPostItem[]> {
  console.log("Fetching subscribed content...");
  
  // Get posts and comments from subscriptions
  const postsAndCommentsAll = await context.repos.posts.getPostsAndCommentsFromSubscriptions(
    currentUser._id, 
    50 + 90
  );
  
  console.log(`Found ${postsAndCommentsAll.length} subscribed items before filtering`);
  
  // Filter out subscribed items based on our custom rule:
  // Exclude if both the postId and first two commentIds are identical to a previously served item
  const filteredPostsAndComments = postsAndCommentsAll.filter(item => {
    // If no commentIds, just check if the post has been served before
    if (!item.commentIds || item.commentIds.length === 0) {
      return !servedPostIds.has(item.postId);
    }

    // Get the first two comment IDs (or fewer if not enough exist)
    const firstComments = item.commentIds.slice(0, 2);
    
    // Create a combo key with the post ID and first two comment IDs
    const comboKey = `${item.postId}:${firstComments.sort().join(':')}`;
    
    // Only filter out if this exact combination has been served before
    return !servedPostCommentCombos.has(comboKey);
  });
  
  console.log(`${postsAndCommentsAll.length - filteredPostsAndComments.length} subscribed items filtered out as already served`);
  
  if (!filteredPostsAndComments.length) {
    return [];
  }
  
*/

/**
 * UltraFeed resolver
 * 
 * Uses a weighted sampling approach to mix different content types
 * while providing fragment names so GraphQL can load the full content.
 */
export const ultraFeedGraphQLQueries = {
  UltraFeed: async (_root: void, args: any, context: ResolverContext) => {
    const {limit = 20, cutoff, offset, sessionId} = args;
    
    console.log("UltraFeed resolver called with:", {
      limit,
      cutoff: cutoff ? cutoff.toISOString() : null,
      offset,
      hasCurrentUser: !!context.currentUser,
      sessionIdProvided: !!sessionId
    });

    const profiling = {
      startTime: Date.now(),
      sources: {
        postThreads: { count: 0, time: 0 },
        commentThreads: { count: 0, time: 0, totalComments: 0 },
        spotlights: { count: 0, time: 0 },
      },
      sampling: { time: 0 },
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

    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in to fetch UltraFeed.");
    }

    // Helper function to apply timeout to a promise
    const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, methodName: string): Promise<T | []> => {
      const timeoutPromise = new Promise<[]>((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Timeout after ${timeoutMs}ms in ${methodName}`);
          error.name = 'TimeoutError';
          console.error(error);
          reject(error);
        }, timeoutMs);
      });
      
      try {
        return await Promise.race([promise, timeoutPromise]);
      } catch (error) {
        // Just return empty array on timeout
        console.error(`Error in ${methodName}:`, error);
        return [] as any;
      }
    };

    try {
      const ultraFeedRepo = new UltraFeedRepo();
      const TIMEOUT_MS = 5000; // 5 second timeout for each method;

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
        console.log(`UltraFeed: Found ${servedPostIds.size} previously served Posts and ${servedSpotlightIds.size} Spotlights for user ${currentUser._id}.`);
      }
      // --- End Fetch Served IDs ---

      // Get minimal data from repo methods - with timeout only for Recombee posts
      // Profile the execution time of each source method
      const startPostThreads = Date.now();
      // Fetch posts, excluding served ones
      const postThreadsItems = await withTimeout(
        ultraFeedRepo.getUltraFeedPostThreads(context, limit, servedPostIds),
        TIMEOUT_MS,
        'getUltraFeedPostThreads'
      );
      profiling.sources.postThreads.time = Date.now() - startPostThreads;
      profiling.sources.postThreads.count = postThreadsItems.length;

      const startCommentThreads = Date.now();
      // Fetch comment threads (no exclusion done inside repo method yet)
      let commentThreadsItems = await ultraFeedRepo.getUltraFeedCommentThreads(context, limit);
      profiling.sources.commentThreads.time = Date.now() - startCommentThreads;
      
      // Now use the original count for profiling
      profiling.sources.commentThreads.count = commentThreadsItems.length;

      // Calculate total comments across remaining threads
      commentThreadsItems.forEach(thread => {
        const commentCount = thread.commentIds?.length || 0;
        profiling.sources.commentThreads.totalComments += commentCount;
      });

      const startSpotlights = Date.now();
      // Fetch spotlights, excluding served ones
      const spotlightItems = await ultraFeedRepo.getUltraFeedSpotlights(context, Math.ceil(limit / 4), servedSpotlightIds);
      profiling.sources.spotlights.time = Date.now() - startSpotlights;
      profiling.sources.spotlights.count = spotlightItems.length;
      
      // Create sources object for weighted sampling (using UNFILTERED commentThreadsItems)
      const sources: Record<UsedFeedItemSourceType, { weight: number, items: FeedItem[], renderAsType: FeedItemRenderType }> = {
        postThreads: {
          weight: SOURCE_WEIGHTS.postThreads,
          items: postThreadsItems, // Already filtered in repo
          renderAsType: "feedPost"
        },
        commentThreads: {
          weight: SOURCE_WEIGHTS.commentThreads, 
          items: commentThreadsItems, // Use unfiltered list
          renderAsType: "feedCommentThread"
        },
        spotlights: {
          weight: SOURCE_WEIGHTS.spotlights,
          items: spotlightItems, // Already filtered
          renderAsType: "feedSpotlight"
        }
      };

      console.log("Performing weighted sampling with:", {
        postThreadsCount: sources.postThreads.items.length,
        commentThreadsCount: sources.commentThreads.items.length, // Log unfiltered count
        spotlightsCount: sources.spotlights.items.length,
        // sources: sources, // Maybe omit logging full sources object for brevity
        requestedLimit: limit
      });
      
      // Profile the sampling process
      const startSampling = Date.now();
      const sampledItems = weightedSample(sources, limit);
      profiling.sampling.time = Date.now() - startSampling;
      
      // Count sampled items by type
      sampledItems.forEach(item => {
        profiling.sampledItems[item.renderAsType]++;
      });
      
      // Profile the transformation and DB loading process
      const startTransformation = Date.now();
      
      // Transform results for the feed
      const results: UltraFeedResolverType[] = filterNonnull(await Promise.all(
        sampledItems.map(async (item: SampledItem, index: number): 
        Promise<UltraFeedResolverType | null> => {
        if (!item.renderAsType) {
          console.log("No renderAsType for item:", item);
        }
        
        // Special case for spotlights which are handled differently
        if (item.renderAsType === "feedSpotlight") {
          const startDbLoading = Date.now();
          const spotlight = await context.loaders.Spotlights.load(item.feedSpotlight.spotlightId);
          profiling.dbLoading.time += (Date.now() - startDbLoading);
          
          profiling.results.feedSpotlight++;
          
          // --> Add Event Creation Logic <--
          // Removed individual creation logic
          // --> End Event Creation Logic <--
          
          return {
            type: item.renderAsType,
            [item.renderAsType]: {
              _id: item.feedSpotlight.spotlightId,
              spotlight
            }
          };
        }

        if (item.renderAsType === "feedPost" || item.renderAsType === "feedCommentThread") {
          const { postId, postMetaInfo, commentMetaInfos, commentIds } = item.renderAsType === "feedPost" ? item.feedPost : item.feedCommentThread;

          if (!postId) {
            console.log("No postId for item:", item);
            return null;
          }

          const startDbLoading = Date.now();
          const post = await context.loaders.Posts.load(postId) ?? null;
          const comments = await Promise.all(commentIds?.map( async (id: string) => context.loaders.Comments.load(id)) || []);
          profiling.dbLoading.time += (Date.now() - startDbLoading);
          
          // --> Add Event Creation Logic <--
          // Removed individual creation logic
          // --> End Event Creation Logic <--

          if (item.renderAsType === "feedPost") {
            profiling.results.feedPost++;
          } else {
            profiling.results.feedCommentThread++;
            profiling.results.totalComments += (comments?.length || 0);
          }

          return {
            type: item.renderAsType,
            [item.renderAsType]: {
              _id: `feed-item-${index}-${Date.now()}`,
              post,
              postMetaInfo: postMetaInfo || {},
              comments,
              commentMetaInfos: commentMetaInfos || {},
            }
          };  
        }

        console.error("Unknown item renderAsType:", item);
        return null;
      })));
      
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
              documentId: item.feedSpotlight.spotlight._id,
            });
          } else if ((item.type === "feedPost" || item.type === "feedCommentThread")) {
            const feedItem = item.feedPost || item.feedCommentThread;
            if (feedItem?.post?._id) {
              eventsToCreate.push({
                userId: currentUser._id,
                eventType: "served",
                collectionName: "Posts",
                documentId: feedItem.post._id,
              });
            }
            // Add events for comments as well
            feedItem?.comments?.forEach(comment => {
              if (comment?._id) {
                eventsToCreate.push({
                  userId: currentUser._id,
                  eventType: "served",
                  collectionName: "Comments",
                  documentId: comment._id,
                });
              }
            });
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
             await Promise.all(creationPromises);
             console.log("Finished creating 'served' UltraFeedEvents.");
          } catch (error) { 
             // This catch might not be strictly necessary if individual errors are caught above,
             // but it's good practice for the overall Promise.all
             console.error("Error during bulk creation of UltraFeedEvents:", error);
          }
        }
      }
      // ---> End Bulk Create Events <--- 

      // Determine if there are likely more results that could be returned
      const hasMoreResults = true;
      
      const response = {
        __typename: "UltraFeedQueryResults",
        cutoff: hasMoreResults ? new Date() : null, // null signals end of results
        endOffset: (offset || 0) + results.length,
        results,
        sessionId // Include the sessionId in the response
      };

      // Calculate total execution time
      const totalTime = Date.now() - profiling.startTime;
      
      // Calculate main time components
      const sourceTime = profiling.sources.postThreads.time + profiling.sources.commentThreads.time + profiling.sources.spotlights.time;
      const trackedTime = sourceTime + profiling.sampling.time + profiling.dbLoading.time + profiling.transformation.time;
      const otherTime = totalTime - trackedTime;
      
      // Generate comprehensive profiling log
      console.log(`✨ UltraFeed PROFILING (${totalTime}ms) ✨ [${results.length} items]`, {
        breakdown: {
          sourceRetrieval: {
            time: `${sourceTime}ms (${Math.round(sourceTime / totalTime * 100)}%)`,
            postThreads: `${profiling.sources.postThreads.count} items in ${profiling.sources.postThreads.time}ms`,
            commentThreads: `${profiling.sources.commentThreads.count} items with ${profiling.sources.commentThreads.totalComments} comments in ${profiling.sources.commentThreads.time}ms`,
            spotlights: `${profiling.sources.spotlights.count} items in ${profiling.sources.spotlights.time}ms`,
          },
          dbLoading: `${profiling.dbLoading.time}ms (${Math.round(profiling.dbLoading.time / totalTime * 100)}%)`,
          transformation: `${profiling.transformation.time}ms (${Math.round(profiling.transformation.time / totalTime * 100)}%)`,
          other: `${otherTime}ms (${Math.round(otherTime / totalTime * 100)}%)`,
        },
        results: {
          feedPost: profiling.results.feedPost,
          feedCommentThread: profiling.results.feedCommentThread,
          feedSpotlight: profiling.results.feedSpotlight,
          totalComments: profiling.results.totalComments,
        }
      });
      
      return response;
    } catch (error) {
      console.error("Error in UltraFeed resolver:", error);
      throw error;
    }
  }
};
