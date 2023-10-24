import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  }
})

const RecentComments = ({classes, terms, truncated=false, showPinnedOnProfile=false, noResultsMessage="No Comments Found"}: {
  classes: ClassesType,
  terms: CommentsViewTerms,
  truncated?: boolean,
  showPinnedOnProfile?: boolean,
  noResultsMessage?: string,
}) => {
  const { loadingInitial, loadMoreProps, results } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
  });
  // Filter out comments where the user doesn't have access to the post or tag (mostly for posts that are converted to draft)
  const validResults = results?.filter(comment => comment.post?._id || comment.tag?._id)

  if (!loadingInitial && validResults && !validResults.length) {
    return (<Components.Typography variant="body2">{noResultsMessage}</Components.Typography>)
  }
  if (loadingInitial || !validResults) {
    return <Components.Loading />
  }
  
  return (
    <div className={classes.root + " recent-comments-container"}>
      {validResults.map(comment =>
        <div key={comment._id}>
          <Components.CommentsNode
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
      <Components.LoadMore {...loadMoreProps} />
    </div>
  )
}

const RecentCommentsComponent = registerComponent('RecentComments', RecentComments, {styles});

declare global {
  interface ComponentTypes {
    RecentComments: typeof RecentCommentsComponent,
  }
}

