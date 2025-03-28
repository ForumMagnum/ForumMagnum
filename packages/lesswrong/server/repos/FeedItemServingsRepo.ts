// import AbstractRepo from "./AbstractRepo";
// import { FeedItemServings } from "../collections/feedItemServings/collection";
// export default class FeedItemServingsRepo extends AbstractRepo<"FeedItemServings"> {
//   constructor() {
//     super(FeedItemServings); 
//   }

//   /**
//    * Loads the user's feed history, returning at most one entry per unique feed item,
//    * grouped by coalescing originalServingId and _id. Then returns only the most recent instance.
//    * 
//    * @param userId The user whose history we want to load
//    * @param cutoff Optional date; if provided, only returns rows servedAt < cutoff
//    * @param limit How many items to return
//    */
//   async loadDedupedFeedItemServingHistoryForUser(
//     userId: string,
//     cutoff: Date | null,
//     limit: number
//   ): Promise<DbFeedItemServing[]> {
//     // Build the cutoff condition dynamically
//     const cutoffClause = cutoff ? `AND s."servedAt" < $(cutoff)` : "";

//     return this.getRawDb().any<DbFeedItemServing>(`
//       -- FeedItemServingsRepo.loadDedupedFeedItemServingHistoryForUser
//       WITH base AS (
//         SELECT
//           s.*,
//           COALESCE(s."originalServingId", s."_id") AS "servingKey"
//         FROM "FeedItemServings" s
//         WHERE s."userId" = $(userId)
//         ${cutoffClause}
//       ),
//       deduped AS (
//         -- For each unique servingKey, select the most recent entry by servedAt
//         SELECT DISTINCT ON ("servingKey") *
//         FROM base
//         -- servingKey must be first for DISTINCT ON, but we prioritize newest items
//         ORDER BY "servingKey", "servedAt" DESC
//       )
//       -- Then sort the final results by most recent first
//       SELECT * FROM deduped
//       ORDER BY "servedAt" DESC, "position"
//       LIMIT $(limit);
//     `, {
//       userId,
//       cutoff,
//       limit,
//     });
//   }

//   async loadRecentlyServedItemsForUser(userId: string): Promise<{
//     servedCommentIds: Set<string>;
//     servedPostIds: Set<string>;
//     servedPostCommentCombos: Set<string>;
//     count: number;
//   }> {
//     // Look back at most 1 month
//     const oneMonthAgo = new Date();
//     oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

//     try {
//       // 1. Count how many items the user has from the last month
//       const monthlyCountRow = await this.getRawDb().one<{ count: string }>(`
//         SELECT COUNT(*) AS "count"
//         FROM "FeedItemServings" s
//         WHERE s."userId" = $(userId)
//           AND s."servedAt" >= $(oneMonthAgo)
//       `, {
//         userId,
//         oneMonthAgo
//       });
//       const monthlyItemCount = parseInt(monthlyCountRow.count, 10) || 0;

//       // 2. Set the limit to the maximum of 1000 or monthlyItemCount
//       const limit = Math.max(1000, monthlyItemCount);

//       // 3. Fetch that many items, sorted by servedAt descending
//       const recentItems = await this.getRawDb().any<DbFeedItemServing>(`
//         SELECT
//           s."primaryDocumentId",
//           s."primaryDocumentCollectionName",
//           s."secondaryDocumentIds",
//           s."secondaryDocumentsCollectionName",
//           s."renderAsType"
//         FROM "FeedItemServings" s
//         WHERE s."userId" = $(userId)
//         ORDER BY s."servedAt" DESC
//         LIMIT $(limit)
//       `, {
//         userId,
//         limit
//       });

//       // 4. Build the sets for served comments, posts, and post+comment combos
//       const servedCommentIds = new Set<string>();
//       const servedPostIds = new Set<string>();
//       const servedPostCommentCombos = new Set<string>();

//       for (const item of recentItems) {
//         if (item.primaryDocumentCollectionName === 'Comments' && item.primaryDocumentId) {
//           servedCommentIds.add(item.primaryDocumentId);
//         } else if (item.primaryDocumentCollectionName === 'Posts' && item.primaryDocumentId) {
//           servedPostIds.add(item.primaryDocumentId);

//           // If this is a post with associated comments, create a post+comment combo key
//           if (item.secondaryDocumentIds?.length && item.secondaryDocumentsCollectionName === 'Comments') {
//             const firstComments = item.secondaryDocumentIds.slice(0, 2);
//             const comboKey = `${item.primaryDocumentId}:${firstComments.sort().join(':')}`;
//             servedPostCommentCombos.add(comboKey);
//           }
//         }
//       }

//       return {
//         servedCommentIds,
//         servedPostIds,
//         servedPostCommentCombos,
//         count: recentItems.length
//       };
//     } catch (error) {
//       console.error("Error loading recently served items:", error);
//       // Return empty sets if we encounter an error
//       return {
//         servedCommentIds: new Set<string>(),
//         servedPostIds: new Set<string>(),
//         servedPostCommentCombos: new Set<string>(),
//         count: 0
//       };
//     }
//   }

//   /**
//    * Loads recently served documents for a user, grouping by:
//    *   - primaryDocumentCollectionName
//    *   - primaryDocumentId
//    *   - (if it's a post) the first two secondaryDocumentIds
//    * Returns the most recent row for each group.
//    *
//    * @param userId The user whose served docs we want
//    * @param daysBack How many days to look back, default 30
//    * @param limit How many rows to return, default 1000
//    */
//   async loadRecentlyServedDocumentsForUser(
//     userId: string,
//     daysBack = 30,
//     limit = 1000
//   ): Promise<Array<{
//     collectionName: string;
//     documentId: string;
//     firstTwoCommentIds: string[];
//     servedAt: Date;
//   }>> {
//     // Calculate a date offset (daysBack days ago)
//     const lookbackDate = new Date();
//     lookbackDate.setDate(lookbackDate.getDate() - daysBack);

//     return this.getRawDb().any<{
//       collectionName: string;
//       documentId: string;
//       firstTwoCommentIds: string[];
//       servedAt: Date;
//     }>(`
//       WITH base AS (
//         SELECT
//           s."primaryDocumentCollectionName" AS "collectionName",
//           s."primaryDocumentId" AS "documentId",
//           -- If it's a post, extract up to the first two comment IDs. Otherwise return empty array.
//           CASE
//             WHEN s."primaryDocumentCollectionName" = 'Posts'
//             THEN (s."secondaryDocumentIds")[1:2]
//             ELSE ARRAY[]::text[]
//           END AS "firstTwoCommentIds",
//           s."servedAt"
//         FROM "FeedItemServings" s
//         WHERE s."userId" = $(userId)
//           AND s."servedAt" >= $(lookback)
//       ),
//       deduped AS (
//         -- For each grouping, select the most recent by servedAt
//         SELECT DISTINCT ON ("collectionName", "documentId", "firstTwoCommentIds") *
//         FROM base
//         -- Must match DISTINCT ON columns in ORDER BY, plus servedAt DESC to get the newest row
//         ORDER BY "collectionName", "documentId", "firstTwoCommentIds", "servedAt" DESC
//       )
//       SELECT * FROM deduped
//       ORDER BY "servedAt" DESC
//       LIMIT $(limit);
//     `, {
//       userId,
//       lookback: lookbackDate,
//       limit
//     });
//   }
// } 