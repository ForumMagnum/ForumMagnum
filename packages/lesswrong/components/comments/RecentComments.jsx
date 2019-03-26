import React from 'react';
import { Components, registerComponent, withList, Loading, withEdit } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import withUser from '../common/withUser';

const RecentComments = ({results, currentUser, loading, loadMore, networkStatus, editMutation}) => {
  const loadingMore = networkStatus === 2;
  if (!loading && results && !results.length) {
    return (<div>No comments found</div>)
  }
  return (
    <div>
      <div className="comments-list recent-comments-list">
        {loading || !results ? <Loading /> :
        <div className={"comments-items"}>
          {results.map(comment =>
            <div key={comment._id}>
              <Components.CommentsNode
                currentUser={currentUser}
                comment={comment}
                post={comment.post}
                editMutation={editMutation}
                showPostTitle
              />
            </div>
          )}
          {loadMore && <Components.LoadMore loading={loadingMore || loading} loadMore={loadMore}  />}
        </div>}
      </div>
    </div>)
  }

const commentsOptions = {
  collection: Comments,
  queryName: 'selectCommentsListQuery',
  fragmentName: 'SelectCommentsList',
  enableTotal: false,
  pollInterval: 0,
  enableCache: true,
};

const withEditOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
};

registerComponent('RecentComments', RecentComments, [withList, commentsOptions], [withEdit, withEditOptions], withUser);
