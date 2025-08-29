import gql from 'graphql-tag';
import { filterNonnull } from '@/lib/utils/typeGuardUtils';
import { randomId } from '@/lib/random';
import { FeedItemSourceType, FeedCommentMetaInfo, FeedItemDisplayStatus, UltraFeedResolverType } from '@/components/ultraFeed/ultraFeedTypes';
import { loadMultipleEntitiesById, createUltraFeedResponse } from './ultraFeedResolverHelpers';

export const ultraFeedHistoryGraphQLTypeDefs = gql`
  extend type Query {
    UltraFeedHistory(
      limit: Int,
      cutoff: Date,
      offset: Int
    ): UltraFeedQueryResults!
  }
`;

export const ultraFeedHistoryGraphQLQueries = {
  UltraFeedHistory: async (_root: void, args: { limit?: number; cutoff?: Date | null; offset?: number; }, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error('Must be logged in to fetch UltraFeedHistory.');
    }

    const limit = args.limit ?? 20;
    const offset = args.offset ?? 0;

    const eventsRepo = context.repos.ultraFeedEvents;
    
    // On first page, we need to find where to start
    let actualOffset = offset;
    if (offset === 0) {
      // Fetch enough items to find the first viewed one
      const initialFetch = await eventsRepo.getServedHistoryItems({
        userId: currentUser._id,
        cutoff: null,
        offset: 0,
        limit: 50,
      });
      
      const firstViewedIndex = initialFetch.findIndex(item => item.itemWasViewed === true);
      actualOffset = firstViewedIndex > 0 ? firstViewedIndex : offset;
    }
    
    // Now fetch the actual page with the correct offset
    const fetchedItems = await eventsRepo.getServedHistoryItems({
      userId: currentUser._id,
      cutoff: null,
      offset: actualOffset,
      limit,
    });
    
    const servedItems = fetchedItems;
    
    // Collect IDs to load
    const postIds: string[] = [];
    const spotlightIds: string[] = [];
    const commentIdsSet = new Set<string>();

    servedItems.forEach(item => {
      if (item.type === 'feedPost') {
        postIds.push(item.documentId);
      } else if (item.type === 'feedSpotlight') {
        spotlightIds.push(item.documentId);
      } else if (item.type === 'feedCommentThread') {
        if (item.comments) {
          item.comments.forEach(c => { if (c.commentId) commentIdsSet.add(c.commentId); });
        }
        if (!item.isOnReadPost && item.postId) {
          postIds.push(item.postId);
        }
      }
    });

    const { postsById, commentsById, spotlightsById } = await loadMultipleEntitiesById(context, {
      posts: postIds,
      comments: Array.from(commentIdsSet),
      spotlights: spotlightIds
    });

    const results: UltraFeedResolverType[] = filterNonnull(servedItems.map((item, index) => {
      if (item.type === 'feedSpotlight') {
        const spotlight = spotlightsById.get(item.documentId);
        if (!spotlight) return null;
        const post = spotlight.documentType === 'Post' ? postsById.get(spotlight.documentId) : undefined;
        return {
          type: 'feedSpotlight',
          feedSpotlight: {
            // Ensure unique ID per serve instance to avoid key collisions when a spotlight appears multiple times
            _id: `${item.documentId}-${item.servedAt.getTime()}-${item.sessionId ?? 'nosession'}-${item.itemIndex ?? index}`,
            spotlight,
            ...(post && { post }),
            spotlightMetaInfo: {
              servedEventId: randomId(),
              sources: (item.sources ?? ['spotlights']) as FeedItemSourceType[],
            },
          },
        };
      }

      if (item.type === 'feedPost') {
        const post = postsById.get(item.documentId);
        if (!post) return null;
        return {
          type: 'feedPost',
          feedPost: {
            // Generate unique ID for each serve instance to avoid React key conflicts
            _id: `${post._id}-${item.servedAt.getTime()}-${item.sessionId ?? 'nosession'}-${item.itemIndex ?? index}`,
            post,
            postMetaInfo: {
              servedEventId: randomId(),
              sources: (item.sources ?? []) as FeedItemSourceType[],
              displayStatus: 'expanded',
              highlight: false,
              lastViewed: item.isRead ? item.servedAt : null,
            },
          },
        };
      }

      if (item.type === 'feedCommentThread' && item.comments) {
        const loadedComments: DbComment[] = filterNonnull(
          item.comments.map(c => commentsById.get(c.commentId))
        );
        if (loadedComments.length === 0) return null;

        const commentMetaInfos: { [commentId: string]: FeedCommentMetaInfo } = {};
        item.comments.forEach(c => {
          const cid = c.commentId;
          commentMetaInfos[cid] = {
            sources: (item.sources ?? []) as FeedItemSourceType[],
            displayStatus: (c.displayStatus as FeedItemDisplayStatus) ?? 'collapsed',
            lastServed: item.servedAt,
            lastViewed: c.isRead ? item.servedAt : null,
            lastInteracted: null,
            postedAt: loadedComments.find(lc => lc._id === cid)?.postedAt ?? new Date(),
            descendentCount: loadedComments.find(lc => lc._id === cid)?.descendentCount ?? 0,
            directDescendentCount: loadedComments.find(lc => lc._id === cid)?.directChildrenCount ?? 0,
          };
        });

        const post = item.isOnReadPost ? undefined : (item.postId ? postsById.get(item.postId) : undefined);
        const threadId = `history-thread-${item.servedAt.getTime()}-${index}-${item.sessionId ?? 'no-session'}-${item.itemIndex ?? 0}`;

        return {
          type: 'feedCommentThread',
          feedCommentThread: {
            _id: `threadId-${item.servedAt.getTime()}-${index}-${item.sessionId ?? 'no-session'}-${item.itemIndex ?? 0}`,
            comments: loadedComments,
            commentMetaInfos,
            isOnReadPost: !!item.isOnReadPost,
            postSources: undefined,
            post,
          },
        };
      }

      return null;
    }));

    return createUltraFeedResponse(results, offset ?? 0, null, null);
  },
};


