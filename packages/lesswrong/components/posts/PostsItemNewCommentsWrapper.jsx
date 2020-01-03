import React from 'react';
import { withList, Components, registerComponent} from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from '../../lib/modules/utils/unflatten';

const PostsItemNewCommentsWrapper = ({ loading, results, currentUser, highlightDate, post, condensed, hideReadComments, markAsRead, forceSingleLine, hideSingleLineDate, hideSingleLineMeta }) => {

  const { Loading, CommentsList, NoContent } = Components

  if (!loading && results && !results.length) {
    return <NoContent>No comments found</NoContent>
  } else {
    const lastCommentId = results && results[0]?._id
    const nestedComments = unflattenComments(results);
    return (
      <div>
        <CommentsList
          currentUser={currentUser}
          comments={nestedComments}
          highlightDate={highlightDate}
          startThreadTruncated={true}
          post={post}
          lastCommentId={lastCommentId}
          condensed={condensed}
          forceSingleLine={forceSingleLine}
          hideSingleLineDate={hideSingleLineDate}
          hideReadComments={hideReadComments}
          hideSingleLineMeta={hideSingleLineMeta}
          markAsRead={markAsRead}
        />
        {loading && <Loading/>}
      </div>
    );
  }
};

const options = {
  collection: Comments,
  queryName: 'PostsItemNewCommentsThreadQuery',
  fragmentName: 'CommentsList',
  fetchPolicy: 'cache-and-network',
  limit: 5,
  // enableTotal: false,
};

registerComponent('PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapper, [withList, options]);
// withStyles(styles, {name:"PostsItemNewCommentsWrapper"})
