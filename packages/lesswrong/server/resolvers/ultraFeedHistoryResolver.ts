import { defineFeedResolver } from "../utils/feedUtil";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import { loadByIds } from "../../lib/loaders";
import { filterNonnull } from "../../lib/utils/typeGuardUtils";
import keyBy from "lodash/keyBy";

/**
 * UltraFeedHistory resolver
 * 
 * This resolver loads a user's content history from the FeedItemServings collection
 * and returns it in the same format as UltraFeed.
 */
defineFeedResolver<Date>({
  name: "UltraFeedHistory",
  cutoffTypeGraphQL: "Date", 
  args: "",
  resultTypesGraphQL: `
    ultraFeedItem: UltraFeedItem
  `,
  resolver: async ({
    limit = 10, // Default to 10 items per page
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
    console.log("UltraFeedHistory resolver called with:", {
      limit,
      cutoff: cutoff ? cutoff.toISOString() : null,
      offset,
      hasCurrentUser: !!context.currentUser,
      sessionIdProvided: !!sessionId
    });

    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in to fetch UltraFeedHistory.");
    }

    // Construct query for fetching user's feed history
    const query: any = {
      userId: currentUser._id
    };

    // Add cutoff date if provided
    if (cutoff) {
      query.servedAt = { $lt: cutoff };
    }

    try {
      // Fetch user's feed history - make sure to enforce a reasonable limit
      const actualLimit = Math.min(limit, 50); // Cap the limit at 50 for safety
      
      console.log(`Querying FeedItemServings with limit ${actualLimit}`);
      console.log(`Query:`, JSON.stringify(query));
      
      // Fetch user's feed history
      // Sort by servedAt desc to get newest items first, then by position to preserve the original display order
      const feedServings = await context.FeedItemServings.find(
        query,
        {
          sort: { servedAt: -1, position: 1 },
          limit: actualLimit,
          skip: offset || 0,
        }
      ).fetch();

      console.log(`Found ${feedServings.length} history items for user ${currentUser._id}`);

      if (feedServings.length === 0) {
        // Return empty results if no history items found
        return {
          cutoff: null,
          endOffset: (offset || 0),
          results: [],
          sessionId
        };
      }

      // After we've fetched the current page, check if there are more results
      // by making a separate count query with the same filter but an updated cutoff
      const lastItem = feedServings[feedServings.length - 1];
      const hasMoreResults = lastItem ? await context.FeedItemServings.find({
        userId: currentUser._id,
        servedAt: { $lt: lastItem.servedAt }
      }).count() > 0 : false;

      console.log(`Direct database check for more results: ${hasMoreResults}`);

      // Extract IDs for posts and comments to load
      const postIds = new Set<string>();
      const commentIds = new Set<string>();
      const secondaryCommentIds = new Set<string>();

      // Categorize items by type and collect IDs
      feedServings.forEach(serving => {
        if (serving.primaryDocumentCollectionName === "Posts" && serving.primaryDocumentId) {
          postIds.add(serving.primaryDocumentId);
        } else if (serving.primaryDocumentCollectionName === "Comments" && serving.primaryDocumentId) {
          commentIds.add(serving.primaryDocumentId);
        }

        // Add secondary comment IDs if present
        if (serving.secondaryDocumentsCollectionName === "Comments" && serving.secondaryDocumentIds) {
          serving.secondaryDocumentIds.forEach(id => secondaryCommentIds.add(id));
        }
      });

      // Load posts and comments
      const [posts, comments, secondaryComments] = await Promise.all([
        loadByIds(context, "Posts", Array.from(postIds))
          .then(posts => accessFilterMultiple(currentUser, "Posts", posts, context))
          .then(filterNonnull),
        loadByIds(context, "Comments", Array.from(commentIds))
          .then(comments => accessFilterMultiple(currentUser, "Comments", comments, context))
          .then(filterNonnull),
        loadByIds(context, "Comments", Array.from(secondaryCommentIds))
          .then(comments => accessFilterMultiple(currentUser, "Comments", comments, context))
          .then(filterNonnull)
      ]);

      console.log(`Loaded ${posts.length} posts, ${comments.length} comments, and ${secondaryComments.length} secondary comments`);

      // Create maps for quick lookup
      const postsById = keyBy(posts, p => p._id);
      const commentsById = keyBy(comments, c => c._id);
      const secondaryCommentsById = keyBy(secondaryComments, c => c._id);

      // Transform feed servings into feed items
      const results = feedServings.map(serving => {
        // Determine the type based on primary document
        if (serving.primaryDocumentCollectionName === "Posts" && serving.primaryDocumentId && postsById[serving.primaryDocumentId]) {
          // It's a post
          const post = postsById[serving.primaryDocumentId];
          
          // Get associated comments if any
          const associatedComments = serving.secondaryDocumentIds
            ? serving.secondaryDocumentIds
                .map(id => secondaryCommentsById[id])
                .filter(Boolean)
            : [];

          return {
            type: "ultraFeedItem",
            ultraFeedItem: {
              _id: serving._id,
              type: "ultraFeedItem",
              renderAsType: serving.renderAsType || "feedPost",
              sources: serving.sources || [],
              primaryPost: post,
              secondaryComments: associatedComments,
              primaryComment: null,
              secondaryPosts: []
            }
          };
        } else if (serving.primaryDocumentCollectionName === "Comments" && serving.primaryDocumentId && commentsById[serving.primaryDocumentId]) {
          // It's a comment
          const comment = commentsById[serving.primaryDocumentId];
          
          return {
            type: "ultraFeedItem",
            ultraFeedItem: {
              _id: serving._id,
              type: "ultraFeedItem",
              renderAsType: serving.renderAsType || "feedComment",
              sources: serving.sources || [],
              primaryComment: comment,
              primaryPost: null,
              secondaryPosts: [],
              secondaryComments: []
            }
          };
        }
        
        // If we can't resolve the document, skip it
        return null;
      }).filter(Boolean);

      console.log(`Transformed ${results.length} history items`);

      // Note: We're skipping the logging of history views for now
      // This can be implemented later when we have a better understanding
      // of the collection methods available

      // Determine new cutoff for pagination
      // CRITICAL: If hasMoreResults is true, we must use the last item of the sliced array (feedServings)
      // as the cutoff, NOT the last item of the full array (which contains the extra item)
      const newCutoff = hasMoreResults ? lastItem.servedAt : null;

      console.log(`UltraFeedHistory pagination details:
        - hasMoreResults: ${hasMoreResults}
        - total items found: ${feedServings.length}
        - requested limit: ${limit}
        - items processed: ${feedServings.length}
        - newCutoff date: ${newCutoff ? newCutoff.toISOString() : 'null'}
        - returning cutoff: ${hasMoreResults ? (newCutoff ? newCutoff.toISOString() : 'null') : 'null (signals end of results)'}`);

      return {
        // CRITICAL: We must return a non-null cutoff if hasMoreResults is true
        cutoff: hasMoreResults ? newCutoff : null, // null signals end of results
        endOffset: (offset || 0) + results.length,
        results,
        sessionId
      };
    } catch (error) {
      console.error("Error in UltraFeedHistory resolver:", error);
      throw error;
    }
  }
}); 