import UltraFeedRepo from "../../lib/ultraFeed/UltraFeedRepo";
import {
  FeedItemSourceType, UltraFeedResolverType, FeedItemRenderType, FeedItem,
  FeedSpotlight, FeedFullPost, FeedCommentMetaInfo,
  PreDisplayFeedComment,
  FeedCommentsThread,
  FeedCommentsThreadResolverType,
  FeedPostResolverType
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
const SOURCE_WEIGHTS = {
  postThreads: 20,
  commentThreads: 40,
  spotlights: 1,
};

type UsedFeedItemSourceType = Extract<FeedItemSourceType, "postThreads" | "commentThreads" | "spotlights">;
interface WeightedSource {
  weight: number;
  items: FeedItem[];
  renderAsType: FeedItemRenderType;
}

type SampledItem = { renderAsType: "feedCommentThread", feedCommentThread: FeedCommentsThread }
                 | { renderAsType: "feedPost", feedPost: FeedFullPost }
                 | { renderAsType: "feedSpotlight", feedSpotlight: FeedSpotlight };

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
    if (totalWeight <= 0) break;

    const pick = Math.random() * totalWeight;

    let cumulative = 0;
    let chosenSourceKey: UsedFeedItemSourceType | null = null;

    for (const [key, src] of Object.entries(sourcesWithCopiedItems)) {
      if (src.items.length === 0) continue;

      cumulative += src.weight;
      if (pick < cumulative) {
        chosenSourceKey = key as UsedFeedItemSourceType;
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
      const bufferMultiplier = 2; // Fetch 2x the expected need as buffer

      const postFetchLimit = Math.ceil(limit * (SOURCE_WEIGHTS.postThreads / totalWeight) * bufferMultiplier);
      const commentBufferLimit = Math.ceil(limit * (SOURCE_WEIGHTS.commentThreads / totalWeight) * bufferMultiplier);
      const spotlightFetchLimit = Math.ceil(limit * (SOURCE_WEIGHTS.spotlights / totalWeight) * bufferMultiplier);


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

      const sources: Record<UsedFeedItemSourceType, WeightedSource> = {
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

      const sampledItems = weightedSample(sources, limit);
      
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
