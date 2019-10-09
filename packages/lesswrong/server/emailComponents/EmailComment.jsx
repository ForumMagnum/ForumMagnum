import React from 'react';
import { Comments } from '../../lib/collections/comments';
import { withStyles } from '@material-ui/core/styles';
import { Components, registerComponent, useSingle } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts/collection.js';
import keyBy from 'lodash/keyBy';
import './EmailFormatDate.jsx';
import './EmailPostAuthors.jsx';
import './EmailContentItemBody.jsx';

const styles = theme => ({
  comment: {
  },
});

const EmailCommentBatch = ({comments, classes}) => {
  const { EmailComment, EmailCommentsOnPostHeader } = Components;
  const commentsByPostId = keyBy(comments, comment=>comment.postId);
  
  return <div>
    {_.keys(commentsByPostId).map(postId => <div key={postId}>
      <EmailCommentsOnPostHeader postId={postId}/>
      {commentsByPostId[postId].map(notification =>
        <EmailComment key={notification._id} commentId={notification.documentId}/>)}
    </div>)}
  </div>;
}

registerComponent("EmailCommentBatch", EmailCommentBatch,
  withStyles(styles, {name: "EmailCommentBatch"})
);

const EmailCommentsOnPostHeader = ({postId}) => {
  const { document: post } = useSingle({
    documentId: postId,
    collection: Posts,
    fragmentName: "PostsList",
  });
  if (!post)
    return null;
  
  return <div>
    New comments on <a href={Posts.getPageUrl(post, true)}>{post.title}</a>
  </div>;
}

registerComponent("EmailCommentsOnPostHeader", EmailCommentsOnPostHeader);

const EmailComment = ({commentId, classes}) => {
  const { EmailUsername, EmailFormatDate, EmailContentItemBody } = Components;
  const { document: comment, loading, error } = useSingle({
    documentId: commentId,
    
    collection: Comments,
    fragmentName: "SelectCommentsList",
  });
  
  if (loading) return null;
  if (error) {
    throw error;
  } else if (!comment) {
    throw new Error(`Could not load comment ${commentId} for notification`);
  }
  
  return <div>
    <div className={classes.comment}>
      <EmailUsername user={comment.user}/>
      {" "}
      <a href={Comments.getPageUrl(comment, true)}>
        <EmailFormatDate date={comment.postedAt}/>
      </a>
      {" "}
      <a href={Posts.getPageUrl(comment.post, true)}>
        {comment.post.title}
      </a>
    </div>
    <EmailContentItemBody dangerouslySetInnerHTML={{ __html: comment.contents.html }}/>
  </div>;
}

registerComponent("EmailComment", EmailComment,
  withStyles(styles, {name: "EmailComment"})
);
