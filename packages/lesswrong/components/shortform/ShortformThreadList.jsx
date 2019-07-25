import React from 'react';
import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  title: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    color: theme.palette.grey[600]
  }
})

const ShortformThreadList = ({ classes, results, loading, loadMore, networkStatus, currentUser, data: {refetch} }) => {

  const { LoadMore, ShortformThread, CommentsNewForm, Loading } = Components

  if (!loading && results && !results.length) {
    return null
  }

  const loadingMore = networkStatus === 2;
  const shortformFeedId = currentUser?.shortformFeedId

  return (
    <div>
        <CommentsNewForm 
          post={{_id:shortformFeedId}} 
          prefilledProps={{shortform: true}}
          mutationFragment={"ShortformCommentsList"}
          successCallback={() => refetch()}
          type="comment" 
        />
        {loading || !results ? <Loading /> :
        <div> 
          {results.map((comment, i) => {
            return <ShortformThread key={comment._id} comment={comment} refetch={refetch}/>
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
