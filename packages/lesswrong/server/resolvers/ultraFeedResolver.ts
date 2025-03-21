import { defineFeedResolver } from "../utils/feedUtil";
import { addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import { loadByIds } from "../../lib/loaders";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import keyBy from "lodash/keyBy";
import { logFeedItemServings, HydratedFeedItem, feedItemRenderTypes, FeedItemRenderType, FeedCommentThreadItem } from "../utils/feedItemUtils";
import FeedItemServingsRepo from "../repos/FeedItemServingsRepo";
import UltraFeedRepo, {  } from "../../lib/ultraFeed/UltraFeedRepo";
import { DisplayFeedItem, DisplayFeedPostWithComments, UltraFeedTopLevelTypes, FeedItemSourceType } from "@/components/ultraFeed/ultraFeedTypes";

const TESTING_DATE_CUTOFF = new Date('2025-01-01');

addGraphQLSchema(`
  type UltraFeedItem {
    _id: String!
    type: String!                     # The type of the item, e.g., "ultraFeedItem"
    renderAsType: String!              # e.g., "feedPost", "feedComment", "feedCommentThread"
    sources: [String!]!                # e.g., ["quickTakes", "subscribed"]
    itemContent: JSON               # JSON representation of content for the item
  }
`);

// Define source weights for weighted sampling
const SOURCE_WEIGHTS = {
  commentThreads: 10,
  postThreads: 10,
  // Commented out sources as requested
  // popularComments: 5,
  // quickTakes: 5,
  // subscribed: 0
};

// Helper function to perform weighted sampling
function weightedSample(
  inputs: Record<FeedItemSourceType, { weight: number, items: UltraFeedTopLevelTypes[], renderAsType: FeedItemRenderType }>, 
  totalItems: number
): DisplayFeedItem[] {
  const finalFeed: DisplayFeedItem[] = [];
  let totalWeight = Object.values(inputs).reduce((sum, src) => 
    sum + (src.items.length > 0 ? src.weight : 0), 0);

  for (let i = 0; i < totalItems; i++) {
    // If no items remain in any source, break
    if (totalWeight <= 0) break;

    // Pick a random float in [0, totalWeight)
    const pick = Math.random() * totalWeight;

    let cumulative = 0;
    let chosenSourceKey = null;
    
    for (const [key, src] of Object.entries(inputs)) {
      // Skip sources that have run out of items
      if (src.items.length === 0) continue;

      cumulative += src.weight;
      if (pick < cumulative) {
        chosenSourceKey = key;
        break;
      }
    }

    // We found a source to sample from
    if (chosenSourceKey) {
      const sourceItems = inputs[chosenSourceKey as FeedItemSourceType];
      const item = sourceItems.items.shift();
      
      // Skip if item is undefined
      if (!item) continue;
      
      finalFeed.push({
        type: "ultraFeedItem",
        renderAsType: sourceItems.renderAsType, 
        sources: [chosenSourceKey as FeedItemSourceType],
        item
      });
      
      // If that source is now empty, effectively set its weight to 0
      if (sourceItems.items.length === 0) {
        totalWeight -= sourceItems.weight;
      }
    }
  }

  return finalFeed;
}

async function fetchPostThreads({
  context,
  currentUser,
}: {
  context: ResolverContext;
  currentUser: DbUser;
}): Promise<DisplayFeedPostWithComments[]> {
  console.log("Fetching post threads...");

  // Create UltraFeedRepo instance
  const ultraFeedRepo = new UltraFeedRepo();
  
  // Get post threads
  const postThreads = await ultraFeedRepo.getUltraFeedPostThreads(context, 20);
  
  console.log(`Found ${postThreads.length} post threads`);
  
  // Map to FeedPostThreadItem format
  return postThreads;
  
}
/**
 * Fetches comment threads for the feed
 */
async function fetchCommentThreads({
  context,
  currentUser,
  // servedCommentIds
}: {
  context: ResolverContext;
  currentUser: DbUser;
  // servedCommentIds: Set<string>;
}): Promise<DisplayFeedPostWithComments[]> {
  console.log("Fetching comment threads...");
  
  // Create UltraFeedRepo instance
  const ultraFeedRepo = new UltraFeedRepo();
  
  // Get comment threads
  const commentThreads = await ultraFeedRepo.getUltraFeedCommentThreads(context, 20);
  
  console.log(`Found ${commentThreads.length} comment threads`);

  
  // Map to FeedCommentThreadItem format
  return commentThreads;
}

/**
 * COMMENTED OUT: Fetches quick takes (shortform posts) for the feed
 */
/* 
async function fetchQuickTakes({
  context,
  currentUser,
  servedCommentIds
}: {
  context: ResolverContext;
  currentUser: DbUser;
  servedCommentIds: Set<string>;
}): Promise<FeedCommentItem[]> {
  console.log("Fetching quick takes...");
  
  const quickTakesRaw = await context.Comments.find(
    {
      shortform: true,
      deleted: { $ne: true },
      // Exclude comments that have been recently served to this user
      _id: { $nin: Array.from(servedCommentIds) },
      postedAt: { $lt: TESTING_DATE_CUTOFF }
    },
    { limit: 20, sort: { postedAt: -1 } }
  ).fetch();
  
  const quickTakes = await accessFilterMultiple(
    currentUser,
    "Comments",
    quickTakesRaw,
    context
  );

  console.log(`Found ${quickTakes.length} quick takes after filtering already served items`);

  // Map to FeedCommentItem format
  return quickTakes.map((doc: DbComment) => {
    // Make sure we have no circular references
    const comment = {...doc};
    if (comment.parentCommentId === comment._id) {
      comment.parentCommentId = null;
    }
    
    return {
      _id: doc._id,
      comment,
      sources: ["quickTakes"],
      renderAsType: "feedComment"
    };
  });
}
*/

/**
 * COMMENTED OUT: Fetches popular comments for the feed
 */
/*
async function fetchPopularComments({
  context,
  currentUser,
  servedCommentIds
}: {
  context: ResolverContext;
  currentUser: DbUser;
  servedCommentIds: Set<string>;
}): Promise<FeedCommentItem[]> {
  console.log("Fetching popular comments...");
  
  const popularCommentsRaw = await context.Comments.find(
    {
      deleted: { $ne: true },
      baseScore: { $gt: 10 },
      postedAt: { $lt: TESTING_DATE_CUTOFF, $gte: new Date(Date.now() - (180 * 24 * 60 * 60 * 1000)) },
      ...(servedCommentIds.size > 0 ? { _id: { $nin: Array.from(servedCommentIds) } } : {})
    },
    { limit: 50, sort: { baseScore: -1 } }
  ).fetch();
  
  const popularComments = await accessFilterMultiple(
    currentUser,
    "Comments",
    popularCommentsRaw,
    context
  );

  console.log(`Found ${popularComments.length} popular comments after filtering already served items`);

  // Map to FeedCommentItem format
  return popularComments.map((doc: DbComment) => {
    const comment = {...doc};
    if (comment.parentCommentId === comment._id) {
      comment.parentCommentId = null;
    }
    
    return {
      _id: doc._id,
      comment,
      sources: ["popularComments"],
      renderAsType: "feedComment"
    };
  });
}
*/

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
  
  // Load posts and comments
  const postIds = filterNonnull(filteredPostsAndComments.map(row => row.postId));
  const commentIds = filterNonnull(filteredPostsAndComments.flatMap(row => row.fullCommentTreeIds ?? []));
  
  console.log(`Loading ${postIds.length} posts and ${commentIds.length} comments for subscribed content (after filtering)`);
  
  const [posts, comments] = await Promise.all([
    loadByIds(context, "Posts", postIds)
      .then(posts => accessFilterMultiple(currentUser, "Posts", posts, context))
      .then(filterNonnull),
    loadByIds(context, "Comments", commentIds)
      .then(comments => accessFilterMultiple(currentUser, "Comments", comments, context))
      .then(filterNonnull)
  ]);

  console.log(`Successfully loaded ${posts.length} posts and ${comments.length} comments`);

  const postsById = keyBy(posts, p => p._id);
  const commentsById = keyBy(comments, c => c._id);
  
  // Map to FeedPostItem format
  return filteredPostsAndComments
    .filter(item => postsById[item.postId]) // Skip items where post is missing
    .map(item => {
      return {
        _id: item.postId,
        post: postsById[item.postId] as DbPost,
        comments: (item.commentIds?.map(id => commentsById[id]).filter(Boolean) || []) as DbComment[],
        sources: ["subscribed"],
        renderAsType: "feedPost"
      };
    });
}
*/

/**
 * 2) Create the feed resolver. We'll call it "UltraFeed" for now, but you can rename
 *    it in defineFeedResolver if you prefer something like "CommentsComboFeed".
 */
defineFeedResolver<Date>({
  name: "UltraFeed",
  cutoffTypeGraphQL: "Date", 
  args: "",
  resultTypesGraphQL: `
    feedCommentThread: UltraFeedItem
    feedPost: UltraFeedItem
  `,
  /**
   * The resolver function fetches content from multiple sources,
   * samples them based on weights, and returns the merged results.
   */
  resolver: async ({
    limit = 20,
    cutoff,
    offset,
    sessionId: sessionId,
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

    // Fetch recently served items to avoid duplicates using the SQL-powered repo method
    // const feedItemServingsRepo = new FeedItemServingsRepo();
    // const recentlyServedDocs = await feedItemServingsRepo.loadRecentlyServedDocumentsForUser(
    //   currentUser._id,
    //   30, // look back 30 days
    //   1000 // max 1000 items
    // );
    
    // console.log(`Retrieved ${recentlyServedDocs.length} previously served unique documents`);
    
    // // Create sets for O(1) lookups
    // const servedCommentIds = new Set<string>();
    // const servedPostIds = new Set<string>();
    // const servedPostCommentCombos = new Set<string>();
    
    // // Populate the sets from the SQL results
    // for (const item of recentlyServedDocs) {
    //   if (item.collectionName === 'Comments' && item.documentId) {
    //     servedCommentIds.add(item.documentId);
    //   } else if (item.collectionName === 'Posts' && item.documentId) {
    //     servedPostIds.add(item.documentId);
        
    //     // If this is a post with associated comments, the combo is already created by the SQL
    //     if (item.firstTwoCommentIds?.length) {
    //       // Create a combo key of post ID + first comment IDs (sorted to ensure consistent comparison)
    //       const comboKey = `${item.documentId}:${[...item.firstTwoCommentIds].sort().join(':')}`;
    //       servedPostCommentCombos.add(comboKey);
    //     }
    //   }
    // }
    
    // console.log(`Set up lookups for ${servedCommentIds.size} comments, ${servedPostIds.size} posts, and ${servedPostCommentCombos.size} post+comment combinations`);

    try {

      const postThreadsItems = await fetchPostThreads({
        context,
        currentUser,
      });

      const commentThreadsItems = await fetchCommentThreads({
        context,
        currentUser,
        // servedCommentIds
      });
      
      // Commented out other content sources
      /*
      const [quickTakesItems, popularCommentsItems, subscribedItems] = await Promise.all([
        fetchQuickTakes({ context, currentUser, servedCommentIds }),
        fetchPopularComments({ context, currentUser, servedCommentIds }),
        fetchSubscribedContent({ context, currentUser, servedPostIds, servedPostCommentCombos })
      ]);
      */
      
      // Create sources object for weighted sampling
      const sources: Record<FeedItemSourceType, { weight: number, items: UltraFeedTopLevelTypes[], renderAsType: FeedItemRenderType }> = {
        postThreads: {
          weight: SOURCE_WEIGHTS.postThreads,
          items: postThreadsItems,
          renderAsType: "feedPost"
        },
        commentThreads: {
          weight: SOURCE_WEIGHTS.commentThreads,
          items: commentThreadsItems,
          renderAsType: "feedCommentThread"
        }
        // Commented out other sources
        /*
        quickTakes: { 
          weight: SOURCE_WEIGHTS.quickTakes, 
          items: quickTakesItems 
        },
        popularComments: { 
          weight: SOURCE_WEIGHTS.popularComments, 
          items: popularCommentsItems 
        },
        subscribed: { 
          weight: SOURCE_WEIGHTS.subscribed, 
          items: subscribedItems 
        }
        */
      };

      console.log("Performing weighted sampling with:", {
        postThreadsCount: sources.postThreads.items.length,
        commentThreadsCount: sources.commentThreads.items.length,
        // quickTakesCount: sources.quickTakes.items.length,
        // popularCommentsCount: sources.popularComments.items.length,
        // subscribedCount: sources.subscribed.items.length,
        requestedLimit: limit
      });
      
      // Perform weighted sampling to get final items
      const sampledItems: DisplayFeedItem[] = weightedSample(sources, limit);
      console.log(`Sampled ${sampledItems.length} items for feed`);
      
      // Log just the key properties, not the entire potentially large item
      if (sampledItems.length > 0) {
        const example = sampledItems[0];
        console.log('Example item keys:', {
          renderAsType: example.renderAsType,
          sourceCount: example.sources?.length || 0
        });
      }

      
      // Transform results for the feed
      const results = sampledItems.map((item, index) => {
        if (!item.renderAsType) {
          console.log("No renderAsType for item:", item);
        }
        
        // Return an object with type matching the renderAsType and nested field with that name
        const result = {
          type: item.renderAsType, // This is how the MixedTypeFeed knows which renderer to use
          [item.renderAsType]: {  // This field name must match the type
            _id: `feed-item-${index}-${Date.now()}`,
            type: "ultraFeedItem",
            renderAsType: item.renderAsType,
            sources: item.sources || [],
            itemContent: item.item
          }
        };
        
        return result;
      }).filter(Boolean);

      // // Save items to FeedItemServings collection
      // console.log("Saving feed items to FeedItemServings collection...");
      
      // // Use the shared helper function to log feed item servings - fire and forget
      // void logFeedItemServings({
      //   context,
      //   userId: currentUser._id,
      //   sessionId,
      //   results: results.map(r => r?.ultraFeedItem ?? null),
      //   isHistoryView: false // This is a normal feed view, not history
      // });
      // console.log("Triggered feed item servings logging");
      
      // Determine if there are likely more results that could be returned
      const hasMoreResults = sampledItems.length >= limit;
      
      const response = {
        cutoff: hasMoreResults ? new Date() : null, // null signals end of results
        endOffset: (offset || 0) + results.length,
        results,
        sessionId // Include the sessionId in the response
      };
      
      console.log("UltraFeed resolver returning:", {
        hasMoreResults,
        cutoffExists: !!response.cutoff,
        cutoffDate: response.cutoff ? response.cutoff.toISOString() : null,
        endOffset: response.endOffset,
        resultsCount: response.results.length,
        sessionId // Log the sessionId too
      });
      
      return response;
    } catch (error) {
      console.error("Error in UltraFeed resolver:", error);
      throw error;
    }
  }
});
