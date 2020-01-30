import React from 'react';
import { Components, registerComponent} from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import { Comments } from '../../lib/collections/comments';
import { unflattenComments } from '../../lib/utils/unflatten';

const styles = theme => ({
  title: {
    fontSize: 10,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    marginBottom: 4
  }
})

const PostsItemNewCommentsWrapper = ({ terms, classes, title, highlightDate, post, condensed, hideReadComments, markAsRead, forceSingleLine, hideSingleLineMeta }: {
  terms: any,
  classes: any,
  title?: string,
  highlightDate: Date,
  post: any,
  condensed: boolean,
  hideReadComments?: boolean,
  markAsRead: any,
  forceSingleLine?: any,
  hideSingleLineMeta?: boolean,
}) => {
  const { loading, results } = useMulti({
    terms,
    collection: Comments,
    fragmentName: 'CommentsList',
    fetchPolicy: 'cache-and-network',
    limit: 5,
  });
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
          comments={nestedComments}
          highlightDate={highlightDate}
          startThreadTruncated={true}
          post={post}
          lastCommentId={lastCommentId}
          condensed={condensed}
          forceSingleLine={forceSingleLine}
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
  }
);

declare global {
  interface ComponentTypes {
    PostsItemNewCommentsWrapper: typeof PostsItemNewCommentsWrapperComponent
  }
}

