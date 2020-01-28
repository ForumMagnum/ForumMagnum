import React from 'react';
import { Components, registerComponent} from 'meteor/vulcan:core';
import { withMulti } from '../../lib/crud/withMulti';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from '../../lib/utils/unflatten';
import { createStyles } from '@material-ui/core/styles';

const styles = createStyles(theme => ({
  title: {
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginBottom: 4
  }
}))

const PostsItemNewCommentsWrapper = ({ classes, title, loading, results, currentUser, highlightDate, post, condensed, hideReadComments, markAsRead, forceSingleLine, hideSingleLineDate, hideSingleLineMeta }) => {

  const { Loading, CommentsList, NoContent } = Components  

  if (!loading && results && !results.length) {
    return <NoContent>No comments found</NoContent>
  } 
  
  else {
    const lastCommentId = results && results[0]?._id
    const nestedComments = unflattenComments(results);
    return (
      <div>
        {title && <div className={classes.title}>{title}</div>}
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

const PostsItemNewCommentsWrapperComponent = registerComponent(
  'PostsItemNewCommentsWrapper', PostsItemNewCommentsWrapper, {
    styles,
    hocs: [
      withMulti({
        collection: Comments,
        fragmentName: 'CommentsList',
        fetchPolicy: 'cache-and-network',
        limit: 5,
        // enableTotal: false,
      }),
    ]
  }
);

declare global {
  interface ComponentTypes {
    PostsItemNewCommentsWrapper: typeof PostsItemNewCommentsWrapperComponent
  }
}

