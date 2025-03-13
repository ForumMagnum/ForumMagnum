import { defineFeedResolver } from "../utils/feedUtil";
import { addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import { loadByIds } from "../../lib/loaders";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import keyBy from "lodash/keyBy";

/**
 * 1) Define a unified GraphQL type for our feed items:
 *    Each item has a renderAsType and sources at the top level
 */
addGraphQLSchema(`
  type UltraFeedItem {
    _id: String!
    type: String!                     # The type of the item, e.g., "ultraFeedItem"
    renderAsType: String!              # e.g., "feedPost", "feedComment"
    sources: [String!]!                # e.g., ["quickTakes", "subscribed"]
    
    # If the primary document is a Post, store it here. Otherwise null.
    primaryPost: Post
    
    # If the item includes multiple secondary posts, store them here. 
    secondaryPosts: [Post]
    
    # If the primary document is a Comment, store it here instead.
    primaryComment: Comment
    
    # If there are multiple related comments, store them here, if desired.
    secondaryComments: [Comment]
  }

  # UltraFeedResponse now uses the unified UltraFeedItem type
  type UltraFeedResponse {
    cutoff: Date
    endOffset: Int!
    results: [UltraFeedItem!]!
    sessionId: String!
  }
`);

type feedItemRenderAsType = "feedComment" | "feedPost";

// Define source weights for weighted sampling
const SOURCE_WEIGHTS = {
  popularComments: 5,
  quickTakes: 5,
  subscribed: 10
};

// Helper function to perform weighted sampling
function weightedSample(sources: Record<string, { weight: number, items: any[] }>, totalItems: number) {
  const finalFeed = [];
  let totalWeight = Object.values(sources).reduce((sum, src) => 
    sum + (src.items.length > 0 ? src.weight : 0), 0);

  for (let i = 0; i < totalItems; i++) {
    // If no items remain in any source, break
    if (totalWeight <= 0) break;

    // Pick a random float in [0, totalWeight)
    const pick = Math.random() * totalWeight;

    let cumulative = 0;
    let chosenSourceKey = null;
    
    for (const [key, src] of Object.entries(sources)) {
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
      const source = sources[chosenSourceKey];
      const item = source.items.shift();
      
      // Only add the source once if it's not already in the sources array
      const itemSources = item.sources || [];
      if (!itemSources.includes(chosenSourceKey)) {
        itemSources.push(chosenSourceKey);
      }
      
      finalFeed.push({
        ...item,
        sources: itemSources
      });
      
      // If that source is now empty, effectively set its weight to 0
      if (source.items.length === 0) {
        totalWeight -= source.weight;
      }
    }
  }

  return finalFeed;
}

/**
 * 2) Create the feed resolver. We'll call it "UltraFeed" for now, but you can rename
 *    it in defineFeedResolver if you prefer something like "CommentsComboFeed".
 */
defineFeedResolver<Date>({
  name: "UltraFeed",
  cutoffTypeGraphQL: "Date", 
  args: "",
  resultTypesGraphQL: `
    ultraFeedItem: UltraFeedItem
  `,
  /**
   * The resolver function fetches content from multiple sources,
   * samples them based on weights, and returns the merged results.
   */
  resolver: async ({
    limit = 25, // Default to 25 items for initial draw
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

    // Updated interfaces to match our new UltraFeedItem GraphQL type
    interface FeedItemBase {
      _id: string;
      sources: string[];
      renderAsType: feedItemRenderAsType;
    }
    
    interface FeedCommentItem extends FeedItemBase {
      comment: DbComment;
    }

    interface FeedPostItem extends FeedItemBase {
      post: DbPost;
      comments?: DbComment[];
    }

    // Union type for our different feed item types
    type FeedItem = FeedCommentItem | FeedPostItem;

    // Helper to check if an item is a FeedCommentItem
    function isFeedCommentItem(item: FeedItem): item is FeedCommentItem {
      return item.renderAsType === "feedComment";
    }

    // Helper to check if an item is a FeedPostItem
    function isFeedPostItem(item: FeedItem): item is FeedPostItem {
      return item.renderAsType === "feedPost";
    }

    const sources: Record<string, { weight: number, items: FeedItem[] }> = {
      quickTakes: { weight: SOURCE_WEIGHTS.quickTakes, items: [] },
      popularComments: { weight: SOURCE_WEIGHTS.popularComments, items: [] },
      subscribed: { weight: SOURCE_WEIGHTS.subscribed, items: [] }
    };

    try {
      // 1. FETCH QUICK TAKES
      console.log("Fetching quick takes...");
      const quickTakesRaw = await context.Comments.find(
        {
          shortform: true,
          deleted: { $ne: true },
        },
        { limit: 50, sort: { postedAt: -1 } }
      ).fetch();
      
      const quickTakes = await accessFilterMultiple(
        currentUser,
        "Comments",
        quickTakesRaw,
        context
      );

      console.log(`Found ${quickTakes.length} quick takes`);

      // Add quick takes to sources
      sources.quickTakes.items = quickTakes.map((doc: DbComment) => {
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

      // 2. FETCH POPULAR COMMENTS
      console.log("Fetching popular comments...");
      const popularCommentsRaw = await context.Comments.find(
        {
          deleted: { $ne: true },
          baseScore: { $gt: 10 },
          postedAt: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
        },
        { limit: 50, sort: { baseScore: -1 } }
      ).fetch();
      
      const popularComments = await accessFilterMultiple(
        currentUser,
        "Comments",
        popularCommentsRaw,
        context
      );

      console.log(`Found ${popularComments.length} popular comments`);

      // Add popular comments to sources
      sources.popularComments.items = popularComments.map((doc: DbComment) => {
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

      // 3. FETCH SUBSCRIBED CONTENT
      console.log("Fetching subscribed content...");
      // Note: This is simplified and would need to be adjusted based on your actual subscription logic
      const postsAndCommentsAll = await context.repos.posts.getPostsAndCommentsFromSubscriptions(currentUser._id, 50);
      
      console.log(`Found ${postsAndCommentsAll.length} subscribed items`);
      
      if (postsAndCommentsAll && postsAndCommentsAll.length > 0) {
        const postIds = filterNonnull(postsAndCommentsAll.map(row => row.postId));
        const commentIds = filterNonnull(postsAndCommentsAll.flatMap(row => row.fullCommentTreeIds ?? []));
        
        console.log(`Loading ${postIds.length} posts and ${commentIds.length} comments for subscribed content`);
        
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
        
        // Add subscribed content to sources
        sources.subscribed.items = postsAndCommentsAll
          .filter(item => postsById[item.postId]) // Skip items where post is missing
          .map(item => {
            return {
              _id: item.postId,
              post: postsById[item.postId] as DbPost, // Add type assertion
              comments: (item.commentIds?.map(id => commentsById[id]).filter(Boolean) || []) as DbComment[],
              sources: ["subscribed"],
              renderAsType: "feedPost"
            };
          });
          
        console.log(`Added ${sources.subscribed.items.length} subscribed items to sources`);
      }

      // 4. PERFORM WEIGHTED SAMPLING
      console.log("Performing weighted sampling with:", {
        quickTakesCount: sources.quickTakes.items.length,
        popularCommentsCount: sources.popularComments.items.length,
        subscribedCount: sources.subscribed.items.length,
        requestedLimit: limit
      });
      
      const sampledItems: FeedItem[] = weightedSample(sources, limit);
      console.log(`Sampled ${sampledItems.length} items for feed`);
      
      // 5. TRANSFORM RESULTS FOR THE FEED
      const results = sampledItems.map((item) => {
        // Use our type guards to determine the item type
        if (isFeedCommentItem(item)) {
          return {
            type: "ultraFeedItem",
            ultraFeedItem: {
              _id: item._id,
              type: "ultraFeedItem",
              renderAsType: "feedComment",
              sources: item.sources,
              primaryComment: item.comment,
              // Other fields set to null or empty arrays
              primaryPost: null,
              secondaryPosts: [],
              secondaryComments: []
            }
          };
        } else if (isFeedPostItem(item)) {
          return {
            type: "ultraFeedItem",
            ultraFeedItem: {
              _id: item._id,
              type: "ultraFeedItem",
              renderAsType: "feedPost", 
              sources: item.sources,
              primaryPost: item.post,
              secondaryComments: item.comments || [],
              // Other fields set to null or empty arrays
              primaryComment: null,
              secondaryPosts: []
            }
          };
        }
        // Default fallback (shouldn't reach here in normal operation)
        return null;
      }).filter(Boolean);

      // 6. SAVE ITEMS TO FEEDITEMSERVINGS COLLECTION
      console.log("Saving feed items to FeedItemServings collection...");
      
      const now = new Date();
      const feedItemServings = results
        .filter((result): result is NonNullable<typeof result> => result !== null)
        .map((result, index) => {
          // Base document with common properties
          const baseDoc = {
            userId: currentUser._id,
            sessionId,
            servedAt: now,
            position: index,
            renderAsType: result.ultraFeedItem.renderAsType,
            sources: result.ultraFeedItem.sources,
            // Add nullable fields with default values
            primaryDocumentId: null,
            primaryDocumentCollectionName: null,
            secondaryDocumentIds: null,
            secondaryDocumentsCollectionName: null,
            originalServingId: null,
            mostRecentServingId: null,
          } as DbFeedItemServing;

          if (result.ultraFeedItem.renderAsType === "feedComment" && result.ultraFeedItem.primaryComment) {
            return {
              ...baseDoc,
              primaryDocumentId: result.ultraFeedItem.primaryComment._id,
              primaryDocumentCollectionName: "Comments" as CollectionNameString,
            };
          } else if (result.ultraFeedItem.renderAsType === "feedPost" && result.ultraFeedItem.primaryPost) {
            const commentIds = result.ultraFeedItem.secondaryComments?.map((c: DbComment) => c._id) || [];
            return {
              ...baseDoc,
              primaryDocumentId: result.ultraFeedItem.primaryPost._id,
              primaryDocumentCollectionName: "Posts" as CollectionNameString,
              secondaryDocumentIds: commentIds.length > 0 ? commentIds : null,
              secondaryDocumentsCollectionName: commentIds.length > 0 ? "Comments" as CollectionNameString : null,
            };
          }
          return null;
        }).filter((item): item is NonNullable<typeof item> => item !== null);
      
      // Insert all feed item servings
      if (feedItemServings.length > 0) {
        try {
          const bulkWriteOperations = feedItemServings.map(item => ({
            insertOne: { document: item }
          }));
          await context.FeedItemServings.rawCollection().bulkWrite(bulkWriteOperations, { ordered: false });
          console.log(`Successfully saved ${feedItemServings.length} feed item servings`);
        } catch (err) {
          console.error("Error saving feed item servings:", err);
          // Continue execution even if saving fails
        }
      }

      // In a real implementation with pagination, you would use the cutoff to determine
      // where to start the next page. For now, we'll just return a simple response.
      
      // Determine if there are likely more results that could be returned
      // For this implementation, if we got fewer than the requested limit, we'll say there are no more
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
