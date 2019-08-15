import React from 'react';
import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  shortformItem: {
    marginTop: theme.spacing.unit*4
  }
})

const ShortformThreadList = ({ classes, results, loading, loadMore, networkStatus, data: {refetch} }) => {

  const { LoadMore, CommentWithReplies, ShortformSubmitForm, Loading } = Components

  if (!loading && results && !results.length) {
    return null
  }

  const loadingMore = networkStatus === 2;

  return (
    <div>
      <ShortformSubmitForm successCallback={refetch} />
      {loading || !results ? <Loading /> :
      <div>
        {results.map((comment, i) => {
          return <div key={comment._id} className={classes.shortformItem}>
            <CommentWithReplies comment={comment} refetch={refetch}/>
          </div>
        })}
        { loadMore && <LoadMore loading={loadingMore || loading} loadMore={loadMore}  /> }
        { loadingMore && <Loading />}
      </div>}
    </div>)
  }

const discussionThreadsOptions = {
  collection: Comments,
  queryName: 'ShortformThreadListQuery',
  fragmentName: 'CommentWithReplies',
  fetchPolicy: 'cache-and-network',
  enableTotal: false,
  pollInterval: 0,
  enableCache: true,
  ssr: true,
};

registerComponent('ShortformThreadList', ShortformThreadList, withStyles(styles, {name:"ShortformThreadList"}), [withList, discussionThreadsOptions], withUser);
