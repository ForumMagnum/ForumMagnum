import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import Loading from '../vulcan-core/Loading';
import UltraFeedPostItem from '../ultraFeed/UltraFeedPostItem';
import UltraFeedThreadItem from "../ultraFeed/UltraFeedThreadItem";
import { UltraFeedSettingsType } from '../ultraFeed/ultraFeedSettingsTypes';
import { FeedPostMetaInfo, DisplayFeedCommentThread, FeedItemSourceType } from '../ultraFeed/ultraFeedTypes';
import classNames from 'classnames';
import { useUltraFeedSettings } from '../hooks/useUltraFeedSettings';
import { useQueryWithLoadMore } from '../hooks/useQueryWithLoadMore';

const USER_POSTS_QUERY = gql(`
  query UserContentFeedPosts($userId: String!, $limit: Int!, $sortedBy: String!) {
    posts(selector: { userPosts: { userId: $userId, sortedBy: $sortedBy } }, limit: $limit, enableTotal: true) {
      results {
        ...PostsListWithVotes
      }
      totalCount
    }
  }
`);

const USER_COMMENTS_QUERY = gql(`
  query UserContentFeedComments($userId: String!, $limit: Int!, $sortBy: String!) {
    comments(selector: { profileComments: { userId: $userId, sortBy: $sortBy } }, limit: $limit, enableTotal: true) {
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

export const userContentFeedStyles = defineStyles("UserContentFeed", (theme: ThemeType) => ({
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
    const chain: Array<UltraFeedComment> = [];
    const byId: Record<string, UltraFeedComment> = {};
    
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
        c._id,
        {
          sources: ['subscriptionsComments'] as FeedItemSourceType[],
          displayStatus: (c._id === comment._id ? 'expanded' as const : 'hidden' as const),
          lastServed: now,
          lastViewed: null,
          lastInteracted: null,
          postedAt: new Date(c.postedAt),
          descendentCount: c.descendentCount ?? 0,
          directDescendentCount: c.directChildrenCount ?? 0,
        },
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
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
}

type SortMode = 'recent' | 'top';

type PostItem = PostsListWithVotes;
type CommentItem = CommentsList & { post: PostItem | null };

type FeedItem = 
  | { type: 'post'; data: PostItem; postedAt: Date }
  | { type: 'comment'; data: CommentItem; postedAt: Date };

const UserContentFeedItem = ({ item, index, feedSettings }: {
  item: FeedItem;
  index: number;
  feedSettings: UltraFeedSettingsType;
}) => {
  if (item.type === 'post') {
    const post = item.data;
    const postMetaInfo: FeedPostMetaInfo = {
      sources: ["subscriptionsPosts"],
      displayStatus: "expanded",
      highlight: false,
    };
    return (
      <UltraFeedPostItem
        post={post}
        postMetaInfo={postMetaInfo}
        index={index}
        settings={feedSettings}
      />
    );
  } else {
    const comment = item.data;
    return (
      <UltraFeedPrefetchedThreadItem
        comment={comment}
        index={index}
        feedSettings={feedSettings}
      />
    );
  }
};

const UserContentFeed = ({ userId, initialLimit = 10, scrollContainerRef }: UserContentFeedProps) => {
  const classes = useStyles(userContentFeedStyles);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const postsSortBy = sortMode === 'recent' ? 'new' : 'top';
  const commentsSortBy = sortMode === 'recent' ? 'new' : 'top';

  const { 
    data: postsData, 
    loading: postsLoading, 
    loadMoreProps: postsLoadMoreProps 
  } = useQueryWithLoadMore(
    USER_POSTS_QUERY,
    {
      variables: { userId, limit: initialLimit, sortedBy: postsSortBy },
      skip: !userId,
      fetchPolicy: 'cache-and-network',
      itemsPerPage: 10,
    }
  );

  const { 
    data: commentsData, 
    loading: commentsLoading, 
    loadMoreProps: commentsLoadMoreProps 
  } = useQueryWithLoadMore(
    USER_COMMENTS_QUERY,
    {
      variables: { userId, limit: initialLimit, sortBy: commentsSortBy },
      skip: !userId,
      fetchPolicy: 'cache-and-network',
      itemsPerPage: 10,
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

  const postsHasMore = !postsLoadMoreProps.hidden;
  const commentsHasMore = !commentsLoadMoreProps.hidden;
  const hasMoreRemote = postsHasMore || commentsHasMore;

  const { settings: feedSettings } = useUltraFeedSettings();

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRemote) return;
    
    setLoadingMore(true);
    try {
      // Load more from both queries in parallel
      const promises = [];
      if (postsHasMore) {
        promises.push(postsLoadMoreProps.loadMore());
      }
      if (commentsHasMore) {
        promises.push(commentsLoadMoreProps.loadMore());
      }
      await Promise.all(promises);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreRemote, postsHasMore, commentsHasMore, postsLoadMoreProps, commentsLoadMoreProps]);

  // Set up infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    
    const rootEl = scrollContainerRef?.current ?? null;
    const sentinel = sentinelRef.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && hasMoreRemote) {
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
  }, [scrollContainerRef, loadingMore, handleLoadMore, hasMoreRemote]);




  const handleSortModeChange = useCallback((newMode: SortMode) => {
    if (newMode !== sortMode) {
      setSortMode(newMode);
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
        {mixedFeed.map((item, index) => (
          <UserContentFeedItem 
            key={item.type === 'post' ? `post-${item.data._id}` : `comment-${item.data._id}`}
            item={item} 
            index={index} 
            feedSettings={feedSettings} 
          />
        ))}
        {hasMoreRemote && <div ref={sentinelRef} style={{height: 1}} />}
      </div>}
    </div>
  );
};



export default UserContentFeed;


