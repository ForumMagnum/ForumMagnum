"use client";

import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { postGetPageUrl } from '@/lib/collections/posts/helpers';
import { normalizeWhitespace } from './normalizeWhitespace';

// Parent ("on <Post>") link + one-line excerpt of the comment text.
const styles = defineStyles('CommentSummaryContent', (theme: ThemeType) => ({
  commentParent: {
    fontSize: 13,
    lineHeight: 1.45,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  commentParentPrefix: {
    color: theme.palette.greyAlpha(0.45),
    marginRight: 4,
  },
  commentParentLink: {
    color: theme.palette.greyAlpha(0.95),
    fontWeight: 500,
    '&:hover': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
    },
  },
  commentBody: {
    marginTop: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 13,
    lineHeight: 1.45,
    color: theme.palette.greyAlpha(0.65),
  },
}));

function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation();
}

// Where does this comment live? Either a post URL or a tag-wiki URL.
function getParentUrl(comment: CommentsListWithParentMetadata): string | null {
  if (comment.post) return postGetPageUrl(comment.post);
  if (comment.tag) return `/w/${comment.tag.slug}`;
  return null;
}

const CommentSummaryContent = ({comment}: {comment: CommentsListWithParentMetadata}) => {
  const classes = useStyles(styles);
  const commentText = normalizeWhitespace(comment.contents?.plaintextMainText ?? '') || '(empty comment)';
  const parentTitle = comment.post?.title ?? comment.tag?.name ?? '';
  const parentUrl = getParentUrl(comment);
  return <>
    {parentTitle && parentUrl && (
      <div className={classes.commentParent}>
        <span className={classes.commentParentPrefix}>on</span>
        <Link to={parentUrl} className={classes.commentParentLink} onClick={stopPropagation}>{parentTitle}</Link>
      </div>
    )}
    <div className={classes.commentBody}>{commentText}</div>
  </>;
};

export default CommentSummaryContent;
