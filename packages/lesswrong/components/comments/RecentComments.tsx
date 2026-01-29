import React from 'react';
import { Typography } from "../common/Typography";
import Loading from "../vulcan-core/Loading";
import CommentsNode from "./CommentsNode";
import LoadMore from "../common/LoadMore";
import { NetworkStatus } from "@apollo/client";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { CommentsListWithParentMetadataMultiQuery } from './queries';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("RecentComments", (theme: ThemeType) =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  },
  verticalHeightSpacer: {
    minHeight: "100vh",
  },
}))

const RecentComments = ({selector, limit, truncated=false, showPinnedOnProfile=false, noResultsMessage="No Comments Found"}: {
  selector: CommentSelector,
  limit?: number,
  truncated?: boolean,
  showPinnedOnProfile?: boolean,
  noResultsMessage?: string,
}) => {
  const classes = useStyles(styles);
  const { data, networkStatus, loadMoreProps } = useQueryWithLoadMore(CommentsListWithParentMetadataMultiQuery, {
    variables: {
      selector,
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
        <CommentsNode
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

export default RecentComments;



