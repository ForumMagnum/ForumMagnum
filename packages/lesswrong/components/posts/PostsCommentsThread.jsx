import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from "../../lib/utils/unflatten";

const PostsCommentsThread = ({
  post, terms, newForm=true
}) => {
  const { loading, results, loadMore, loadingMore, totalCount } = useMulti({
    terms,
    collection: Comments,
    queryName: 'PostCommentsThreadQuery',
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    enableTotal: true,
  });
  
  if (loading && !results) {
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
        newForm={newForm}
      />
    );
  }
}

registerComponent('PostsCommentsThread', PostsCommentsThread);
