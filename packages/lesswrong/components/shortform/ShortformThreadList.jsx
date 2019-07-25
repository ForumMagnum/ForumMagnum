import React from 'react';
import { Components, registerComponent, withList, Loading } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import withUser from '../common/withUser';
import { withRouter } from '../../lib/reactRouterWrapper.js';

const ShortformThreadList = ({ results, loading, loadMore, networkStatus, data: {refetch} }) => {

  const { LoadMore, ShortformThread, ShortformSubmitForm } = Components

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

registerComponent('ShortformThreadList', ShortformThreadList, [withList, discussionThreadsOptions], withUser, withRouter);
