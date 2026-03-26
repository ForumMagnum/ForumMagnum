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
import { MixedTypeFeed } from '../common/MixedTypeFeed';
import { UserContentFeedQuery as SharedUserContentFeedQuery } from '../common/feeds/feedQueries';
import CommentsNode from '../comments/CommentsNode';
import RecentDiscussionThread from '../recentDiscussion/RecentDiscussionThread';
import SingleLineTagUpdates from '../tagging/SingleLineTagUpdates';

// Queries used only by the "top" sort mode fallback
const USER_POSTS_QUERY = gql(`
  query UserContentFeedPosts($userId: String!, $limit: Int!, $sortedBy: String!) {
    posts(selector: { userPosts: { userId: $userId, sortedBy: $sortedBy, authorIsUnreviewed: null } }, limit: $limit, enableTotal: true) {
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

const USER_WIKI_EDITS_QUERY = gql(`
  query UserContentFeedWikiEdits($userId: String!, $limit: Int!) {
    revisions(selector: { revisionsByUser: { userId: $userId } }, limit: $limit, enableTotal: true) {
      results {
        ...RevisionTagFragment
      }
      totalCount
    }
  }
`);

const COMMENTS_LIST_MULTI_QUERY = gql(`
  query multiCommentuseCommentQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
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
  feedContentNoSideMargins: {
    marginLeft: 0,
    marginRight: 0,
  },
  loading: {
    padding: 40,
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapPostItem: {
  }
}));

// Renders a comment in the feed by fetching its full thread context and displaying
// the ancestry chain with the focused comment expanded.
function PrefetchedThreadItem({ comment, index, feedSettings }: {
  comment: UltraFeedComment;
  index: number;
  feedSettings: UltraFeedSettingsType;
}) {
  const topLevelId = comment.topLevelCommentId ?? comment._id;
  const { data: threadData } = useQuery<UserContentFeedThreadQuery, UserContentFeedThreadQueryVariables>(THREAD_BY_TOPLEVEL_QUERY, {
    variables: { topLevelCommentId: topLevelId, limit: 200 },
    skip: !topLevelId,
    notifyOnNetworkStatusChange: false,
    fetchPolicy: 'cache-first',
    ssr: false,
  });

  // Build ancestry chain: results in array of comments from root down to focused comment
  const ancestryChain = useMemo(() => {
    const allThreadComments = threadData?.comments?.results ?? [comment];
    const chain: Array<UltraFeedComment> = [];
    const byId: Record<string, UltraFeedComment> = {};

    allThreadComments.forEach((c) => {
      byId[c._id] = c;
    });

    // Prefer the thread-fetched copy when available so we keep richer fields (e.g. post metadata).
    let current = byId[comment._id] ?? comment;
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


type SortMode = 'recent' | 'top';
type FilterMode = 'all' | 'posts' | 'quickTakes' | 'comments' | 'wikiEdits';

interface UserContentFeedProps {
  userId: string;
  initialLimit?: number;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  externalSortMode?: SortMode;
  externalFilter?: FilterMode;
  removeSideMargins?: boolean;
}

type PostItem = PostsListWithVotes;
type CommentItem = CommentsList & { post: PostItem | null };
type WikiEditItem = RevisionTagFragment;

type FeedItem =
  | { type: 'post'; data: PostItem; sortAt: Date }
  | { type: 'comment'; data: CommentItem; sortAt: Date }
  | { type: 'wikiEdit'; data: WikiEditItem; sortAt: Date };

// Renders a single item in the score-sorted ("top") feed
function TopSortedFeedItem({ item, index, feedSettings }: {
  item: FeedItem;
  index: number;
  feedSettings: UltraFeedSettingsType;
}) {
  if (item.type === 'post') {
    const postMetaInfo: FeedPostMetaInfo = {
      sources: ["subscriptionsPosts"],
      displayStatus: "expanded",
      highlight: false,
    };
    return (
      <UltraFeedPostItem
        post={item.data}
        postMetaInfo={postMetaInfo}
        index={index}
        settings={feedSettings}
      />
    );
  }

  if (item.type === 'comment') {
    return (
      <PrefetchedThreadItem
        comment={item.data}
        index={index}
        feedSettings={feedSettings}
      />
    )
  }

  const tag = item.data.tag ?? item.data.lens?.parentTag;
  if (!tag) {
    return null;
  }

  return (
    <SingleLineTagUpdates
      tag={tag}
      revisionIds={[item.data._id]}
      changeMetrics={item.data.changeMetrics}
      lastRevisedAt={new Date(item.data.editedAt)}
    />
  );
}

// "Recent" mode: uses a server-side resolver that properly interleaves posts and
// comments by date with cursor-based pagination, so items always appear in
// chronological order and new pages append at the bottom.
function RecentFeed({ userId, filter, feedSettings, removeSideMargins }: {
  userId: string;
  filter: FilterMode;
  feedSettings: UltraFeedSettingsType;
  removeSideMargins: boolean;
}) {
  const classes = useStyles(userContentFeedStyles);

  return (
    <MixedTypeFeed<typeof SharedUserContentFeedQuery>
      query={SharedUserContentFeedQuery}
      variables={{ userId, sortBy: "new", filter }}
      firstPageSize={20}
      pageSize={20}
      className={classNames(classes.feedContent, removeSideMargins && classes.feedContentNoSideMargins)}
      renderers={{
        userPost: {
          render: (post, index) => {
            const postMetaInfo: FeedPostMetaInfo = {
              sources: ["subscriptionsPosts"],
              displayStatus: "expanded",
              highlight: false,
            };
            return (
              <div className={classes.wrapPostItem}>
                <RecentDiscussionThread
                  post={post}
                  cardStyle
                  refetch={() => {}}
                  expandAllThreads={false}
                />
              </div>
            );
          },
        },
        profileComment: {
          render: (comment, index) => (
            <CommentsNode
              key={comment._id}
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                //tag: comment.tag || undefined,
                showPostTitle: true,
                forceNotSingleLine: true,
              }}
              comment={comment}
              startThreadTruncated={true}
            />
          ),
        },
        shortformComment: {
          render: (comment, index) => (
            <CommentsNode
              key={comment._id}
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                //tag: comment.tag || undefined,
                showPostTitle: true,
                forceNotSingleLine: true,
              }}
              comment={comment}
              startThreadTruncated={true}
            />
          ),
        },
        wikiEdit: {
          render: (revision) => {
            const tag = revision.tag ?? revision.lens?.parentTag;
            if (!tag) {
              return null;
            }

            return (
              <SingleLineTagUpdates
                tag={tag}
                revisionIds={[revision._id]}
                changeMetrics={revision.changeMetrics}
                lastRevisedAt={new Date(revision.editedAt)}
              />
            );
          },
        },
      }}
    />
  );
}

// "Top" mode: uses the old three-query approach with independent pagination.
// Score-based sorting doesn't have the same date-range mismatch problem as
// chronological sorting, so this simpler approach works fine.
function TopFeed({ userId, filter, feedSettings, removeSideMargins, initialLimit }: {
  userId: string;
  filter: FilterMode;
  feedSettings: UltraFeedSettingsType;
  removeSideMargins: boolean;
  initialLimit: number;
}) {
  const classes = useStyles(userContentFeedStyles);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const skipPosts = filter === 'comments' || filter === 'wikiEdits';
  const skipProfileComments = filter === 'posts' || filter === 'quickTakes' || filter === 'wikiEdits';
  const skipShortformComments = filter === 'posts' || filter === 'wikiEdits';
  const skipWikiEdits = filter === 'posts' || filter === 'quickTakes' || filter === 'comments';

  const {
    data: postsData,
    loading: postsLoading,
    loadMoreProps: postsLoadMoreProps
  } = useQueryWithLoadMore(
    USER_POSTS_QUERY,
    {
      variables: { userId, limit: initialLimit, sortedBy: 'top' },
      skip: !userId || skipPosts,
      fetchPolicy: 'cache-and-network',
      itemsPerPage: 10,
    }
  );

  const {
    data: profileCommentsData,
    loading: profileCommentsLoading,
    loadMoreProps: profileCommentsLoadMoreProps
  } = useQueryWithLoadMore(
    USER_COMMENTS_QUERY,
    {
      variables: { userId, limit: initialLimit, sortBy: 'top' },
      skip: !userId || skipProfileComments,
      fetchPolicy: 'cache-and-network',
      itemsPerPage: 10,
    }
  );

  const {
    data: shortformCommentsData,
    loading: shortformCommentsLoading,
    loadMoreProps: shortformCommentsLoadMoreProps
  } = useQueryWithLoadMore(
    COMMENTS_LIST_MULTI_QUERY,
    {
      variables: { selector: { topShortform: { userId } }, limit: initialLimit, enableTotal: true },
      skip: !userId || skipShortformComments,
      fetchPolicy: 'cache-and-network',
      itemsPerPage: 10,
    }
  );

  const {
    data: wikiEditsData,
    loading: wikiEditsLoading,
    loadMoreProps: wikiEditsLoadMoreProps,
  } = useQueryWithLoadMore<UserContentFeedWikiEditsQuery, UserContentFeedWikiEditsQueryVariables>(
    USER_WIKI_EDITS_QUERY,
    {
      variables: { userId, limit: initialLimit },
      skip: !userId || skipWikiEdits,
      fetchPolicy: 'cache-and-network',
      itemsPerPage: 10,
    }
  );

  const mixedFeed = useMemo(() => {
    const items: FeedItem[] = [];

    const posts = skipPosts ? [] : (postsData?.posts?.results ?? []);
    const profileComments = (skipProfileComments ? [] : (profileCommentsData?.comments?.results ?? [])) as CommentItem[];
    const shortformComments = skipShortformComments
      ? []
      : (shortformCommentsData?.comments?.results ?? []).map((comment) => ({ ...comment, post: null })) as CommentItem[];
    const shortformCommentIds = new Set(shortformComments.map((comment) => comment._id));
    const wikiEdits = skipWikiEdits ? [] : (wikiEditsData?.revisions?.results ?? []);
    const comments: CommentItem[] = (() => {
      if (filter === 'quickTakes') {
        return shortformComments;
      }
      if (filter === 'comments') {
        return profileComments.filter((comment) => !shortformCommentIds.has(comment._id));
      }
      const merged: CommentItem[] = [];
      const seenCommentIds = new Set<string>();
      [...profileComments, ...shortformComments].forEach((comment) => {
        if (seenCommentIds.has(comment._id)) return;
        seenCommentIds.add(comment._id);
        merged.push(comment);
      });
      return merged;
    })();

    posts.forEach(post => {
      if (!post?.postedAt) return;
      const isShortform = !!post.shortform;
      if (filter === 'posts' && isShortform) return;
      if (filter === 'quickTakes' && !isShortform) return;
      items.push({
        type: 'post',
        data: post,
        sortAt: new Date(post.postedAt)
      });
    });

    comments.forEach(comment => {
      if (!comment?.postedAt) return;
      items.push({
        type: 'comment',
        data: comment,
        sortAt: new Date(comment.postedAt)
      });
    });

    wikiEdits.forEach((revision) => {
      if (!revision?.editedAt) return;
      items.push({
        type: 'wikiEdit',
        data: revision,
        sortAt: new Date(revision.editedAt),
      });
    });

    items.sort((a, b) => {
      const scoreA = a.data.baseScore ?? 0;
      const scoreB = b.data.baseScore ?? 0;
      return scoreB - scoreA;
    });

    return items;
  }, [postsData, profileCommentsData, shortformCommentsData, wikiEditsData, filter, skipPosts, skipProfileComments, skipShortformComments, skipWikiEdits]);

  const postsHasMore = !skipPosts && !postsLoadMoreProps.hidden;
  const profileCommentsHasMore = !skipProfileComments && !profileCommentsLoadMoreProps.hidden;
  const shortformCommentsHasMore = !skipShortformComments && !shortformCommentsLoadMoreProps.hidden;
  const wikiEditsHasMore = !skipWikiEdits && !wikiEditsLoadMoreProps.hidden;
  const hasMoreRemote = postsHasMore || profileCommentsHasMore || shortformCommentsHasMore || wikiEditsHasMore;

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMoreRemote) return;

    setLoadingMore(true);
    try {
      const promises = [];
      if (postsHasMore) promises.push(postsLoadMoreProps.loadMore());
      if (profileCommentsHasMore) promises.push(profileCommentsLoadMoreProps.loadMore());
      if (shortformCommentsHasMore) promises.push(shortformCommentsLoadMoreProps.loadMore());
      if (wikiEditsHasMore) promises.push(wikiEditsLoadMoreProps.loadMore());
      await Promise.all(promises);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreRemote, postsHasMore, profileCommentsHasMore, shortformCommentsHasMore, wikiEditsHasMore, postsLoadMoreProps, profileCommentsLoadMoreProps, shortformCommentsLoadMoreProps, wikiEditsLoadMoreProps]);

  // Set up infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const sentinel = sentinelRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore && hasMoreRemote) {
          void handleLoadMore();
        }
      },
      {
        rootMargin: '200px',
        threshold: 0,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadingMore, handleLoadMore, hasMoreRemote]);

  const isInitialLoading = (
    (!skipPosts && postsLoading) ||
    (!skipProfileComments && profileCommentsLoading) ||
    (!skipShortformComments && shortformCommentsLoading) ||
    (!skipWikiEdits && wikiEditsLoading)
  ) && mixedFeed.length === 0;

  if (isInitialLoading) {
    return <div className={classes.loading}><Loading /></div>;
  }

  return (
    <div className={classNames(classes.feedContent, removeSideMargins && classes.feedContentNoSideMargins)}>
      {mixedFeed.map((item, index) => (
        <TopSortedFeedItem
          key={`${item.type}-${item.data._id}`}
          item={item}
          index={index}
          feedSettings={feedSettings}
        />
      ))}
      {hasMoreRemote && <div ref={sentinelRef} style={{height: 1}} />}
      {loadingMore && <div className={classes.loading}><Loading /></div>}
    </div>
  );
}

const UserContentFeed = ({ userId, initialLimit = 10, externalSortMode, externalFilter, removeSideMargins = false }: UserContentFeedProps) => {
  const classes = useStyles(userContentFeedStyles);
  const [internalSortMode, setInternalSortMode] = useState<SortMode>('recent');
  const sortMode = externalSortMode ?? internalSortMode;
  const setSortMode = setInternalSortMode;
  const filter = externalFilter ?? 'all';

  const { settings: feedSettings } = useUltraFeedSettings();

  const handleSortModeChange = useCallback((newMode: SortMode) => {
    if (newMode !== sortMode) {
      setSortMode(newMode);
    }
  }, [sortMode, setSortMode]);

  return (
    <div className={classes.root}>
      {/* Sort mode tabs - hidden when externally controlled */}
      {!externalSortMode && (
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
      )}
      {sortMode === 'recent' ? (
        <RecentFeed
          userId={userId}
          filter={filter}
          feedSettings={feedSettings}
          removeSideMargins={removeSideMargins}
        />
      ) : (
        <TopFeed
          userId={userId}
          filter={filter}
          feedSettings={feedSettings}
          removeSideMargins={removeSideMargins}
          initialLimit={initialLimit}
        />
      )}
    </div>
  );
};



export default UserContentFeed;
