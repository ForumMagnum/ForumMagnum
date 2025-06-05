import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import classNames from 'classnames';
import { Typography } from "../common/Typography";
import Loading from "../vulcan-core/Loading";
import CommentsNodeInner from "./CommentsNode";
import LoadMore from "../common/LoadMore";
import { NetworkStatus } from "@apollo/client";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const CommentsListWithParentMetadataMultiQuery = gql(`
  query multiCommentRecentCommentsQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsListWithParentMetadata
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  },
  verticalHeightSpacer: {
    minHeight: "100vh",
  },
})

const RecentComments = ({classes, terms, truncated=false, showPinnedOnProfile=false, noResultsMessage="No Comments Found"}: {
  classes: ClassesType<typeof styles>,
  terms: CommentsViewTerms,
  truncated?: boolean,
  showPinnedOnProfile?: boolean,
  noResultsMessage?: string,
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data, networkStatus, loadMoreProps } = useQueryWithLoadMore(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: limit ?? 10,
      enableTotal: false,
    },
  });

  const results = data?.comments?.results;

  const loadingInitial = networkStatus === NetworkStatus.loading;
  // Filter out comments where the user doesn't have access to the post or tag (mostly for posts that are converted to draft)
  const validResults = results?.filter(comment => comment.post?._id || comment.tag?._id)

  if (!loadingInitial && validResults && !validResults.length) {
    return (<Typography variant="body2">{noResultsMessage}</Typography>)
  }
  if (loadingInitial || !validResults) {
    return <div className={classes.verticalHeightSpacer}>
      <Loading />
    </div>
  }
  
  return <div className={classes.root}>
    {validResults.map(comment =>
      <div key={comment._id}>
        <CommentsNodeInner
          treeOptions={{
            condensed: false,
            post: comment.post || undefined,
            tag: comment.tag || undefined,
            showPostTitle: true,
            forceNotSingleLine: true
          }}
          comment={comment}
          startThreadTruncated={truncated}
          showPinnedOnProfile={showPinnedOnProfile}
        />
      </div>
    )}
    <LoadMore {...loadMoreProps} />
  </div>
}

export default registerComponent('RecentComments', RecentComments, {styles});



