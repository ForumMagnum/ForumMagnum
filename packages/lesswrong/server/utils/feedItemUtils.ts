// /**
//  * Utility functions for feed items and tracking when they are served to users
//  */
// import keyBy from "lodash/keyBy";
// import { filterNonnull } from "../../lib/utils/typeGuardUtils";
// import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
// import { loadByIds } from "../../lib/loaders";
// import { fetchFragment } from "../fetchFragment";
// import { feedItemRenderTypes, FeedItemRenderType } from "@/components/ultraFeed/ultraFeedTypes";

// /** For feed items, we typically render them as a post or a comment. */

// /**
//  * Validates if a string is a valid FeedItemRenderType
//  */
// export function isValidFeedItemRenderType(type: string): type is FeedItemRenderType {
//   return feedItemRenderTypes.includes(type as FeedItemRenderType);
// }

// /**
//  * Convert a string to a valid FeedItemRenderType or use default
//  */
// export function toFeedItemRenderType(type: string, defaultType: FeedItemRenderType = "feedPost"): FeedItemRenderType {
//   // TODO: do we want this? casting to a default type when invalid??
//   return isValidFeedItemRenderType(type) ? type : defaultType;
// }

// /**
//  * DehydratedFeedItem - DB-oriented representation with only IDs
//  * This is what we store in the FeedItemServings collection
//  */
// export type DehydratedFeedItem = Pick<
//   DbFeedItemServing, 
//   "_id" | 
//   "primaryDocumentId" | 
//   "primaryDocumentCollectionName" | 
//   "secondaryDocumentIds" | 
//   "secondaryDocumentsCollectionName" | 
//   "originalServingId" | 
//   "mostRecentServingId" |
//   "sources"
// > & {
//   renderAsType: FeedItemRenderType;
// };

// /**
//  * HydratedFeedItem - Display-ready representation with actual DbPost/DbComment objects
//  * This is what we return to the client for rendering
//  */
// export interface HydratedFeedItem {
//   _id: string;
//   type: string; // "ultraFeedItem" (needed for GraphQL schema)
//   renderAsType: FeedItemRenderType;
//   sources: string[];
//   primaryDocumentId?: string | null;
//   primaryDocumentCollectionName?: string | null;
//   primaryComment: DbComment | null;
//   primaryPost: DbPost | null;
//   secondaryComments: DbComment[] | null;
//   secondaryPosts: DbPost[] | null;
//   originalServingId: string | null;
//   mostRecentServingId: string | null;
// }

// /**
//  * Given a list of DehydratedFeedItems, this function loads the necessary 
//  * Comments/Posts and returns them as HydratedFeedItems.
//  * 
//  * @param dehydratedItems Items to hydrate with actual Posts and Comments
//  * @param context ResolverContext for DB access
//  * @param currentUser Current user for access checks
//  */
// export async function hydrateFeedItems(
//   dehydratedItems: (DehydratedFeedItem|DbFeedItemServing)[],
//   context: ResolverContext,
//   currentUser: DbUser
// ): Promise<HydratedFeedItem[]> {
//   if (!dehydratedItems.length) return [];

//   // Gather IDs
//   const postIds = new Set<string>();
//   const commentIds = new Set<string>();
//   const secondaryPostIds = new Set<string>();
//   const secondaryCommentIds = new Set<string>();

//   dehydratedItems.forEach(item => {
//     // Primary
//     if (item.primaryDocumentCollectionName === "Posts" && item.primaryDocumentId) {
//       postIds.add(item.primaryDocumentId);
//     }
//     if (item.primaryDocumentCollectionName === "Comments" && item.primaryDocumentId) {
//       commentIds.add(item.primaryDocumentId);
//     }
//     // Secondary
//     if (item.secondaryDocumentsCollectionName === "Posts" && item.secondaryDocumentIds) {
//       item.secondaryDocumentIds.forEach(id => secondaryPostIds.add(id));
//     }
//     if (item.secondaryDocumentsCollectionName === "Comments" && item.secondaryDocumentIds) {
//       item.secondaryDocumentIds.forEach(id => secondaryCommentIds.add(id));
//     }
//   });

//   // Load all relevant documents - using better approaches for comments
//   const [posts, secondaryPosts, secondaryComments] = await Promise.all([
//     loadByIds(context, "Posts", Array.from(postIds))
//       .then(list => accessFilterMultiple(currentUser, "Posts", list, context))
//       .then(filterNonnull),
//     loadByIds(context, "Posts", Array.from(secondaryPostIds))
//       .then(list => accessFilterMultiple(currentUser, "Posts", list, context))
//       .then(filterNonnull),
//     loadByIds(context, "Comments", Array.from(secondaryCommentIds))
//       .then(list => accessFilterMultiple(currentUser, "Comments", list, context))
//       .then(filterNonnull),
//   ]);

//   // Use fetchFragment to load comments with their post information in one efficient query
//   const commentIds_array = Array.from(commentIds);
//   const commentsWithPosts = commentIds_array.length > 0 
//     ? await fetchFragment({
//       collectionName: "Comments",
//       fragmentName: "ShortformComments",
//       currentUser,
//       selector: { _id: { $in: commentIds_array } },
//       context
//     })
//     : [];

//   // Build dictionaries
//   const postsById = keyBy(posts, p => p._id) as Record<string, DbPost>;
//   const commentsById = keyBy(commentsWithPosts, c => c._id) as Record<string, DbComment>;
//   const secondaryPostsById = keyBy(secondaryPosts, p => p._id) as Record<string, DbPost>;
//   const secondaryCommentsById = keyBy(secondaryComments, c => c._id) as Record<string, DbComment>;

//   // Build hydrated feed items
//   const hydratedList = dehydratedItems.map(item => {
//     // Validate and convert renderAsType to our type
//     const validRenderAsType = toFeedItemRenderType(item.renderAsType);

//     const hydrated: HydratedFeedItem = {
//       _id: item._id,
//       type: "ultraFeedItem", // Required for GraphQL schema
//       renderAsType: validRenderAsType,
//       sources: item.sources ?? [],
//       primaryDocumentId: item.primaryDocumentId,
//       primaryDocumentCollectionName: item.primaryDocumentCollectionName,
//       primaryComment: null,
//       primaryPost: null,
//       secondaryComments: [],
//       secondaryPosts: [],
//       originalServingId: item.originalServingId || null,
//       mostRecentServingId: item.mostRecentServingId || null,
//     };

//     // Primary
//     if (validRenderAsType === "feedPost" && item.primaryDocumentCollectionName === "Posts") {
//       const post = item.primaryDocumentId ? postsById[item.primaryDocumentId] : null;
//       hydrated.primaryPost = post || null;
//     } else if (validRenderAsType === "feedCommentThread" && item.primaryDocumentCollectionName === "Comments") {
//       const comment = item.primaryDocumentId ? commentsById[item.primaryDocumentId] : null;
//       hydrated.primaryComment = comment || null;
//     }

//     // Secondary
//     if (item.secondaryDocumentsCollectionName === "Comments" && item.secondaryDocumentIds?.length) {
//       hydrated.secondaryComments = item.secondaryDocumentIds
//         .map(id => secondaryCommentsById[id])
//         .filter((comment): comment is DbComment => !!comment);
//     } else if (item.secondaryDocumentsCollectionName === "Posts" && item.secondaryDocumentIds?.length) {
//       hydrated.secondaryPosts = item.secondaryDocumentIds
//         .map(id => secondaryPostsById[id])
//         .filter((post): post is DbPost => !!post);
//     }

//     return hydrated;
//   });

//   return hydratedList;
// }

// /**
//  * Given a hydrated feed item with real Post/Comment objects, create 
//  * a "dehydrated" version referencing IDs only.
//  * Typically used before inserting to FeedItemServings for logging.
//  */
// export function dehydrateFeedItem(
//   item: HydratedFeedItem
// ): DehydratedFeedItem {
//   const base: DehydratedFeedItem = {
//     _id: item._id,
//     renderAsType: item.renderAsType,
//     sources: item.sources,
//     primaryDocumentId: null,
//     primaryDocumentCollectionName: null,
//     secondaryDocumentIds: null,
//     secondaryDocumentsCollectionName: null,
//     originalServingId: item.originalServingId || null,
//     mostRecentServingId: item.mostRecentServingId || null,
//   };

//   if (item.renderAsType === "feedCommentThread" && item.primaryComment) {
//     base.primaryDocumentId = item.primaryComment._id;
//     base.primaryDocumentCollectionName = "Comments";
//   } else if (item.renderAsType === "feedPost" && item.primaryPost) {
//     base.primaryDocumentId = item.primaryPost._id;
//     base.primaryDocumentCollectionName = "Posts";
//   }

//   if (item.secondaryComments?.length) {
//     base.secondaryDocumentIds = item.secondaryComments.map(c => c._id);
//     base.secondaryDocumentsCollectionName = "Comments";
//   } else if (item.secondaryPosts?.length) {
//     base.secondaryDocumentIds = item.secondaryPosts.map(p => p._id);
//     base.secondaryDocumentsCollectionName = "Posts";
//   }

//   return base;
// }

// /**
//  * Transform a list of hydrated feed items to dehydrated items for storage
//  */
// export function dehydrateHydratedFeedItems(items: HydratedFeedItem[]): DehydratedFeedItem[] {
//   return items.filter(Boolean).map(dehydrateFeedItem);
// }

// /**
//  * Logs when feed items are served to users, tracking both original and recent servings.
//  * This function should be used by both the UltraFeed and UltraFeedHistory resolvers.
//  * 
//  * @param context - ResolverContext containing collections and current user
//  * @param params - Parameters for logging feed item servings
//  */
// export async function logFeedItemServings({
//   context,
//   userId,
//   sessionId,
//   results,
//   isHistoryView = false
// }: {
//   context: ResolverContext,
//   userId: string,
//   sessionId: string | undefined,
//   results: (HydratedFeedItem | null)[], // Allow for null values in the array
//   isHistoryView?: boolean
// }): Promise<void> {
//   if (!results.length || !userId || !sessionId) {
//     return;
//   }

//   try {
//     const now = new Date();

//     // Dehydrate feed items first, then transform them into servings records
//     const feedItemServings = results
//       .filter((result): result is HydratedFeedItem => result !== null)
//       .map((item, index) => {
//         // Dehydrate the item to extract IDs and collection names
//         const dehydrated = dehydrateFeedItem(item);
        
//         // Add serving-specific information
//         const originalServingId = isHistoryView ? dehydrated.originalServingId ?? dehydrated._id : null;
//         const mostRecentServingId = isHistoryView ? dehydrated._id : null;

//         return {
//           userId,
//           sessionId,
//           servedAt: now,
//           position: index,
//           renderAsType: dehydrated.renderAsType,
//           sources: dehydrated.sources,
//           primaryDocumentId: dehydrated.primaryDocumentId,
//           primaryDocumentCollectionName: dehydrated.primaryDocumentCollectionName,
//           secondaryDocumentIds: dehydrated.secondaryDocumentIds,
//           secondaryDocumentsCollectionName: dehydrated.secondaryDocumentsCollectionName,
//           originalServingId,
//           mostRecentServingId
//         } as DbFeedItemServing;
//       })
//       .filter(Boolean);

//     // Insert all feed item servings
//     if (feedItemServings.length > 0) {
//       try {
//         const bulkWriteOperations = feedItemServings.map(item => ({
//           insertOne: { document: item }
//         }));
//         await context.FeedItemServings.rawCollection().bulkWrite(bulkWriteOperations, { ordered: false });
//         console.log(`Successfully saved ${feedItemServings.length} feed item servings`);
//       } catch (err) {
//         console.error("Error saving feed item servings:", err);
//         // Continue execution even if saving fails
//       }
//     }
//   } catch (error) {
//     console.error("Error in logFeedItemServings:", error);
//     // Don't throw the error, as this is a non-critical operation
//   }
// } 