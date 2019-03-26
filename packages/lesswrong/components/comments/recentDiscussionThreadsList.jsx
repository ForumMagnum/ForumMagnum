import React from 'react';
import { Components, registerComponent, withList, Loading, withEdit } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments'
import withUser from '../common/withUser';

const RecentDiscussionThreadsList = ({
  classes,
  results,
  loading,
  loadMore,
  networkStatus,
  editMutation,
  currentUser,
  threadView = "recentDiscussionThread"
}) => {
  const loadingMore = networkStatus === 2;

  const { LoadMore } = Components

  if (!loading && results && !results.length) {
    return null
  }

  return (
    <div>
        {loading || !results ? <Loading /> :
        <div>
          {results.map((post, i) =>
            <Components.RecentDiscussionThread
              key={post._id}
              post={post}
              postCount={i}
              terms={{view:threadView, postId:post._id}}
              currentUser={currentUser}
              editMutation={editMutation}/>

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

const withEditOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
};

registerComponent('RecentDiscussionThreadsList', RecentDiscussionThreadsList, [withList, discussionThreadsOptions], [withEdit, withEditOptions], withUser);
