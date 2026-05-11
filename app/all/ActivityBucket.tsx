"use client";

import React, { useCallback, useMemo, useState } from 'react';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LoadMore from '@/components/common/LoadMore';
import Loading from '@/components/vulcan-core/Loading';
import ActivityListItem, { ActivityItem } from './ActivityListItem';

const RecentActivityPostsQuery = gql(`
  query RecentActivityPostsQuery($selector: PostSelector, $limit: Int) {
    posts(selector: $selector, limit: $limit) {
      results {
        ...PostsList
      }
    }
  }
`);

const RecentActivityCommentsQuery = gql(`
  query RecentActivityCommentsQuery($selector: CommentSelector, $limit: Int) {
    comments(selector: $selector, limit: $limit) {
      results {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);

const INITIAL_FETCH_LIMIT = 7;
const BACKGROUND_FETCH_LIMIT = 30;
const INITIAL_VISIBLE = 7;

const styles = defineStyles('ActivityBucket', (theme: ThemeType) => ({
  bucket: {
    marginBottom: 28,
  },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
  },
  label: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: theme.palette.greyAlpha(0.78),
  },
  range: {
    fontSize: 12,
    color: theme.palette.greyAlpha(0.45),
  },
  count: {
    marginLeft: 'auto',
    fontSize: 12,
    color: theme.palette.greyAlpha(0.45),
    fontVariantNumeric: 'tabular-nums',
  },
  empty: {
    fontSize: 13,
    color: theme.palette.greyAlpha(0.45),
    fontStyle: 'italic',
    padding: '6px 0',
  },
  loadMore: {
    marginTop: 6,
    marginLeft: 42,
    fontSize: 12,
  },
}));

interface ActivityBucketProps {
  label: string;
  range: string;
  after: string;
  before: string;
  secondaryReady: boolean;
}

const ActivityBucket = ({ label, range, after, before, secondaryReady }: ActivityBucketProps) => {
  const classes = useStyles(styles);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const postsSelector = useMemo(() => ({ top: { after, before } }), [after, before]);
  const commentsSelector = useMemo(() => ({ allRecentComments: { sortBy: 'top', after, before } }), [after, before]);

  const postsInitial = useQuery(RecentActivityPostsQuery, {
    variables: { selector: postsSelector, limit: INITIAL_FETCH_LIMIT },
  });
  const postsBackground = useQuery(RecentActivityPostsQuery, {
    variables: { selector: postsSelector, limit: BACKGROUND_FETCH_LIMIT },
    skip: !secondaryReady,
  });
  const commentsInitial = useQuery(RecentActivityCommentsQuery, {
    variables: { selector: commentsSelector, limit: INITIAL_FETCH_LIMIT },
  });
  const commentsBackground = useQuery(RecentActivityCommentsQuery, {
    variables: { selector: commentsSelector, limit: BACKGROUND_FETCH_LIMIT },
    skip: !secondaryReady,
  });

  const items = useMemo<ActivityItem[]>(() => {
    const postResults = postsBackground.data?.posts?.results ?? postsInitial.data?.posts?.results ?? [];
    const commentResults = commentsBackground.data?.comments?.results ?? commentsInitial.data?.comments?.results ?? [];

    const result: ActivityItem[] = [];
    for (const post of postResults) {
      if (!post.postedAt) continue;
      result.push({ kind: 'post', post, postedAt: new Date(post.postedAt), baseScore: post.baseScore ?? 0 });
    }
    for (const comment of commentResults) {
      if (!comment.postedAt) continue;
      // Skip comments whose parent post/tag we don't have access to; matches RecentComments.tsx
      if (!comment.post?._id && !comment.tag?._id) continue;
      result.push({ kind: 'comment', comment, postedAt: new Date(comment.postedAt), baseScore: comment.baseScore ?? 0 });
    }
    result.sort((a, b) => b.baseScore - a.baseScore);
    return result;
  }, [postsInitial.data, postsBackground.data, commentsInitial.data, commentsBackground.data]);

  const isInitialLoading = (postsInitial.loading && !postsInitial.data) || (commentsInitial.loading && !commentsInitial.data);
  const visibleItems = items.slice(0, visibleCount);
  const hasMore = items.length > visibleCount;

  const handleLoadMore = useCallback(() => {
    setVisibleCount(items.length);
  }, [items.length]);

  return (
    <div className={classes.bucket}>
      <div className={classes.header}>
        <span className={classes.label}>{label}</span>
      </div>
      {isInitialLoading
        ? <Loading />
        : items.length === 0
          ? <div className={classes.empty}>Nothing in this window</div>
          : visibleItems.map(item => (
            <ActivityListItem
              key={item.kind === 'post' ? `p-${item.post._id}` : `c-${item.comment._id}`}
              item={item}
            />
          ))
      }
      {hasMore && (
        <div className={classes.loadMore}>
          <LoadMore
            loadMore={handleLoadMore}
            count={visibleCount}
            totalCount={items.length}
          />
        </div>
      )}
    </div>
  );
};

export default ActivityBucket;
