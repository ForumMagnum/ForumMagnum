import React from 'react';
import PropTypes from 'prop-types';
import { withList, Components, registerComponent} from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from '../../lib/modules/utils/unflatten';

const PostsItemNewCommentsWrapper = (props, /* context*/) => {

  const {
    loading,
    results,
    loadMore,
    networkStatus,
    currentUser,
    highlightDate,
    post,
  } = props;

  const loadingMore = networkStatus === 2;

  if (loading || !results) {
    return <div className="posts-item-new-comments-wrapper"><Components.Loading/></div>
  } else if (!loading && results && !results.length) {
    return <div>No comments found</div>
  } else {
    const nestedComments = unflattenComments(results);
    return (
      <div className="posts-item-new-comments-wrapper">
        <Components.CommentsList
          currentUser={currentUser}
          comments={nestedComments}
          highlightDate={highlightDate}
          startThreadCollapsed={true}
          post={post}
        />
        {loadMore && <Components.CommentsLoadMore loading={loadingMore || loading} loadMore={loadMore}  />}
      </div>
    );
  }
};

const options = {
  collection: Comments,
  queryName: 'PostsItemNewCommentsThreadQuery',
  fragmentName: 'CommentsList',
  limit: 5,
  // enableTotal: false,
};

registerComponent('PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapper, [withList, options]);
