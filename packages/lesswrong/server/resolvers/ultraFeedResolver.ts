import { defineFeedResolver } from "../utils/feedUtil";
import { addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import UltraFeedRepo from "../../lib/ultraFeed/UltraFeedRepo";
import { 
  FeedItemSourceType,
  UltraFeedResolverType, 
  FeedItemRenderType,
  FeedItem,
  FeedItemResolverType,
  FeedPostWithComments,
  FeedSpotlight,
  FeedSpotlightItem
} from "@/components/ultraFeed/ultraFeedTypes";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";

addGraphQLSchema(`
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
`);

// Define source weights for weighted sampling
const SOURCE_WEIGHTS = {
  postThreads: 20,
  commentThreads: 40,
  spotlights: 5,
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
defineFeedResolver<Date>({
  name: "UltraFeed",
  cutoffTypeGraphQL: "Date", 
  args: "",
  resultTypesGraphQL: `
    feedCommentThread: UltraFeedPostWithComments
    feedPost: UltraFeedPostWithComments
    feedSpotlight: FeedSpotlightItem
  `,
  resolver: async ({
    limit = 20,
    cutoff,
    offset,
    sessionId,
    args,
    context
  }: {
    limit?: number,
    cutoff?: Date|null,
    offset?: number,
    sessionId?: string,
    args: any,
    context: ResolverContext
  }) => {
    console.log("UltraFeed resolver called with:", {
      limit,
      cutoff: cutoff ? cutoff.toISOString() : null,
      offset,
      hasCurrentUser: !!context.currentUser,
      sessionIdProvided: !!sessionId
    });

    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in to fetch UltraFeed.");
    }

    try {
      const ultraFeedRepo = new UltraFeedRepo();

      // Get minimal data from repo methods
      const [postThreadsItems, commentThreadsItems, spotlightItems] = await Promise.all([
        ultraFeedRepo.getUltraFeedPostThreads(context, limit),
        ultraFeedRepo.getUltraFeedCommentThreads(context, limit),
        ultraFeedRepo.getUltraFeedSpotlights(context, limit/4)
      ]);
      
      // Create sources object for weighted sampling
      const sources: Record<UsedFeedItemSourceType, { weight: number, items: FeedItem[], renderAsType: FeedItemRenderType }> = {
        postThreads: {
          weight: SOURCE_WEIGHTS.postThreads,
          items: postThreadsItems,
          renderAsType: "feedPost"
        },
        commentThreads: {
          weight: SOURCE_WEIGHTS.commentThreads,
          items: commentThreadsItems,
          renderAsType: "feedCommentThread"
        },
        spotlights: {
          weight: SOURCE_WEIGHTS.spotlights,
          items: spotlightItems,
          renderAsType: "feedSpotlight"
        }
      };

      console.log("Performing weighted sampling with:", {
        postThreadsCount: sources.postThreads.items.length,
        commentThreadsCount: sources.commentThreads.items.length,
        spotlightsCount: sources.spotlights.items.length,
        sources: sources,
        requestedLimit: limit
      });
      
      // Sample from the sources based on weights
      const sampledItems = weightedSample(sources, limit);
      
      // Transform results for the feed
      const results: UltraFeedResolverType[] = filterNonnull(await Promise.all(
        sampledItems.map(async (item: SampledItem, index: number): 
        Promise<UltraFeedResolverType | null> => {
        if (!item.renderAsType) {
          console.log("No renderAsType for item:", item);
        }
        
        // Special case for spotlights which are handled differently
        if (item.renderAsType === "feedSpotlight") {
          return {
            type: item.renderAsType,
            [item.renderAsType]: {
              _id: item.feedSpotlight.spotlightId,
              spotlight: await context.loaders.Spotlights.load(item.feedSpotlight.spotlightId)
            }
          };
        }

        if (item.renderAsType === "feedPost" || item.renderAsType === "feedCommentThread") {

          const { postId, postMetaInfo, commentMetaInfos, commentIds } = item.renderAsType === "feedPost" ? item.feedPost : item.feedCommentThread;

          if (!postId) {
            console.log("No postId for item:", item);
            return null;
          }

          return {
            type: item.renderAsType,
            [item.renderAsType]: {
              _id: `feed-item-${index}-${Date.now()}`,
              post: await context.loaders.Posts.load(postId) ?? null,
              postMetaInfo: postMetaInfo || {},
              comments: await Promise.all(commentIds?.map( async (id: string) => context.loaders.Comments.load(id)) || []),
              commentMetaInfos: commentMetaInfos || {},
            }
          };  
        }

        console.error("Unknown item renderAsType:", item);
        return null;
      })))

      // Determine if there are likely more results that could be returned
      const hasMoreResults = true;
      
      const response = {
        cutoff: hasMoreResults ? new Date() : null, // null signals end of results
        endOffset: (offset || 0) + results.length,
        results,
        sessionId // Include the sessionId in the response
      };
      
      return response;
    } catch (error) {
      console.error("Error in UltraFeed resolver:", error);
      throw error;
    }
  }
});
