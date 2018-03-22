import React from 'react';
import PropTypes from 'prop-types';
import { withList, Components, registerComponent, Utils} from 'meteor/vulcan:core';
import { Comments } from 'meteor/example-forum';


const PostsCommentsThreadWrapper = (props, /* context*/) => {

  const {loading, results, loadMore, networkStatus, totalCount, terms: {postId}, userId, post} = props;
  const loadingMore = networkStatus === 2;
  if (loading || !results) {
    return <div className="posts-comments-thread"><Components.Loading/></div>
  } else {
    const resultsClone = _.map(results, _.clone); // we don't want to modify the objects we got from props
    const nestedComments = Utils.unflatten(resultsClone, {idProperty: '_id', parentIdProperty: 'parentCommentId'});
    return (
      <div className="posts-comments-thread-wrapper">
        <Components.PostsCommentsThread
          terms={{postId: postId, userId: userId, view: "postVisits", limit: 1}}
          comments={nestedComments}
          loadMoreComments={loadMore}
          totalComments={totalCount}
          commentCount={resultsClone.length}
          loadingMoreComments={loadingMore}
          post={post}
        />
      </div>
    );
  }
};

const options = {
  collection: Comments,
  queryName: 'PostCommentsThreadQuery',
  fragmentName: 'CommentsList',
  // enableCache: true,
  // limit: 50,
  // totalResolver: false,
};

registerComponent('PostsCommentsThreadWrapper', PostsCommentsThreadWrapper, [withList, options]);
