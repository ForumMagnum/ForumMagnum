import BookmarksRepo, { UltraFeedBookmark } from '@/server/repos/BookmarksRepo';
import { FeedCommentMetaInfo, FeedItemSourceType, FeedCommentsThread, PreDisplayFeedComment, FeedPostStub } from '@/components/ultraFeed/ultraFeedTypes';

export type PreparedBookmarkItem =
  | { type: "feedPost"; feedPostStub: FeedPostStub }
  | { type: "feedCommentThread"; feedCommentThread: FeedCommentsThread };

function prepareBookmarksForUltraFeed(bookmarks: UltraFeedBookmark[]): PreparedBookmarkItem[] {
  const prepared: PreparedBookmarkItem[] = [];

  bookmarks.forEach(b => {
    if (b.collectionName === 'Posts') {
      prepared.push({
        type: "feedPost",
        feedPostStub: {
          postId: b.documentId,
          postMetaInfo: { sources: ['bookmarks' as FeedItemSourceType], displayStatus: 'expanded' }
        }
      });
    } else if (b.collectionName === 'Comments' && b.postId) {
      const metaInfo: FeedCommentMetaInfo = {
        sources: ['bookmarks'], displayStatus: 'expanded',
        lastServed: null, lastViewed: null, lastInteracted: null, postedAt: null,
        directDescendentCount: b.directChildrenCount ?? 0
      };
      const comment: PreDisplayFeedComment = {
        commentId: b.documentId, postId: b.postId, baseScore: 0, metaInfo,
      };
      prepared.push({
        type: "feedCommentThread",
        feedCommentThread: { comments: [comment] }
      });
    }
  });

  return prepared;
}

export async function getUltraFeedBookmarks(
  context: ResolverContext,
  limit = 10
): Promise<PreparedBookmarkItem[]> {
  const repo = new BookmarksRepo();
  const raw = await repo.getBookmarksForFeed(context, limit);
  return prepareBookmarksForUltraFeed(raw);
}
