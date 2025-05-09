import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import classNames from 'classnames';
import { Typography } from "../common/Typography";
import { Loading } from "../vulcan-core/Loading";
import { CommentsNode } from "./CommentsNode";
import { LoadMore } from "../common/LoadMore";

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

const RecentCommentsInner = ({classes, terms, truncated=false, showPinnedOnProfile=false, noResultsMessage="No Comments Found"}: {
  classes: ClassesType<typeof styles>,
  terms: CommentsViewTerms,
  truncated?: boolean,
  showPinnedOnProfile?: boolean,
  noResultsMessage?: string,
}) => {
  const { loadingInitial, loadMoreProps, loading, results } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
  });
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

export const RecentComments = registerComponent('RecentComments', RecentCommentsInner, {styles});



