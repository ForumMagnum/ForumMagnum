import React, { Component } from 'react';
import { Components, registerComponent, withList, withCurrentUser, Loading, withEdit } from 'meteor/vulcan:core';
import { Comments } from 'meteor/example-forum';

const RecentComments = ({results, currentUser, loading, fontSize, loadMore, networkStatus, editMutation}) => {
  const loadingMore = networkStatus === 2;
  if (!loading && results && !results.length) {
    return (<div>No comments found</div>)
  }
  return (
    <div>
      <div className="comments-list recent-comments-list">
        {loading || !results ? <Loading /> :
        <div className={"comments-items" + (fontSize == "small" ? " smalltext" : "")}>
          {results.map(comment =>
            <div key={comment._id}>
              <Components.RecentCommentsItem
                showTitle={true}
                currentUser={currentUser}
                comment={comment}
                editMutation={editMutation}/>
            </div>
          )}
          {loadMore && <Components.CommentsLoadMore loading={loadingMore || loading} loadMore={loadMore}  />}
        </div>}
      </div>
    </div>)
  }

const commentsOptions = {
  collection: Comments,
  queryName: 'selectCommentsListQuery',
  fragmentName: 'SelectCommentsList',
  totalResolver: false,
  pollInterval: 0,
  enableCache: true,
};

const withEditOptions = {
  collection: Comments,
  fragmentName: 'SelectCommentsList',
};

registerComponent('RecentComments', RecentComments, [withList, commentsOptions], [withEdit, withEditOptions], withCurrentUser);
