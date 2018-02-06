import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Posts } from "meteor/example-forum";
import { withList, Components, registerComponent, withEdit } from 'meteor/vulcan:core';
import LWEvents from '../../lib/collections/lwevents/collection.js';

const PostsCommentsThread = ({loading,
                              terms: {postId},
                              results,
                              comments,
                              loadMoreComments,
                              totalComments,
                              commentCount,
                              loadingMoreComments,
                              editMutation,
                              post}) => {
    if (loading || !results) {
      return (
        <div className="posts-comments-thread">
          <Components.CommentsListSection
            comments={comments}
            postId={postId}
            loadMoreComments={loadMoreComments}
            totalComments={totalComments}
            commentCount={commentCount}
            loadingMoreComments={loadingMoreComments}
            postEditMutation={editMutation}
            post={post}
          />
        </div>
      )
    } else {
      const lastEvent = results && results[0]
      return (
        <div className="posts-comments-thread">
          <Components.CommentsListSection
            comments={comments}
            lastEvent={lastEvent}
            postId={postId}
            post={post}
            loadMoreComments={loadMoreComments}
            totalComments={totalComments}
            commentCount={commentCount}
            loadingMoreComments={loadingMoreComments}
            postEditMutation={editMutation}
          />
        </div>
      )
  }
}

PostsCommentsThread.displayName = 'PostsCommentsThread';

PostsCommentsThread.propTypes = {
  currentUser: PropTypes.object
};

const options = {
  collection: LWEvents,
  queryName: 'lastPostVisitQuery',
  fragmentName: 'lastEventFragment',
  limit: 1,
  totalResolver: false,
};

const withEditOptions = {
  collection: Posts,
  fragmentName: 'LWPostsPage',
};

registerComponent('PostsCommentsThread', PostsCommentsThread, [withList, options], [withEdit, withEditOptions]);
