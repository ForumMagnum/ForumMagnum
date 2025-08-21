import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import Loading from '../vulcan-core/Loading';
import UltraFeedPostItem from '../ultraFeed/UltraFeedPostItem';
import UltraFeedThreadItem from "../ultraFeed/UltraFeedThreadItem";
import { UltraFeedSettingsType, DEFAULT_SETTINGS } from '../ultraFeed/ultraFeedSettingsTypes';
import { FeedPostMetaInfo, FeedCommentMetaInfo, FeedItemDisplayStatus, DisplayFeedCommentThread } from '../ultraFeed/ultraFeedTypes';
import classNames from 'classnames';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';

const USER_POSTS_QUERY = gql(`
  query UserContentFeedPosts($userId: String!, $limit: Int!, $offset: Int, $sortedBy: String!) {
    posts(selector: { userPosts: { userId: $userId, sortedBy: $sortedBy } }, limit: $limit, offset: $offset, enableTotal: true) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const USER_COMMENTS_QUERY = gql(`
  query UserContentFeedComments($userId: String!, $limit: Int!, $offset: Int, $sortBy: String!) {
    comments(selector: { profileComments: { userId: $userId, sortBy: $sortBy } }, limit: $limit, offset: $offset, enableTotal: true) {
      results {
        ...CommentsList
        post {
          ...PostsListWithVotes
        }
        topLevelComment {
          ...CommentsListWithTopLevelComment
        }
      }
      totalCount
    }
  }
`);

const THREAD_BY_TOPLEVEL_QUERY = gql(`
  query UserContentFeedThread($topLevelCommentId: String!, $limit: Int) {
    comments(selector: { repliesToCommentThreadIncludingRoot: { topLevelCommentId: $topLevelCommentId } }, limit: $limit) {
      results {
        ...UltraFeedComment
      }
    }
  }
`);

const styles = defineStyles("UserContentFeed", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  sortToggle: {
    display: 'flex',
    width: '100%',
    marginBottom: 8,

  },
  sortButton: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 600,
    padding: '12px 0',
    width: '50%',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.2s',
    backgroundColor: theme.palette.panelBackground.bannerAdTranslucentHeavy,
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
  },
  sortButtonInactive: {
    color: theme.palette.grey[500],
  },
  sortButtonActive: {
    color: theme.palette.text.primary,
  },
  tabLabel: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -12, // Adjust to position at bottom of parent button padding
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.palette.primary.main,
    borderRadius: '3px 3px 0 0',
  },
  feedContent: {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: 8,
    marginRight: 8,
    gap: 8,
  },
  loading: {
    padding: 40,
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

export function UltraFeedPrefetchedThreadItem({ comment, index, feedSettings }: { 
  comment: CommentItem; 
  index: number; 
  feedSettings: UltraFeedSettingsType; 
}) {
  const topLevelId = comment.topLevelCommentId ?? comment._id;
  const { data: threadData } = useQuery<UserContentFeedThreadQuery, UserContentFeedThreadQueryVariables>(THREAD_BY_TOPLEVEL_QUERY, {
    variables: { topLevelCommentId: topLevelId, limit: 200 },
    skip: !topLevelId,
    notifyOnNetworkStatusChange: false,
    fetchPolicy: 'cache-first',
  });

  // Build ancestry chain: results in array of comments from root down to focused comment
  const ancestryChain = useMemo(() => {
    const allThreadComments = threadData?.comments?.results ?? [comment];
    const chain: Array<UltraFeedComment & { __typename?: 'Comment' }> = [];
    const byId: Record<string, UltraFeedComment & { __typename?: 'Comment' }> = {};
    
    allThreadComments.forEach((c) => {
      byId[c._id] = c;
    });
    
    let current = comment;
    const seen = new Set<string>();
    
    while (current) {
      if (seen.has(current._id)) break;
      seen.add(current._id);
      chain.unshift(current);
      
      if (!current.parentCommentId) break;
      current = byId[current.parentCommentId];
    }
    
    return chain;
  }, [threadData?.comments?.results, comment]);
  
  const commentMetaInfos = useMemo(() => {
    const now = new Date();
    return Object.fromEntries(
      ancestryChain.map((c) => [
        c._id as string,
        {
          sources: ['subscriptionsComments'] as const,
          displayStatus: c._id === comment._id ? 'expanded' as FeedItemDisplayStatus : 'hidden' as FeedItemDisplayStatus,
          lastServed: now,
          lastViewed: null,
          lastInteracted: null,
          postedAt: new Date(c.postedAt),
          descendentCount: c.descendentCount ?? 0,
          directDescendentCount: c.directChildrenCount ?? 0,
        } as FeedCommentMetaInfo,
      ])
    );
  }, [ancestryChain, comment._id]);
  
  const thread: DisplayFeedCommentThread = useMemo(() => ({
    _id: `thread-${comment._id}`,
    comments: ancestryChain,
    commentMetaInfos,
  }), [comment._id, ancestryChain, commentMetaInfos]);

  return (
    <UltraFeedThreadItem
      thread={thread}
      index={index}
      settings={feedSettings}
      forceParentPostCollapsed={true}
      focusedCommentId={comment._id}
    />
  );
}


interface UserContentFeedProps {
  userId: string;
  initialLimit?: number;
  scrollContainerRef?: React.RefObject<HTMLElement>;
}

type SortMode = 'recent' | 'top';

type PostItem = PostsListWithVotes & { __typename?: 'Post' };
type CommentItem = CommentsList & { __typename?: 'Comment', post: PostItem | null };

interface FeedItem {
  type: 'post' | 'comment';
  data: PostItem | CommentItem;
  postedAt: Date;
}

const UserContentFeed = ({ userId, initialLimit = 10, scrollContainerRef }: UserContentFeedProps) => {
  const classes = useStyles(styles);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [offset, setOffset] = useState(0);
  const [postsOffset, setPostsOffset] = useState(0);
  const [commentsOffset, setCommentsOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const pageFetchSize = 20;

  const postsSortBy = sortMode === 'recent' ? 'new' : 'top';
  const commentsSortBy = sortMode === 'recent' ? 'new' : 'top';

  const { data: postsData, loading: postsLoading, fetchMore: fetchMorePosts } = useQuery<UserContentFeedPostsQuery, UserContentFeedPostsQueryVariables>(
    USER_POSTS_QUERY,
    {
      variables: { userId, limit: pageFetchSize, offset: 0, sortedBy: postsSortBy },
      skip: !userId,
      notifyOnNetworkStatusChange: false,
      fetchPolicy: 'cache-and-network',
    }
  );

  const { data: commentsData, loading: commentsLoading, fetchMore: fetchMoreComments } = useQuery<UserContentFeedCommentsQuery, UserContentFeedCommentsQueryVariables>(
    USER_COMMENTS_QUERY,
    {
      variables: { userId, limit: pageFetchSize, offset: 0, sortBy: commentsSortBy },
      skip: !userId,
      notifyOnNetworkStatusChange: false,
      fetchPolicy: 'cache-and-network',
    }
  );

  const mixedFeed = useMemo(() => {
    const items: FeedItem[] = [];
    
    const posts = postsData?.posts?.results ?? [];
    const comments = commentsData?.comments?.results ?? [];
    
    posts.forEach(post => {
      if (post?.postedAt) {
        items.push({
          type: 'post',
          data: post,
          postedAt: new Date(post.postedAt)
        });
      }
    });
    
    comments.forEach(comment => {
      if (comment?.postedAt) {
        items.push({
          type: 'comment',
          data: comment,
          postedAt: new Date(comment.postedAt)
        });
      }
    });
    
    if (sortMode === 'recent') {
      items.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
    } else {
      items.sort((a, b) => {
        const scoreA = a.data.baseScore ?? 0;
        const scoreB = b.data.baseScore ?? 0;
        return scoreB - scoreA;
      });
    }
    
    return items;
  }, [postsData, commentsData, sortMode]);

  const displayedItems = mixedFeed.slice(0, initialLimit + offset);
  
  const hasMoreLocal = displayedItems.length < mixedFeed.length;
  const postsTotal = postsData?.posts?.totalCount ?? null;
  const commentsTotal = commentsData?.comments?.totalCount ?? null;
  const postsLoaded = (postsData?.posts?.results ?? []).length;
  const commentsLoaded = (commentsData?.comments?.results ?? []).length;
  const postsHasMore = postsTotal == null ? true : postsLoaded < postsTotal;
  const commentsHasMore = commentsTotal == null ? true : commentsLoaded < commentsTotal;
  const hasMoreRemote = postsHasMore || commentsHasMore;

  const { settings: feedSettings } = useUltraFeedSettings();

  const handleLoadMore = useCallback(async () => {
    if (loadingMore) return;
    
    setOffset(prev => prev + 10);
    
    const needMore = (initialLimit + offset + 12) >= mixedFeed.length;
    
    if (needMore && hasMoreRemote) {
      setLoadingMore(true);
      try {
        if (postsHasMore && fetchMorePosts) {
          const newPostsOffset = postsOffset + pageFetchSize;
          await fetchMorePosts({
            variables: { offset: newPostsOffset, sortedBy: postsSortBy },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult) return prev;
              return {
                posts: {
                  ...fetchMoreResult.posts,
                  results: [...(prev.posts?.results ?? []), ...(fetchMoreResult.posts?.results ?? [])],
                  totalCount: fetchMoreResult.posts?.totalCount ?? null
                }
              };
            }
          });
          setPostsOffset(newPostsOffset);
        }
        
        if (commentsHasMore && fetchMoreComments) {
          const newCommentsOffset = commentsOffset + pageFetchSize;
          await fetchMoreComments({
            variables: { offset: newCommentsOffset, sortBy: commentsSortBy },
            updateQuery: (prev, { fetchMoreResult }) => {
              if (!fetchMoreResult) return prev;
              return {
                comments: {
                  ...fetchMoreResult.comments,
                  results: [...(prev.comments?.results ?? []), ...(fetchMoreResult.comments?.results ?? [])],
                  totalCount: fetchMoreResult.comments?.totalCount ?? null
                }
              };
            }
          });
          setCommentsOffset(newCommentsOffset);
        }
      } finally {
        setLoadingMore(false);
      }
    }
  }, [loadingMore, initialLimit, offset, mixedFeed.length, hasMoreRemote, postsHasMore, fetchMorePosts, commentsHasMore, fetchMoreComments, postsOffset, commentsOffset, postsSortBy, commentsSortBy]);

  // Set up infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    
    const rootEl = scrollContainerRef?.current ?? null;
    const sentinel = sentinelRef.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && (hasMoreLocal || hasMoreRemote)) {
          void handleLoadMore();
        }
      },
      {
        root: rootEl,
        rootMargin: '200px',
        threshold: 0,
      }
    );
    
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollContainerRef, mixedFeed.length, offset, loadingMore, handleLoadMore, hasMoreLocal, hasMoreRemote]);

  const renderItem = (item: FeedItem, index: number) => {
    if (item.type === 'post') {
      const post = item.data as PostItem;
      const postMetaInfo: FeedPostMetaInfo = {
        sources: ["subscriptionsPosts"],
        displayStatus: "expanded" as FeedItemDisplayStatus,
        highlight: false,
      };
      return (
        <UltraFeedPostItem
          key={`post-${post._id}`}
          post={post}
          postMetaInfo={postMetaInfo}
          index={index}
          settings={feedSettings}
        />
      );
    } else {
      const comment = item.data as CommentItem;
      return (
        <UltraFeedPrefetchedThreadItem
          key={`comment-${comment._id}`}
          comment={comment}
          index={index}
          feedSettings={feedSettings}
        />
      );
    }
  };


  const handleSortModeChange = useCallback((newMode: SortMode) => {
    if (newMode !== sortMode) {
      setSortMode(newMode);
      setOffset(0);
      setPostsOffset(0);
      setCommentsOffset(0);
    }
  }, [sortMode]);

  const isLoading = postsLoading || commentsLoading;
  const hasNoContent = !isLoading && mixedFeed.length === 0;

  if (hasNoContent) {
    return null;
  }

  return (
    <div className={classes.root}>
      {/* Sort mode tabs */}
      <div className={classes.sortToggle}>
        <div
          onClick={(e) => {
            e.preventDefault();
            handleSortModeChange('recent');
          }}
          className={classNames(
            classes.sortButton,
            sortMode === 'recent'
              ? classes.sortButtonActive
              : classes.sortButtonInactive
          )}
        >
          <div className={classes.tabLabel}>
            Recent
            {sortMode === 'recent' && (
              <div className={classes.tabUnderline} />
            )}
          </div>
        </div>
        <div
          onClick={(e) => {
            e.preventDefault();
            handleSortModeChange('top');
          }}
          className={classNames(
            classes.sortButton,
            sortMode === 'top'
              ? classes.sortButtonActive
              : classes.sortButtonInactive
          )}
        >
          <div className={classes.tabLabel}>
            Top
            {sortMode === 'top' && (
              <div className={classes.tabUnderline} />
            )}
          </div>
        </div>
      </div>
      {isLoading && <div className={classes.loading}>
        <Loading />
      </div>}
      {!isLoading && <div className={classes.feedContent}>
        {displayedItems.map((item, index) => renderItem(item, index))}
        {(hasMoreLocal || hasMoreRemote) && <div ref={sentinelRef} style={{height: 1}} />}
      </div>}
    </div>
  );
};



export default UserContentFeed;


