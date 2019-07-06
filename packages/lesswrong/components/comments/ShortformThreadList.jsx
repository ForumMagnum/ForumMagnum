import React from 'react';
import { Components, registerComponent, withList, Loading } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import withUser from '../common/withUser';

const ShortformThreadList = ({ results, loading, loadMore, networkStatus, currentUser }) => {

  const { LoadMore, ShortformThread } = Components

  if (!loading && results && !results.length) {
    return null
  }

  const loadingMore = networkStatus === 2;

  return (
    <div>
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

registerComponent('ShortformThreadList', ShortformThreadList, [withList, discussionThreadsOptions], withUser);
