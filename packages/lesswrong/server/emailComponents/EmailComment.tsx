import React from 'react';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import groupBy from 'lodash/groupBy';
import filter from 'lodash/filter';
import { tagGetSubforumUrl, tagGetDiscussionUrl } from '../../lib/collections/tags/helpers';
import { commentGetPageUrl } from '../../lib/collections/comments/helpers';
import startCase from 'lodash/startCase';
import { isFriendlyUI } from '@/themes/forumTheme';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { EmailFormatDate } from './EmailFormatDate';
import { EmailUsername } from './EmailUsername';
import { EmailContentItemBody } from './EmailContentItemBody';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import { maybeDate } from '@/lib/utils/dateUtils';

const CommentsListWithParentMetadataQuery = gql(`
  query EmailComment2($documentId: String) {
    comment(input: { selector: { documentId: $documentId } }) {
      result {
        ...CommentsListWithParentMetadata
      }
    }
  }
`);

const TagPreviewFragmentQuery = gql(`
  query EmailComment1($documentId: String) {
    tag(input: { selector: { documentId: $documentId } }) {
      result {
        ...TagPreviewFragment
      }
    }
  }
`);

const PostsListQuery = gql(`
  query EmailComment($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsList
      }
    }
  }
`);

const styles = defineStyles("EmailComment", (theme: ThemeType) => ({
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
}));

export const EmailCommentBatch = ({comments}: {
  comments: Partial<DbComment>[],
}) => {
  const classes = useStyles(styles);
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
          <EmailCommentsOnPostHeader postId={postId} allShortform={allShortform} />
          {commentsListComponent(comments, true)}
        </div>
      );
    })}
    {Object.keys(commentsByTagId).map(tagId => <div key={tagId}>
      <EmailCommentsOnTagHeader tagId={tagId} isSubforum={false}/>
      {commentsListComponent(commentsByTagId[tagId])}
    </div>)}
    {Object.keys(commentsBySubforumTagId).map(tagId => <div key={tagId}>
      <EmailCommentsOnTagHeader tagId={tagId} isSubforum={true}/>
      {commentsListComponent(commentsBySubforumTagId[tagId])}
    </div>)}
  </div>;
}

const HeadingLink = ({ text, href }: { text: string; href: string; }) => {
  const classes = useStyles(styles);
  return (
    <h1>
      <a href={href} className={classes.headingLink}>
        {text}
      </a>
    </h1>
  );
};

const EmailCommentsOnPostHeader = ({postId, allShortform}: {postId: string, allShortform: boolean}) => {
  const { data } = useQuery(PostsListQuery, {
    variables: { documentId: postId },
  });
  const post = data?.post?.result;
  if (!post) return null;

  const title = allShortform ? post.title : `New comments on ${post.title}`

  return <HeadingLink text={title} href={postGetPageUrl(post, true)}/>
}

const EmailCommentsOnTagHeader = ({tagId, isSubforum}: {tagId: string, isSubforum: boolean}) => {
  const { data } = useQuery(TagPreviewFragmentQuery, {
    variables: { documentId: tagId },
  });
  const tag = data?.tag?.result;
  if (!tag)
    return null;
  
  const props = isSubforum
    ? { text: `New comments in the ${startCase(tag.name)} subforum`, href: tagGetSubforumUrl(tag, true) }
    : { text: `New discussion comments on ${tag.name}`, href: tagGetDiscussionUrl(tag) };
  return <HeadingLink {...props}/>
}

export const EmailComment = ({commentId, hideTitle}: {
  commentId: string,
  hideTitle?: boolean,
}) => {
  const { loading, error, data } = useQuery(CommentsListWithParentMetadataQuery, {
    variables: { documentId: commentId },
  });
  const comment = data?.comment?.result;
  
  if (loading) return null;
  if (error) {
    throw error;
  } else if (!comment) {
    throw new Error(`Could not load comment ${commentId} for notification`);
  }
  
  return <div>
    <div>
      <a href={commentGetPageUrl(comment, true)}>
        <EmailFormatDate date={maybeDate(comment.postedAt)}/>
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
