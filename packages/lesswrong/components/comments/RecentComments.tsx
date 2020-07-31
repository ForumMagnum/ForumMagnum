import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Comments } from '../../lib/collections/comments';
import Typography from '@material-ui/core/Typography';

const styles = theme =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  }
})

const RecentComments = ({classes, terms, truncated=false, noResultsMessage="No Comments Found"}: {
  classes: ClassesType,
  terms: any,
  truncated?: boolean,
  noResultsMessage?: string,
}) => {
  const { loadingInitial, loadMoreProps, results } = useMulti({
    terms,
    collection: Comments,
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
    pollInterval: 0,
    queryLimitName: "recentCommentsLimit",
    ssr: true
  });
  if (!loadingInitial && results && !results.length) {
    return (<Typography variant="body2">{noResultsMessage}</Typography>)
  }
  if (loadingInitial || !results) {
    return <Components.Loading />
  }
  
  return (
    <div className={classes.root}>
      {results.map(comment =>
        <div key={comment._id}>
          <Components.CommentsNode
            comment={comment}
            post={comment.post || undefined}
            showPostTitle
            startThreadTruncated={truncated}
            forceNotSingleLine
            condensed={false}
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

