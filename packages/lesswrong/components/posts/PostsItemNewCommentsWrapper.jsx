import React from 'react';
import { withList, Components, registerComponent} from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from '../../lib/modules/utils/unflatten';

const PostsItemNewCommentsWrapper = ({ loading, results, currentUser, highlightDate, post }) => {

  if (loading || !results) {
    return <Components.Loading/>
  } else if (!loading && results && !results.length) {
    return <div>No comments found</div>
  } else {
    const nestedComments = unflattenComments(results);
    return (
      <Components.CommentsList
        currentUser={currentUser}
        comments={nestedComments}
        highlightDate={highlightDate}
        startThreadCollapsed={true}
        post={post}
      />
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
