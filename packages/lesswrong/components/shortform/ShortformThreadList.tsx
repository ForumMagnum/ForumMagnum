import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userCanQuickTake } from '../../lib/vulcan-users/permissions';
import LoadMore from "../common/LoadMore";
import CommentOnPostWithReplies from "../comments/CommentOnPostWithReplies";
import QuickTakesEntry from "../quickTakes/QuickTakesEntry";
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
  }
}))

const ShortformThreadList = ({userId, showQuickTakeEntry = true, showPostTitle = true, limit = 20}: {
  userId?: string,
  showQuickTakeEntry?: boolean,
  showPostTitle?: boolean,
  limit?: number,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const shortformSelector = userId
    ? { shortform: { userId } }
    : { shortform: {} };
  
  const { data, refetch, loadMoreProps } = useQueryWithLoadMore(CommentWithRepliesFragmentMultiQuery, {
    variables: {
      selector: shortformSelector,
      limit,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
  });

  const results = data?.comments?.results;

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
      <LoadMore {...loadMoreProps} />
    </div>
  )
}

export default registerComponent('ShortformThreadList', ShortformThreadList, {styles});
