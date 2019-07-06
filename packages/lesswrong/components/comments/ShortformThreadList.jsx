import React from 'react';
import { Components, registerComponent, withList, Loading } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    color: theme.palette.grey[600]
  }
})

const ShortformThreadList = ({ classes, results, loading, loadMore, networkStatus, currentUser }) => {

  const { LoadMore, ShortformThread } = Components

  if (!loading && results && !results.length) {
    return null
  }

  const loadingMore = networkStatus === 2;

  return (
    <div>
        <Typography variant="body2" className={classes.title}>
          Note: shows the most recent 3 comments on each shortform post
        </Typography>
        {loading || !results ? <Loading /> :
        <div> 
          {results.map((comment, i) => {
            return <ShortformThread key={comment._id} comment={comment} />
          })}
          { loadMore && <LoadMore loading={loadingMore || loading} loadMore={loadMore}  /> }
          { loadingMore && <Loading />}
        </div>}
    </div>)
  }

const discussionThreadsOptions = {
  collection: Comments,
  queryName: 'ShortformThreadListQuery',
  fragmentName: 'ShortformCommentsList',
  enableTotal: false,
  pollInterval: 0,
  enableCache: true,
};

registerComponent('ShortformThreadList', ShortformThreadList, [withList, discussionThreadsOptions], withUser, withStyles(styles, {name:"ShortformThreadList"}));
