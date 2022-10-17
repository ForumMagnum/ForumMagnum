import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import groupBy from 'lodash/groupBy';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import filter from 'lodash/filter';
import { tagGetUrl, tagGetSubforumUrl } from '../../lib/collections/tags/helpers';
import { commentGetPageUrl } from '../../lib/collections/comments/helpers';
import startCase from 'lodash/startCase';

const styles = (theme: ThemeType): JssStyles => ({
  comment: {
  },
});

const EmailCommentBatch = ({comments}:{comments: DbComment[]}) => {
  const { EmailComment, EmailCommentsOnPostHeader } = Components;
  const commentsOnPosts = filter(comments, comment => !!comment.postId)
  const commentsByPostId = groupBy(commentsOnPosts, (comment:DbComment)=>comment.postId);
  const commentsOnTags = filter(comments, comment => !!comment.tagId && comment.tagCommentType === "DISCUSSION")
  const commentsByTagId = groupBy(commentsOnTags, (comment:DbComment)=>comment.tagId);
  const commentsOnSubforums = filter(comments, comment => !!comment.tagId && comment.tagCommentType === "SUBFORUM")
  const commentsBySubforumTagId = groupBy(commentsOnSubforums, (comment:DbComment)=>comment.tagId);
  
  return <div>
    {Object.keys(commentsByPostId).map(postId => <div key={postId}>
      <EmailCommentsOnPostHeader postId={postId}/>
      {commentsByPostId[postId]?.map(comment =>
        <EmailComment key={comment._id} commentId={comment._id}/>)}
    </div>)}
    {Object.keys(commentsByTagId).map(tagId => <div key={tagId}>
      <EmailCommentsOnTagHeader tagId={tagId} isSubforum={false}/>
      {commentsByTagId[tagId]?.map(comment =>
        <EmailComment key={comment._id} commentId={comment._id}/>)}
    </div>)}
    {Object.keys(commentsBySubforumTagId).map(tagId => <div key={tagId}>
      <EmailCommentsOnTagHeader tagId={tagId} isSubforum={true}/>
      {commentsBySubforumTagId[tagId]?.map(comment =>
        <EmailComment key={comment._id} commentId={comment._id}/>)}
    </div>)}
  </div>;
}

const EmailCommentBatchComponent = registerComponent("EmailCommentBatch", EmailCommentBatch, {styles});

const EmailCommentsOnPostHeader = ({postId}: {postId: string}) => {
  const { document: post } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsList",
  });
  if (!post)
    return null;
  
  return <div>
    New comments on <a href={postGetPageUrl(post, true)}>{post.title}</a>
  </div>;
}

const EmailCommentsOnTagHeader = ({tagId, isSubforum}: {tagId: string, isSubforum: boolean}) => {
  const { document: tag } = useSingle({
    documentId: tagId,
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
  });
  if (!tag)
    return null;
  
  return isSubforum ? (
    <div>
      New comments in <a href={tagGetSubforumUrl(tag, true)}>{`${startCase(tag.name)} Subforum`}</a>
    </div>
  ) : (
    <div>
      New comments on <a href={tagGetUrl(tag)}>{tag.name}</a>
    </div>
  );
}

const EmailCommentsOnPostHeaderComponent = registerComponent("EmailCommentsOnPostHeader", EmailCommentsOnPostHeader);

const EmailComment = ({commentId, classes}: {
  commentId: string,
  classes: ClassesType,
}) => {
  const { EmailUsername, EmailFormatDate, EmailContentItemBody } = Components;
  const { document: comment, loading, error } = useSingle({
    documentId: commentId,
    collectionName: "Comments",
    fragmentName: "CommentsListWithParentMetadata",
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
      <a href={commentGetPageUrl(comment, true)}>
        <EmailFormatDate date={comment.postedAt}/>
      </a>
      {" "}
      {comment.post && <a href={postGetPageUrl(comment.post, true)}>
        {comment.post.title}
      </a>}
    </div>
    <EmailContentItemBody dangerouslySetInnerHTML={{ __html: comment.contents?.html }}/>
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
