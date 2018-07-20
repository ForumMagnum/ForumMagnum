import React from 'react';
import PropTypes from 'prop-types';
import { withList, Components, registerComponent, Utils} from 'meteor/vulcan:core';
import { Comments } from 'meteor/example-forum';


const PostsCommentsThread = (props) => {
  const {loading, results, loadMore, networkStatus, totalCount, post} = props;
  const loadingMore = networkStatus === 2;
  if (loading || !results) {
    return <div className="posts-comments-thread"><Components.Loading/></div>
  } else {
    const resultsClone = _.map(results, _.clone); // we don't want to modify the objects we got from props
    const nestedComments = Utils.unflatten(resultsClone, {idProperty: '_id', parentIdProperty: 'parentCommentId'});
    return (
        <Components.CommentsListSection
          comments={nestedComments}
          postId={post._id}
          lastEvent={post.lastVisitedAt}
          loadMoreComments={loadMore}
          totalComments={totalCount}
          commentCount={resultsClone.length}
          loadingMoreComments={loadingMore}
          post={post}
        />
    );
  }
};

const options = {
  collection: Comments,
  queryName: 'PostCommentsThreadQuery',
  fragmentName: 'CommentsList',
  // enableCache: true,
  totalResolver: true,
};

registerComponent('PostsCommentsThread', PostsCommentsThread, [withList, options]);
