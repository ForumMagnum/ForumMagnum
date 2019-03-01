import React, { PureComponent } from 'react';
import { withList, Components, registerComponent } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from "../../lib/modules/utils/unflatten";

class PostsCommentsThread extends PureComponent {
  render() {
    const {loading, results, loadMore, networkStatus, totalCount, post} = this.props;
    const loadingMore = networkStatus === 2;
    if (loading) {
      return <Components.Loading/>
    } else {
      const nestedComments = unflattenComments(results);
      return (
          <Components.CommentsListSection
            comments={nestedComments}
            postId={post._id}
            lastEvent={post.lastVisitedAt}
            loadMoreComments={loadMore}
            totalComments={totalCount}
            commentCount={(results && results.length) || 0}
            loadingMoreComments={loadingMore}
            post={post}
          />
      );
    }
  }
}

const options = {
  collection: Comments,
  queryName: 'PostCommentsThreadQuery',
  fragmentName: 'CommentsList',
  // enableCache: true,
  enableTotal: true,
};

registerComponent('PostsCommentsThread', PostsCommentsThread, [withList, options]);
