import UltraFeedRepo from "../../lib/ultraFeed/UltraFeedRepo";
import {
  FeedItemSourceType, UltraFeedResolverType, FeedItemRenderType, FeedItem,
  FeedSpotlight, FeedFullPost, FeedCommentMetaInfo,
  PreDisplayFeedComment,
  FeedCommentsThread,
  FeedCommentsThreadResolverType,
  FeedPostResolverType,
  feedPostSourceTypesArray,
  feedCommentSourceTypesArray,
  feedSpotlightSourceTypesArray
} from "@/components/ultraFeed/ultraFeedTypes";
import { filterNonnull } from "@/lib/utils/typeGuardUtils";
import gql from 'graphql-tag';
import { UltraFeedEvents } from '../collections/ultraFeedEvents/collection';
import { bulkRawInsert } from '../manualMigrations/migrationUtils';

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
const SOURCE_WEIGHTS: Record<FeedItemSourceType, number> = {
  // Post sources
  'recombee-lesswrong-custom': 20,
  'hacker-news': 10,
  'welcome-post': 1, // Low weight, maybe only for new users?
  'curated': 2,
  'stickied': 0,

  // Comment sources
  'quickTakes': 20,
  'topComments': 30,

  // Spotlight sources
  'spotlights': 3,
};

// Re-add WeightedSource interface
interface WeightedSource {
  weight: number;
  items: FeedItem[];
  renderAsType: FeedItemRenderType; // This might need rethinking later
}

type SampledItem = { renderAsType: "feedCommentThread", feedCommentThread: FeedCommentsThread }
                 | { renderAsType: "feedPost", feedPost: FeedFullPost }
                 | { renderAsType: "feedSpotlight", feedSpotlight: FeedSpotlight };

function weightedSample(
  inputs: Record<FeedItemSourceType, WeightedSource>,
  totalItems: number
): SampledItem[] {
  // Create deep copies of the input arrays to avoid modifying the originals
  const sourcesWithCopiedItems = Object.entries(inputs).reduce((acc, [key, value]) => {
    acc[key as FeedItemSourceType] = {
      ...value,
      items: [...value.items] // Create a copy of the items array
    };
    return acc;
  }, {} as Record<FeedItemSourceType, WeightedSource>);

  const finalFeed: SampledItem[] = [];
  let totalWeight = Object.values(sourcesWithCopiedItems).reduce(
    (sum, src) => sum + (src.items.length > 0 ? src.weight : 0),
    0
  );

  for (let i = 0; i < totalItems; i++) {
    if (totalWeight <= 0) break;

    const pick = Math.random() * totalWeight;

    let cumulative = 0;
    let chosenSourceKey: FeedItemSourceType | null = null;

    for (const [key, src] of Object.entries(sourcesWithCopiedItems)) {
      if (src.items.length === 0) continue;

      cumulative += src.weight;
      if (pick < cumulative) {
        chosenSourceKey = key as FeedItemSourceType;
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
    
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Must be logged in to fetch UltraFeed.");
    }

    try {
      const ultraFeedRepo = new UltraFeedRepo();

      const totalWeight = Object.values(SOURCE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);

      if (totalWeight <= 0) {
        // eslint-disable-next-line no-console
        console.warn("UltraFeedResolver: Total source weight is zero. No items can be fetched or sampled. Returning empty results.");
        return {
          __typename: "UltraFeedQueryResults",
          cutoff: null, // No more results possible if weights are zero
          endOffset: offset || 0,
          results: [],
          sessionId
        };
      }

      const bufferMultiplier = 5; // Fetch 3x the expected need as buffer

      // --- Calculate weights per category using imported arrays directly ---
      const totalPostWeight = feedPostSourceTypesArray.reduce((sum, type) => sum + (SOURCE_WEIGHTS[type] || 0), 0);
      const totalCommentWeight = feedCommentSourceTypesArray.reduce((sum, type) => sum + (SOURCE_WEIGHTS[type] || 0), 0);
      const totalSpotlightWeight = feedSpotlightSourceTypesArray.reduce((sum, type) => sum + (SOURCE_WEIGHTS[type] || 0), 0);

      // --- Calculate fetch limits based on summed weights (simplified) ---
      // We know totalWeight > 0 here because of the earlier check.
      const postFetchLimit = Math.ceil(limit * (totalPostWeight / totalWeight) * bufferMultiplier);
      const commentBufferLimit = Math.ceil(limit * (totalCommentWeight / totalWeight) * bufferMultiplier);
      const spotlightFetchLimit = Math.ceil(limit * (totalSpotlightWeight / totalWeight) * bufferMultiplier);


      let servedPostIds = new Set<string>();

      if (currentUser) {
        const servedEvents = await UltraFeedEvents.find({ 
          userId: currentUser._id, 
          eventType: "served",
          collectionName: { $in: ["Posts"] } 
        }, { projection: { documentId: 1, collectionName: 1 } }).fetch();

        servedEvents.forEach(event => {
          if (event.collectionName === "Posts") {
            servedPostIds.add(event.documentId);
          } else {
            // eslint-disable-next-line no-console
            console.warn("UltraFeedResolver: Served event for unconfigured collection:", event.collectionName);
          }
        });
      }

      const [postThreadsItems, commentThreadsItems, spotlightItems] = await Promise.all([
        ultraFeedRepo.getUltraFeedPostThreads(context, postFetchLimit, servedPostIds),
        ultraFeedRepo.getUltraFeedCommentThreads(context, commentBufferLimit),
        ultraFeedRepo.getUltraFeedSpotlights(context, spotlightFetchLimit)
      ]);

      // --- Initialize sources object dynamically ---
      const sources = {} as Record<FeedItemSourceType, WeightedSource>;
      Object.entries(SOURCE_WEIGHTS).forEach(([source, weight]) => {
        const sourceType = source as FeedItemSourceType;
        let renderAsType: FeedItemRenderType;

        if ((feedPostSourceTypesArray as readonly string[]).includes(sourceType)) {
          renderAsType = 'feedPost';
        } else if ((feedCommentSourceTypesArray as readonly string[]).includes(sourceType)) {
          renderAsType = 'feedCommentThread';
        } else if ((feedSpotlightSourceTypesArray as readonly string[]).includes(sourceType)) {
          renderAsType = 'feedSpotlight';
        } else {
          // eslint-disable-next-line no-console
          console.warn(`UltraFeedResolver: Source type "${sourceType}" found in SOURCE_WEIGHTS but not in known type arrays.`);
          // Assign a default or handle as error? For now, skip maybe?
          return; // Skip sources not mappable to a render type
        }

        sources[sourceType] = {
          weight,
          items: [], // Initialize with empty items
          renderAsType
        };
      });

      // --- Populate sources with fetched items ---

      // Populate spotlights (if the source exists)
      if (sources.spotlights) {
        sources.spotlights.items = spotlightItems;
      } else if (spotlightItems.length > 0) {
         // eslint-disable-next-line no-console
         console.warn("UltraFeedResolver: Fetched spotlights but 'spotlights' source is not defined in SOURCE_WEIGHTS.");
      }

      // Populate posts
      postThreadsItems.forEach(postItem => {
        const itemSources = postItem.postMetaInfo?.sources;
        if (Array.isArray(itemSources)) {
          itemSources.forEach(source => {
            const sourceType = source as FeedItemSourceType;
            if (sources[sourceType]) {
              sources[sourceType].items.push(postItem);
            } else {
              // Optional: Log if a post source doesn't match any weighted source
              // console.warn(`Post ${postItem.post?._id} has source "${sourceType}" not in SOURCE_WEIGHTS.`);
            }
          });
        }
      });

      // Populate comment threads
      commentThreadsItems.forEach(commentThread => {
        // Use sources from the first comment in the thread
        const firstCommentMeta = commentThread.comments[0]?.metaInfo;
        const itemSources = firstCommentMeta?.sources;

        if (Array.isArray(itemSources)) {
          itemSources.forEach(source => {
            const sourceType = source as FeedItemSourceType;
            if (sources[sourceType]) {
              // Add the entire thread to the bucket for this source
              sources[sourceType].items.push(commentThread);
            } else {
              // Optional: Log if a comment source doesn't match any weighted source
              console.warn(`Comment thread starting with ${commentThread.comments[0]?.commentId} has source "${sourceType}" not in SOURCE_WEIGHTS.`);
            }
          });
        }
      });

      // --- Filter out sources with no items to prevent issues in weightedSample ---
      const populatedSources = Object.entries(sources).reduce((acc, [key, value]) => {
        if (value.items.length > 0) {
          acc[key as FeedItemSourceType] = value;
        }
        return acc;
      }, {} as Record<FeedItemSourceType, WeightedSource>);


      // const sampledItems = weightedSample(sources, limit);
      const sampledItems = weightedSample(populatedSources, limit); // Use populatedSources
      
      const results: UltraFeedResolverType[] = filterNonnull(await Promise.all(
        sampledItems.map(async (item: SampledItem, index: number):
        Promise<UltraFeedResolverType | null> => {

          if (item.renderAsType === "feedSpotlight") {
            const spotlight = await context.loaders.Spotlights.load(item.feedSpotlight.spotlightId);
            if (!spotlight) return null;
            return {
              type: item.renderAsType,
              feedSpotlight: {
                _id: item.feedSpotlight.spotlightId,
                spotlight
              }
            };
          }

          if (item.renderAsType === "feedCommentThread") {
            const { comments } = item.feedCommentThread;

            let loadedComments: DbComment[] = [];

            if (comments && comments.length > 0) {
              const fetchedComments = await Promise.all(comments.map(comment => context.loaders.Comments.load(comment.commentId)));
              loadedComments = filterNonnull(fetchedComments);
            }
            const commentMetaInfos: {[commentId: string]: FeedCommentMetaInfo} = {};
            if (comments) {
              comments.forEach((comment: PreDisplayFeedComment) => {
                if (comment.commentId && comment.metaInfo) {
                  commentMetaInfos[comment.commentId] = comment.metaInfo;
                }
              });
            }

            const firstCommentId = loadedComments?.[0]?._id;
            const postId = loadedComments?.[0]?.postId;
            const stableThreadId = postId && firstCommentId ? `${postId}:${firstCommentId}` : `feed-comment-thread-${index}`;

            const resultData: FeedCommentsThreadResolverType = {
              _id: stableThreadId,
              comments: loadedComments,
              commentMetaInfos
            };

            return {
              type: item.renderAsType,
              feedCommentThread: resultData
            };
          }

          if (item.renderAsType === "feedPost") {
            const { post, postMetaInfo } = item.feedPost;

            if (!post) { 
              // eslint-disable-next-line no-console
              console.warn("Resolver: No post for feedPost"); return null; 
            }
            const stablePostId = post?._id ? post._id : `feed-post-${index}`;

            const resultData: FeedPostResolverType = {
              _id: stablePostId,
              post,
              postMetaInfo
            };

            return {
              type: item.renderAsType,
              feedPost: resultData
            };
          }

          // eslint-disable-next-line no-console
          console.error("Unknown item renderAsType:", item);
          return null;
        })
      ));
      
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
              if (postId) {
                eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Posts", documentId: postId });
              }
              comments?.forEach((comment: DbComment) => {
                if (comment?._id) {
                   eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Comments", documentId: comment._id });
                }
              });
          } else if (item.type === "feedPost" && item.feedPost?.post?._id) {
            const feedItem = item.feedPost;
            eventsToCreate.push({ userId: currentUser._id, eventType: "served", collectionName: "Posts", documentId: feedItem.post._id });
          }
        });

        // Filter out any partial events that might be missing required fields for DbUltraFeedEvent
        const validEventsToCreate = eventsToCreate.filter(
          (event): event is DbUltraFeedEvent =>
            typeof event.userId === 'string' &&
            typeof event.eventType === 'string' && // Keep basic checks
            typeof event.collectionName === 'string' &&
            typeof event.documentId === 'string' // Ensure documentId is a string
        );

        if (validEventsToCreate.length > 0) {
          try {
            // Pass the filtered array of valid events
            await bulkRawInsert(UltraFeedEvents.options.collectionName, validEventsToCreate);
          } catch (error) {
            // eslint-disable-next-line no-console
             console.error("Error during bulk insertion of UltraFeedEvents:", error);
          }
        }
      }

      const response = {
        __typename: "UltraFeedQueryResults",
        cutoff: new Date(),
        hasMoreResults: true,
        endOffset: (offset || 0) + results.length,
        results,
        sessionId
      };

      return response;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error in UltraFeed resolver:", error);
      throw error;
    }
  }
};
