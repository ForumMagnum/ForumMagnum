import { UltraFeedBookmark } from '@/server/repos/BookmarksRepo';
import { FeedCommentMetaInfo, FeedItemSourceType, FeedCommentsThread, PreDisplayFeedComment, FeedPostStub } from '@/components/ultraFeed/ultraFeedTypes';

export type PreparedBookmarkItem =
  | { type: "feedPost"; feedPostStub: FeedPostStub }
  | { type: "feedCommentThread"; feedCommentThread: FeedCommentsThread };

function prepareBookmarksForUltraFeed(bookmarks: UltraFeedBookmark[]): PreparedBookmarkItem[] {
  return bookmarks
    .map((b): PreparedBookmarkItem | null => {
      if (b.collectionName === 'Posts') {
        return {
          type: "feedPost",
          feedPostStub: {
            postId: b.documentId,
            postMetaInfo: { 
              sources: ['bookmarks'] as const, 
              displayStatus: 'expanded',
            }
          }
        };
      } else if (b.collectionName === 'Comments' && b.postId) {
        const metaInfo: FeedCommentMetaInfo = {
          sources: ['bookmarks'] as const,
          displayStatus: 'expanded' as const,
          lastServed: null,
          lastViewed: null,
          lastInteracted: null,
          postedAt: null,
          directDescendentCount: b.directChildrenCount ?? 0,
        };
        const comment: PreDisplayFeedComment = {
          commentId: b.documentId, postId: b.postId, baseScore: 0, metaInfo,
        };
        return {
          type: "feedCommentThread",
          feedCommentThread: { comments: [comment] }
        };
      }
      return null;
    })
    .filter((item) => !!item);
}

export async function getUltraFeedBookmarks(
  context: ResolverContext,
  limit = 10
): Promise<PreparedBookmarkItem[]> {
  const userId = context.currentUser?._id;
  if (!userId) {
    return [];
  }

  const raw = await context.repos.bookmarks.getBookmarksForFeed(userId, limit);
  return prepareBookmarksForUltraFeed(raw);
}
