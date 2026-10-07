import React, { useEffect, useRef } from 'react';
import { useCurrentUser } from '../common/withUser';
import { userCanQuickTake } from '../../lib/vulcan-users/permissions';
import CommentOnPostWithReplies from "../comments/CommentOnPostWithReplies";
import QuickTakesEntry from "../quickTakes/QuickTakesEntry";
import Loading from "../vulcan-core/Loading";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const CommentWithRepliesFragmentMultiQuery = gql(`
  query multiCommentShortformThreadListQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentWithRepliesFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('ShortformThreadList', (theme: ThemeType) => ({
  shortformItem: {
    marginTop: 32,
  },
  loading: {
    marginTop: 16,
  },
}))

// Start loading the next page when the bottom of the list is within this many
// pixels of the viewport.
const loadMoreDistance = 1000;

const ShortformThreadList = ({userId, showQuickTakeEntry = true, showPostTitle = true, limit = 20, sortBy = 'recentComments'}: {
  userId?: string,
  showQuickTakeEntry?: boolean,
  showPostTitle?: boolean,
  limit?: number,
  sortBy?: CommentSortingMode,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const shortformSelector = { topShortform: { userId, sortBy } };
  
  const { data, error, refetch, loadMoreProps } = useQueryWithLoadMore(CommentWithRepliesFragmentMultiQuery, {
    variables: {
      selector: shortformSelector,
      limit,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
  });

  const results = data?.comments?.results;
  const { loadMore, loading, hidden: reachedEnd, count } = loadMoreProps;
  const bottomRef = useRef<HTMLDivElement|null>(null);

  // Infinite scroll. The observer is recreated whenever a page finishes
  // loading, so that if the bottom of the list is still near the viewport (eg
  // on a tall screen), the next page is requested immediately.
  useEffect(() => {
    const bottom = bottomRef.current;
    if (!bottom || loading || reachedEnd || error) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: `0px 0px ${loadMoreDistance}px 0px` },
    );
    observer.observe(bottom);
    return () => observer.disconnect();
  }, [loadMore, loading, reachedEnd, error, count]);

  return (
    <div>
      {showQuickTakeEntry && (userCanQuickTake(currentUser) || !currentUser) &&
        <QuickTakesEntry currentUser={currentUser} successCallback={refetch} />
      }

      {results && results.map((comment) => {
        if (!comment.post) {
          return null;
        }
        return <div key={comment._id} className={classes.shortformItem}>
          <CommentOnPostWithReplies comment={comment} post={comment.post} commentNodeProps={{
            treeOptions: {
              showPostTitle,
              refetch
            }
          }}/>
        </div>
      })}
      {((!reachedEnd && !error) || loading) && <div ref={bottomRef} className={classes.loading}>
        <Loading />
      </div>}
    </div>
  )
}

export default ShortformThreadList;
