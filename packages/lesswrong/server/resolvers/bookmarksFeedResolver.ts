import gql from 'graphql-tag';
import { Bookmarks } from '../collections/bookmarks/collection';
import { loadByIds } from '../../lib/loaders';
import { filterNonnull } from '../../lib/utils/typeGuardUtils';
import { FeedPostMetaInfo, FeedCommentMetaInfo, FeedPostResolverType, FeedCommentsThreadResolverType as UltraFeedCommentsThreadResolverType } from '../../components/ultraFeed/ultraFeedTypes';
import uniq from 'lodash/uniq';
import orderBy from 'lodash/orderBy';

export const bookmarksFeedGraphQLTypeDefs = gql`
  type BookmarksFeedQueryResults {
    cutoff: Date
    endOffset: Int!
    results: [BookmarksFeedEntryType!]
  }
  
  type BookmarksFeedEntryType {
    type: String!          # 'feedPost' or 'feedCommentThread'
    feedPost: FeedPost     
    feedCommentThread: FeedCommentThread 
    sortKey: Date!         
  }
  
  extend type Query {
    BookmarksFeed(
      limit: Int,
      cutoff: Date,
      offset: Int,
    ): BookmarksFeedQueryResults!
  }
`

interface FeedCommentsThreadResolverType extends UltraFeedCommentsThreadResolverType {
  post: Partial<DbPost> | null;
}

type InternalFeedItem = {
  type: 'feedPost' | 'feedCommentThread';
  feedPost: FeedPostResolverType | null;
  feedCommentThread: FeedCommentsThreadResolverType | null;
  sortKey: Date;
};

interface BookmarksFeedQueryResult {
  cutoff: Date | null;
  endOffset: number;
  results: BookmarksFeedEntryType[];
}

export const bookmarksFeedGraphQLQueries = {
  BookmarksFeed: async (_root: void, args: any, context: ResolverContext): Promise<BookmarksFeedQueryResult> => {
    const {limit = 20, cutoff, offset = 0} = args;
    const {currentUser} = context;
    
    if (!currentUser) {
      throw new Error("Must be logged in to view bookmarks feed");
    }

    const selector: MongoSelector<DbBookmark> = {
      userId: currentUser._id,
      active: true,
    };
    if (cutoff) {
      selector.lastUpdated = {$lt: cutoff}; 
    }

    const bookmarks = await Bookmarks.find(selector, {
      sort: {lastUpdated: -1},
      limit: limit + 1, 
      ...(offset && !cutoff ? { skip: offset } : {}) 
    }).fetch();

    const hasMore = bookmarks.length > limit;
    const resultsBookmarks = hasMore ? bookmarks.slice(0, limit) : bookmarks;
    const nextCutoff = hasMore ? (resultsBookmarks[resultsBookmarks.length - 1]?.lastUpdated ?? new Date()) : null;

    const postBookmarkIds: string[] = [];
    const commentBookmarkIds: string[] = [];
    const bookmarkMap = new Map<string, DbBookmark>();

    resultsBookmarks.forEach(bookmark => {
      bookmarkMap.set(bookmark.documentId, bookmark);
      if (bookmark.collectionName === 'Posts') {
        postBookmarkIds.push(bookmark.documentId);
      } else if (bookmark.collectionName === 'Comments') {
        commentBookmarkIds.push(bookmark.documentId);
      }
    });

    const [posts, comments] = await Promise.all([
      loadByIds(context, "Posts", postBookmarkIds),
      loadByIds(context, "Comments", commentBookmarkIds)
    ]);
    
    const commentPostIds = comments.filter((c) => !!c).filter((c) => !!c.postId).map(c => c.postId);
    const validCommentPostIds = commentPostIds.filter((id) => id !== null);
    const commentPosts = validCommentPostIds.length ? await loadByIds(context, "Posts", uniq(validCommentPostIds)) : [];
    const commentPostsById = new Map(commentPosts.filter((p) => p != null).map(p => [p._id, p]));

    const postFeedItems = posts
      .filter((post) => post != null)
      .map((post): InternalFeedItem | null => {
        const bookmark = bookmarkMap.get(post._id);
        if (!bookmark) {
          return null;
        }
        const postMetaInfo: FeedPostMetaInfo = { sources: ["bookmarks"], displayStatus: "expanded" };
        const feedPostData: FeedPostResolverType = { _id: post._id, post: post, postMetaInfo: postMetaInfo };
        return {
          type: "feedPost",
          feedPost: feedPostData,
          feedCommentThread: null,
          sortKey: bookmark.lastUpdated ?? new Date()
        };
      })
      .filter((item): item is InternalFeedItem => item != null);

    const commentFeedItems = comments
      .filter((comment): comment is NonNullable<typeof comment> => comment != null)
      .map((comment): InternalFeedItem | null => {
        const bookmark = bookmarkMap.get(comment._id);
        if (!bookmark || !comment.postId) {
          return null;
        }
        const commentMetaInfos: Record<string, FeedCommentMetaInfo> = {
          [comment._id]: {
            sources: ["bookmarks"],
            displayStatus: "expanded",
            directDescendentCount: 0,
            lastServed: new Date(),
            lastViewed: new Date(),
            lastInteracted: new Date(),
            postedAt: comment.postedAt
          }
        };
        const threadId = `bookmark-comment-${comment._id}`;
        const parentPost = commentPostsById.get(comment.postId) || null;
        const feedCommentThreadData: FeedCommentsThreadResolverType = { _id: threadId, comments: [comment], commentMetaInfos: commentMetaInfos, post: parentPost };
        return {
          type: "feedCommentThread",
          feedPost: null,
          feedCommentThread: feedCommentThreadData,
          sortKey: bookmark.lastUpdated ?? new Date()
        };
      })
      .filter((item): item is InternalFeedItem => item != null);

    const feedItems = [...postFeedItems, ...commentFeedItems];

    const sortedFeedItems = orderBy(feedItems, ['sortKey'], ['desc']);

    return {
      cutoff: nextCutoff, 
      endOffset: offset + sortedFeedItems.length, 
      results: sortedFeedItems,
    }
  }
} 
