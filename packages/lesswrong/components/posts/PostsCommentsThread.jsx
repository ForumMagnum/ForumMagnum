import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent } from 'meteor/vulcan:core';

const PostsCommentsThread =
  ({comments,
    loadMoreComments,
    totalComments,
    commentCount,
    loadingMoreComments,
    post}) =>
    {
    return <div className="posts-comments-thread">
      <Components.CommentsListSection
        comments={comments}
        postId={post._id}
        lastEvent={post.lastVisitedAt}
        loadMoreComments={loadMoreComments}
        totalComments={totalComments}
        commentCount={commentCount}
        loadingMoreComments={loadingMoreComments}
        post={post}
      />
    </div>
}

PostsCommentsThread.displayName = 'PostsCommentsThread';

PostsCommentsThread.propTypes = {
  currentUser: PropTypes.object
};

registerComponent('PostsCommentsThread', PostsCommentsThread);
