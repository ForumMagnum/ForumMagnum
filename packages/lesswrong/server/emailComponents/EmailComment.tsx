import React from 'react';
import { Comments } from '../../lib/collections/comments';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { Posts } from '../../lib/collections/posts/collection';
import groupBy from 'lodash/groupBy';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import * as _ from 'underscore';

const styles = theme => ({
  comment: {
  },
});

const EmailCommentBatch = ({comments}:{comments: DbComment[]}) => {
  const { EmailComment, EmailCommentsOnPostHeader } = Components;
  const commentsByPostId = groupBy(comments, comment=>comment.postId);
  
  return <div>
    {_.keys(commentsByPostId).map(postId => <div key={postId}>
      <EmailCommentsOnPostHeader postId={postId}/>
      {commentsByPostId[postId]?.map(comment =>
        <EmailComment key={comment._id} commentId={comment._id}/>)}
    </div>)}
  </div>;
}

const EmailCommentBatchComponent = registerComponent("EmailCommentBatch", EmailCommentBatch, {styles});

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

const EmailCommentsOnPostHeaderComponent = registerComponent("EmailCommentsOnPostHeader", EmailCommentsOnPostHeader);

const EmailComment = ({commentId, classes}) => {
  const { EmailUsername, EmailFormatDate, EmailContentItemBody } = Components;
  const { document: comment, loading, error } = useSingle({
    documentId: commentId,
    
    collection: Comments,
    fragmentName: "CommentsListWithPostMetadata",
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

const EmailCommentComponent = registerComponent("EmailComment", EmailComment, {styles});

declare global {
  interface ComponentTypes {
    EmailCommentBatch: typeof EmailCommentBatchComponent,
    EmailCommentsOnPostHeader: typeof EmailCommentsOnPostHeaderComponent,
    EmailComment: typeof EmailCommentComponent,
  }
}
