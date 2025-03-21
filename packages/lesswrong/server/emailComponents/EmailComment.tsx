import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import groupBy from 'lodash/groupBy';
import './EmailFormatDate';
import './EmailPostAuthors';
import './EmailContentItemBody';
import filter from 'lodash/filter';
import { tagGetSubforumUrl, tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';
import { commentGetPageUrl } from '../../lib/collections/comments/helpers';
import startCase from 'lodash/startCase';
import { isFriendlyUI } from '@/themes/forumTheme';

const styles = (theme: ThemeType) => ({
  headingLink: {
    color: theme.palette.text.maxIntensity,
    textDecoration: "none",
    fontWeight: "normal",
    fontFamily: theme.typography.headerStyle.fontFamily,
    ...(isFriendlyUI ? {
      fontSize: "2.0rem",
      fontWeight: 500,
      lineHeight: '1.25em'
    } : {}),
  },
  commentHr: {
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 10
  },
});

const EmailCommentBatch = ({comments, classes}: {
  comments: Partial<DbComment>[],
  classes: ClassesType<typeof styles>,
}) => {
  const { EmailComment } = Components;
  const commentsOnPosts = filter(comments, comment => !!comment.postId)
  const commentsByPostId = groupBy(commentsOnPosts, (comment: DbComment)=>comment.postId);
  const commentsOnTags = filter(comments, comment => !!comment.tagId && comment.tagCommentType === "DISCUSSION")
  const commentsByTagId = groupBy(commentsOnTags, (comment: DbComment)=>comment.tagId);
  const commentsOnSubforums = filter(comments, comment => !!comment.tagId && comment.tagCommentType === "SUBFORUM")
  const commentsBySubforumTagId = groupBy(commentsOnSubforums, (comment: DbComment)=>comment.tagId);
  
  const commentsListComponent = (comments: Partial<DbComment>[], hideTitle?: boolean) => {
    return (
      <>
        {comments?.map((comment, idx) => (
          <div key={comment._id}>
            <EmailComment commentId={comment._id ?? ""} hideTitle={hideTitle} />
            {idx !== comments.length - 1 && <hr className={classes.commentHr} />}
          </div>
        ))}
      </>
    );
  };

  return <div>
    {Object.keys(commentsByPostId).map(postId => {
      const comments = commentsByPostId[postId];
      const allShortform = comments.every(comment => comment.shortform === true && comment.topLevelCommentId === null);

      return (
        <div key={postId}>
          <EmailCommentsOnPostHeader postId={postId} classes={classes} allShortform={allShortform} />
          {commentsListComponent(comments, true)}
        </div>
      );
    })}
    {Object.keys(commentsByTagId).map(tagId => <div key={tagId}>
      <EmailCommentsOnTagHeader tagId={tagId} isSubforum={false}  classes={classes}/>
      {commentsListComponent(commentsByTagId[tagId])}
    </div>)}
    {Object.keys(commentsBySubforumTagId).map(tagId => <div key={tagId}>
      <EmailCommentsOnTagHeader tagId={tagId} isSubforum={true}  classes={classes}/>
      {commentsListComponent(commentsBySubforumTagId[tagId])}
    </div>)}
  </div>;
}

const EmailCommentBatchComponent = registerComponent("EmailCommentBatch", EmailCommentBatch, {styles});

const HeadingLink = ({ text, href, classes }: { text: string; href: string; classes: ClassesType<typeof styles> }) => {
  return (
    <h1>
      <a href={href} className={classes.headingLink}>
        {text}
      </a>
    </h1>
  );
};

const EmailCommentsOnPostHeader = ({postId, classes, allShortform}: {postId: string, classes: ClassesType<typeof styles>, allShortform: boolean}) => {
  const { document: post } = useSingle({
    documentId: postId,
    collectionName: "Posts",
    fragmentName: "PostsList",
  });
  if (!post) return null;

  const title = allShortform ? post.title : `New comments on ${post.title}`

  return <HeadingLink text={title} href={postGetPageUrl(post, true)} classes={classes}/>
}

const EmailCommentsOnTagHeader = ({tagId, isSubforum, classes}: {tagId: string, isSubforum: boolean, classes: ClassesType<typeof styles>}) => {
  const { document: tag } = useSingle({
    documentId: tagId,
    collectionName: "Tags",
    fragmentName: "TagPreviewFragment",
  });
  if (!tag)
    return null;
  
  const props = isSubforum
    ? { text: `New comments in the ${startCase(tag.name)} subforum`, href: tagGetSubforumUrl(tag, true) }
    : { text: `New discussion comments on ${tag.name}`, href: tagGetDiscussionUrl(tag) };
  return <HeadingLink {...props} classes={classes}/>
}

const EmailComment = ({commentId, hideTitle}: {
  commentId: string,
  hideTitle?: boolean,
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
    <div>
      <a href={commentGetPageUrl(comment, true)}>
        <EmailFormatDate date={comment.postedAt}/>
      </a>
      {" by "}
      <EmailUsername user={comment.user}/>
      {" "}
      {!hideTitle && comment.post && <a href={postGetPageUrl(comment.post, true)}>
        {comment.post.title}
      </a>}
    </div>
    <EmailContentItemBody dangerouslySetInnerHTML={{ __html: comment.contents?.html }}/>
  </div>;
}

const EmailCommentComponent = registerComponent("EmailComment", EmailComment);

declare global {
  interface ComponentTypes {
    EmailCommentBatch: typeof EmailCommentBatchComponent,
    EmailComment: typeof EmailCommentComponent,
  }
}
