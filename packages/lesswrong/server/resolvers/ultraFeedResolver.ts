import { defineFeedResolver } from "../utils/feedUtil";
import { addGraphQLSchema } from "../../lib/vulcan-lib/graphql";
import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";

/**
 * 1) Define a single GraphQL type for our feed items:
 *    Each item references a standard "Comment" plus has a "sources" array.
 */
addGraphQLSchema(`
  type FeedComment {
    _id: String!
    comment: Comment  # References the existing Comment type in your schema
    sources: [String!]!
  }
`);

/**
 * 2) Create the feed resolver. We'll call it "UltraFeed" for now, but you can rename
 *    it in defineFeedResolver if you prefer something like "CommentsComboFeed".
 */
defineFeedResolver<Date>({
  name: "UltraFeed",
  cutoffTypeGraphQL: "Date", 
  // Provide any extra arguments you want, e.g., "af: Boolean" or similar.
  args: "",
  resultTypesGraphQL: `
    feedComment: FeedComment
  `,
  /**
   * The resolver function fetches both quick-take comments and popular comments,
   * merges any duplicates, sorts them, then slices for pagination.
   */
  resolver: async ({
    limit = 20,
    cutoff,
    offset,
    args, // If you had additional arguments, you'd process them here
    context
  }: {
    limit?: number,
    cutoff?: Date|null,
    offset?: number,
    args: any,
    context: ResolverContext
  }) => {
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in to fetch UltraFeed.");
    }

    /**
     * 3) Fetch "Quick Takes". 
     *    This should mimic the logic used by QuickTakesSection.tsx
     *    (for example, shortform + not deleted).
     */
    const quickTakesRaw = await context.Comments.find(
      {
        shortform: true,
        deleted: { $ne: true },
      },
      { limit: 50, sort: { postedAt: -1 } }
    ).fetch();
    // Filter out items user doesn't have permission to read:
    const quickTakes = await accessFilterMultiple(
      currentUser,
      context.Comments,
      quickTakesRaw,
      context
    );

    /**
     * 4) Fetch "Popular Comments".
     *    This should mimic the logic used by EAPopularCommentsSection.tsx
     *    E.g., high baseScore, posted recently, not deleted, etc.
     */
    const popularCommentsRaw = await context.Comments.find(
      {
        deleted: { $ne: true },
        baseScore: { $gt: 10 }, // Example threshold
        postedAt: { $gte: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)) },
      },
      { limit: 50, sort: { baseScore: -1 } }
    ).fetch();
    const popularComments = await accessFilterMultiple(
      currentUser,
      context.Comments,
      popularCommentsRaw,
      context
    );

    /**
     * 5) Transform each set of docs into a feed item with a single 'comment' plus 'sources'.
     */
    const quickTakesItems = quickTakes.map((doc: DbComment) => {
      // Make sure we have no circular references
      const comment = {...doc};
      // These ensure the comment can be safely processed by unflattenComments
      if (comment.parentCommentId === comment._id) {
        comment.parentCommentId = null;
      }
      return {
        _id: doc._id,
        comment,
        sources: ["quickTakes"] as string[],
      };
    });

    const popularCommentItems = popularComments.map((doc: DbComment) => {
      // Make sure we have no circular references
      const comment = {...doc};
      // These ensure the comment can be safely processed by unflattenComments
      if (comment.parentCommentId === comment._id) {
        comment.parentCommentId = null;
      }
      return {
        _id: doc._id,
        comment,
        sources: ["popularComments"] as string[],
      };
    });

    /**
     * 6) Combine and deduplicate by _id, merging sources if the same comment is in both sets.
     */
    const combined = [...quickTakesItems, ...popularCommentItems];
    const groupedById = groupBy(combined, item => item._id);

    const mergedItems = Object.values(groupedById).map((duplicates) => {
      if (duplicates.length === 1) {
        return duplicates[0];
      }

      // If the same comment is in multiple sources, combine them
      const allSources = duplicates.flatMap(item => item.sources);
      const sources = Array.from(new Set(allSources)); // unique sources
      // They all have the same .comment, so just pick the first
      const { comment } = duplicates[0];
      return { _id: comment._id, comment, sources };
    });

    /**
     * 7) Sort the items. For demonstration, we do a simple combination of recency + score.
     *    You can tailor this for something more sophisticated.
     */
    const sortedItems = sortBy(mergedItems, item => {
      const doc = item.comment;
      // Example: compute a "score" based on postedAt recency & baseScore
      if (!doc?.postedAt) return 0;
      //  - More recent => higher
      const hoursOld = (Date.now() - doc.postedAt.valueOf()) / (3600 * 1000);
      const recencyScore = Math.max(0, 100 - hoursOld); 
      //  - Higher karma => higher
      const baseScore = doc.baseScore || 0;
      //  - Multiple sources => small boost
      const sourceBoost = item.sources.length > 1 ? 5 : 0;

      // Return negative so sortBy makes descending order
      return -(recencyScore + baseScore + sourceBoost);
    });

    /**
     * 8) Implement pagination using "offset" and "limit".
     *    If you want something purely cutoff-based, adapt to your needs.
     */
    const startIndex = offset ?? 0;
    const pageSlice = sortedItems.slice(startIndex, startIndex + limit);
    const reachedEnd = pageSlice.length < sortedItems.length - startIndex;

    // If there's more to fetch, define the nextCutoff from the last item in the slice
    let nextCutoff: Date | null = null;
    if (reachedEnd && pageSlice.length > 0) {
      const lastItem = pageSlice[pageSlice.length - 1];
      if (lastItem.comment?.postedAt) {
        nextCutoff = lastItem.comment.postedAt;
      }
    }

    return {
      cutoff: nextCutoff,
      endOffset: startIndex + pageSlice.length,
      results: pageSlice.map(item => ({
        type: "feedComment",
        feedComment: item,
      }))
    };
  }
});
