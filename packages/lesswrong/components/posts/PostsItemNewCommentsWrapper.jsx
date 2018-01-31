import React from 'react';
import PropTypes from 'prop-types';
import { withList, Components, registerComponent, Utils} from 'meteor/vulcan:core';
import { Comments } from 'meteor/example-forum';
import { unflatten } from '../../lib/modules/utils/unflatten';

const PostsItemNewCommentsWrapper = (props, /* context*/) => {

  const {
    loading,
    results,
    loadMore,
    networkStatus,
    totalCount,
    currentUser,
    post,
    postId,
    terms,
  } = props;

  const loadingMore = networkStatus === 2;

  if (loading || !results) {
    return <div className="posts-item-new-comments-wrapper"><Components.Loading/></div>
  } else if (!loading && results && !results.length) {
    return <div>No comments found</div>
  } else {
    const resultsClone = _.map(results, _.clone); // we don't want to modify the objects we got from props
    const nestedComments = unflatten(resultsClone, {idProperty: '_id', parentIdProperty: 'parentCommentId'});
    resultsClone.forEach((comment)=> {

    })
    return (
      <div className="posts-item-new-comments-wrapper">
        <Components.CommentsList
          currentUser={currentUser}
          comments={nestedComments}
          highlightDate={post.lastVisitedAt}
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
  // totalResolver: false,
};

registerComponent('PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapper, [withList, options]);
