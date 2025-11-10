import {
  FeedFullPost,
  FeedCommentsThread,
  FeedSpotlight,
  FeedItemSourceType,
  ThreadEngagementStats,
  RankedItemMetadata,
} from '@/components/ultraFeed/ultraFeedTypes';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { toPostRankable, toThreadRankable } from './ultraFeedRanking';
import { generateThreadHash } from './ultraFeedThreadHelpers';
import type {
  RankableItem,
  MappablePreparedThread,
} from './ultraFeedRankingTypes';
import type { PreparedBookmarkItem } from './ultraFeedBookmarkHelpers';

/**
 * Convert all fetched items (posts, threads, spotlights, bookmarks) into rankable format
 */
export const convertFetchedItemsToRankable = (
  posts: FeedFullPost[],
  threads: FeedCommentsThread[],
  spotlights: FeedSpotlight[],
  bookmarks: PreparedBookmarkItem[],
  engagementStatsMap: Map<string, ThreadEngagementStats>,
  now: Date
): RankableItem[] => {
  // Convert posts to rankable items
  const rankablePosts = posts.map(post => toPostRankable(post, now));
  
  // Convert threads to rankable items with engagement stats
  const rankableThreads = threads.map(thread => {
    const threadCommentIds = thread.comments?.map(c => c.commentId) ?? [];
    const topLevelId = threadCommentIds.length > 0 
      ? (thread.comments?.[0]?.topLevelCommentId ?? threadCommentIds[0])
      : undefined;
    const engagement = topLevelId ? engagementStatsMap.get(topLevelId) : undefined;
    return toThreadRankable(thread as MappablePreparedThread, engagement, now);
  });
  
  // Convert spotlights to minimal rankable items
  const rankableSpotlights: RankableItem[] = spotlights.map(s => ({
    id: s.spotlightId,
    itemType: 'post' as const,
    postId: s.spotlightId,
    sources: ['spotlights' as FeedItemSourceType],
    ageHrs: null,
    isRead: false,
    userSubscribedToAuthor: false,
    karma: 0,
  }));
  
  // Convert bookmarks to rankable items (can be either posts or threads)
  const rankableBookmarks: RankableItem[] = bookmarks.map(b => {
    if (b.type === 'feedPost') {
      return {
        id: b.feedPostStub.postId,
        itemType: 'post' as const,
        postId: b.feedPostStub.postId,
        sources: ['bookmarks' as FeedItemSourceType],
        ageHrs: null,
        isRead: false,
        userSubscribedToAuthor: false,
        karma: 0,
      };
    } else {
      const threadCommentIds = b.feedCommentThread.comments?.map(c => c.commentId) ?? [];
      return {
        id: generateThreadHash(threadCommentIds),
        itemType: 'commentThread' as const,
        threadId: generateThreadHash(threadCommentIds),
        sources: ['bookmarks' as FeedItemSourceType],
        ageHrs: 0,
        isRead: false,
        userSubscribedToAuthor: false,
        stats: {
          commentCount: threadCommentIds.length,
          unviewedCount: 0,
          lastActivityAgeHrs: 0,
          hasShortform: false,
        },
        comments: [],
      };
    }
  });

  return [
    ...rankablePosts,
    ...rankableThreads,
    ...rankableSpotlights,
    ...rankableBookmarks,
  ];
};

/**
 * Helper to attach ranking metadata to a post
 */
const attachMetadataToPost = (
  post: FeedFullPost,
  metadata?: RankedItemMetadata
): FeedFullPost => ({
  ...post,
  postMetaInfo: {
    ...post.postMetaInfo,
    rankingMetadata: metadata,
  },
});

/**
 * Helper to attach ranking metadata to a thread
 */
const attachMetadataToThread = (
  thread: FeedCommentsThread,
  metadata?: RankedItemMetadata
): FeedCommentsThread => ({
  ...thread,
  rankingMetadata: metadata,
});

/**
 * Helper to attach ranking metadata to a spotlight
 */
const attachMetadataToSpotlight = (
  spotlight: FeedSpotlight,
  metadata?: RankedItemMetadata
): FeedSpotlight => ({
  ...spotlight,
  rankingMetadata: metadata,
});

/**
 * Helper to attach ranking metadata to a bookmark
 */
const attachMetadataToBookmark = (
  bookmark: PreparedBookmarkItem,
  metadata?: RankedItemMetadata
): PreparedBookmarkItem => {
  if (bookmark.type === 'feedPost') {
    return {
      ...bookmark,
      feedPostStub: {
        ...bookmark.feedPostStub,
        postMetaInfo: {
          ...bookmark.feedPostStub.postMetaInfo,
          rankingMetadata: metadata,
        },
      },
    };
  } else {
    return {
      ...bookmark,
      feedCommentThread: {
        ...bookmark.feedCommentThread,
        rankingMetadata: metadata,
      },
    };
  }
};

type SampledItem =
  | { type: "feedCommentThread"; feedCommentThread: FeedCommentsThread }
  | { type: "feedPostWithContents"; feedPost: FeedFullPost }
  | { type: "feedPost"; feedPostStub: { postId: string; postMetaInfo: any } }
  | { type: "feedSpotlight"; feedSpotlight: FeedSpotlight }
  | { type: "feedSubscriptionSuggestions"; feedSubscriptionSuggestions: { suggestedUserIds: string[] } };

/**
 * Map ranked IDs back to original sampled items with metadata attached
 */
export const mapRankedIdsToSampledItems = (
  rankedItemsWithMetadata: Array<{ id: string; metadata?: RankedItemMetadata }>,
  originalPosts: FeedFullPost[],
  originalThreads: FeedCommentsThread[],
  originalSpotlights: FeedSpotlight[],
  originalBookmarks: PreparedBookmarkItem[]
): SampledItem[] => {
  // Create a map to store metadata by ID
  const metadataById = new Map(
    rankedItemsWithMetadata.map(({ id, metadata }) => [id, metadata])
  );
  
  // Extract just the IDs for mapping
  const rankedIds = rankedItemsWithMetadata.map(({ id }) => id);
  
  // Create maps to look up original items by their rankable ID
  const postIdToOriginal = new Map<string, FeedFullPost>();
  originalPosts.forEach(post => {
    if (post.post?._id) {
      postIdToOriginal.set(post.post._id, post);
    }
  });
  
  const threadIdToOriginal = new Map<string, FeedCommentsThread>();
  originalThreads.forEach(thread => {
    const threadCommentIds = thread.comments?.map(c => c.commentId) ?? [];
    if (threadCommentIds.length > 0) {
      const threadHash = generateThreadHash(threadCommentIds);
      threadIdToOriginal.set(threadHash, thread);
    }
  });
  
  const spotlightIdToOriginal = new Map<string, FeedSpotlight>();
  originalSpotlights.forEach(s => {
    spotlightIdToOriginal.set(s.spotlightId, s);
  });
  
  const bookmarkIdToOriginal = new Map<string, PreparedBookmarkItem>();
  originalBookmarks.forEach(b => {
    if (b.type === 'feedPost') {
      bookmarkIdToOriginal.set(b.feedPostStub.postId, b);
    } else {
      const threadCommentIds = b.feedCommentThread.comments?.map(c => c.commentId) ?? [];
      const threadHash = generateThreadHash(threadCommentIds);
      bookmarkIdToOriginal.set(threadHash, b);
    }
  });
  
  // Build sampled items in ranked order, attaching metadata
  return filterNonnull(rankedIds.map(id => {
    const metadata = metadataById.get(id);
    
    // Try to find in each map
    const post = postIdToOriginal.get(id);
    if (post) {
      return {
        type: "feedPostWithContents" as const,
        feedPost: attachMetadataToPost(post, metadata),
      };
    }
    
    const thread = threadIdToOriginal.get(id);
    if (thread) {
      return {
        type: "feedCommentThread" as const,
        feedCommentThread: attachMetadataToThread(thread, metadata),
      };
    }
    
    const spotlight = spotlightIdToOriginal.get(id);
    if (spotlight) {
      return {
        type: "feedSpotlight" as const,
        feedSpotlight: attachMetadataToSpotlight(spotlight, metadata),
      };
    }
    
    const bookmark = bookmarkIdToOriginal.get(id);
    if (bookmark) {
      return attachMetadataToBookmark(bookmark, metadata) as SampledItem;
    }
    
    return null;
  }));
};

