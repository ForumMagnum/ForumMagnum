// import { defineFeedResolver } from "../utils/feedUtil";
// import { accessFilterMultiple } from "../../lib/utils/schemaUtils";
// import { loadByIds } from "../../lib/loaders";
// import { filterNonnull } from "../../lib/utils/typeGuardUtils";
// import keyBy from "lodash/keyBy";
// import { logFeedItemServings, HydratedFeedItem, DehydratedFeedItem, hydrateFeedItems, toFeedItemRenderType } from "../utils/feedItemUtils";
// import FeedItemServingsRepo from "../repos/FeedItemServingsRepo";

// /**
//  * UltraFeedHistory resolver
//  * 
//  * This resolver loads a user's content history from the FeedItemServings collection
//  * and returns it in the same format as UltraFeed.
//  */
// defineFeedResolver<Date>({
//   name: "UltraFeedHistory",
//   cutoffTypeGraphQL: "Date", 
//   args: "",
//   resultTypesGraphQL: `
//     ultraFeedItem: UltraFeedItem
//   `,
//   resolver: async ({
//     limit = 10, // Default to 10 items per page
//     cutoff = null,
//     offset,
//     sessionId,
//     args,
//     context
//   }: {
//     limit?: number,
//     cutoff?: Date|null,
//     offset?: number,
//     sessionId?: string,
//     args: any,
//     context: ResolverContext
//   }) => {
//     console.log("UltraFeedHistory resolver called with:", {
//       limit,
//       cutoff: cutoff ? cutoff.toISOString() : null,
//       offset,
//       hasCurrentUser: !!context.currentUser,
//       sessionIdProvided: !!sessionId
//     });

//     const { currentUser } = context;
//     if (!currentUser) {
//       throw new Error("Must be logged in to fetch UltraFeedHistory.");
//     }
    
//     // Request one more item than needed to check if there are more results
//     const checkLimit = limit + 1;
    
//     // Load deduplicated items from the DB
//     let feedServings: DbFeedItemServing[] = await new FeedItemServingsRepo().loadDedupedFeedItemServingHistoryForUser(
//       currentUser._id, 
//       cutoff,
//       checkLimit
//     );

//     console.log(`Found ${feedServings.length} deduplicated feed items for user history.`);

//     // Check if we got more items than requested, which indicates there are more results
//     const hasMoreResults = feedServings.length > limit;
    
//     // Trim to the requested limit for display
//     if (hasMoreResults) {
//       feedServings = feedServings.slice(0, limit);
//     }

//     // Hydrate the feed items with actual post and comment documents
//     const hydratedItems = await hydrateFeedItems(feedServings, context, currentUser);

//     // Transform to the expected GraphQL response format
//     const results = hydratedItems.map(item => ({
//       type: "ultraFeedItem",
//       ultraFeedItem: item
//     })).filter(Boolean);

//     // Log the viewing of these items from history - fire and forget – we want to get results back ASAP
//     void logFeedItemServings({
//       context,
//       userId: currentUser._id,
//       sessionId,
//       results: results.map(r => r?.ultraFeedItem ?? null), // TODO: better handling of nulls, why would we even have any?
//       isHistoryView: true // Important: This tells the function these are viewed from history
//     });

//     // Use the last item's servedAt date as the next cutoff
//     let newCutoff = null;
//     if (hasMoreResults && feedServings.length > 0) {
//       const lastItem = feedServings[feedServings.length - 1];
//       newCutoff = lastItem.servedAt;
//     }

//     console.log(`UltraFeedHistory pagination details:
//       - hasMoreResults: ${hasMoreResults}
//       - total items found: ${feedServings.length}
//       - requested limit: ${limit}
//       - items processed: ${feedServings.length}
//       - newCutoff: ${newCutoff ? newCutoff.toISOString() : 'null'}
//       - returning cutoff: ${hasMoreResults ? 'non-null cutoff date' : 'null (signals end of results)'}`);

//     return {
//       // CRITICAL: We must return a non-null cutoff if hasMoreResults is true
//       cutoff: newCutoff, // Will be null if no more results
//       endOffset: (offset || 0) + results.length,
//       results,
//       sessionId
//     };
//   }
// }); 
