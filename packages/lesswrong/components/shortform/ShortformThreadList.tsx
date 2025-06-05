import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { userCanQuickTake } from '../../lib/vulcan-users/permissions';
import { isFriendlyUI } from '../../themes/forumTheme';
import LoadMore from "../common/LoadMore";
import CommentOnPostWithReplies from "../comments/CommentOnPostWithReplies";
import QuickTakesEntry from "../quickTakes/QuickTakesEntry";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

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

const styles = (theme: ThemeType) => ({
  shortformItem: {
    marginTop: theme.spacing.unit * (isFriendlyUI ? 2 : 4),
  }
})

const ShortformThreadList = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  
  const { data, refetch, loadMoreProps } = useQueryWithLoadMore(CommentWithRepliesFragmentMultiQuery, {
    variables: {
      selector: { shortform: {} },
      limit: 20,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
  });

  const results = data?.comments?.results;

  return (
    <div>
      {(userCanQuickTake(currentUser) || !currentUser) &&
        <QuickTakesEntry currentUser={currentUser} successCallback={refetch} />
      }

      {results && results.map((comment) => {
        if (!comment.post) {
          return null;
        }
        return <div key={comment._id} className={classes.shortformItem}>
          <CommentOnPostWithReplies comment={comment} post={comment.post} commentNodeProps={{
            treeOptions: {
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


