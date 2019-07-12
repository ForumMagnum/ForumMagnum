import React from 'react';
import { Components, registerComponent, withList, withEdit } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import withUser from '../common/withUser';

const RecentComments = ({results, currentUser, loading, loadMore, networkStatus, updateComment}) => {
  const loadingMore = networkStatus === 2;
  if (!loading && results && !results.length) {
    return (<div>No comments found</div>)
  }
  if (loading || !results) {
    return <Components.Loading />
  }
  
  return (
    <div className="recent-comments-list">
      {results.map(comment =>
        <div key={comment._id}>
          <Components.CommentsNode
            currentUser={currentUser}
            comment={comment}
            post={comment.post}
            updateComment={updateComment}
            showPostTitle
          />
        </div>
      )}
      {loadMore && <Components.LoadMore loading={loadingMore || loading} loadMore={loadMore}  />}
    </div>
  )
}

registerComponent('RecentComments', RecentComments,
  [withList, {
    collection: Comments,
    queryName: 'selectCommentsListQuery',
    fragmentName: 'SelectCommentsList',
    enableTotal: false,
    pollInterval: 0,
    enableCache: true,
  }],
  [withEdit, {
    collection: Comments,
    fragmentName: 'SelectCommentsList',
  }],
  withUser
);
