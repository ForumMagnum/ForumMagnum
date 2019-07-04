import React from 'react';
import { Components, registerComponent, withList, Loading } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import withUser from '../common/withUser';

const ShortformThreadList = ({ 
  results, loading, loadMore, networkStatus, currentUser,
}) => {
  const loadingMore = networkStatus === 2;

  const { LoadMore, ShortformThread } = Components

  if (!loading && results && !results.length) {
    return null
  }

  const limit = (currentUser && currentUser.isAdmin) ? 4 : 3

  return (
    <div>
        {loading || !results ? <Loading /> :
        <div> 
          {results.map((post, i) =>
            <ShortformThread
              key={post._id}
              post={post}
              postCount={i}
              terms={{view:"postCommentsUnread", postId:post._id, limit}}
              currentUser={currentUser}
            />
          )}
          { loadMore && <LoadMore loading={loadingMore || loading} loadMore={loadMore}  /> }
          { loadingMore && <Loading />}
        </div>}
    </div>)
  }

const discussionThreadsOptions = {
  collection: Posts,
  queryName: 'selectCommentsListQuery',
  fragmentName: 'PostsList',
  enableTotal: false,
  pollInterval: 0,
  enableCache: true,
};

registerComponent('ShortformThreadList', ShortformThreadList, [withList, discussionThreadsOptions], withUser);
