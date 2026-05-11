"use client";

import React from 'react';
import classNames from 'classnames';
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
    marginTop: 4,
    marginBottom: 4,
    overflow: 'hidden',
    maxWidth: 720,
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.palette.greyAlpha(0.85),
  },
  commentBodyCompact: {
    marginTop: 0,
    WebkitLineClamp: 1,
    whiteSpace: 'nowrap',
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

interface CommentSummaryContentProps {
  comment: CommentsListWithParentMetadata;
  expanded: boolean;
  compact: boolean;
}

const CommentSummaryContent = ({comment, expanded, compact}: CommentSummaryContentProps) => {
  const classes = useStyles(styles);
  const commentText = normalizeWhitespace(comment.contents?.plaintextMainText ?? '') || '(empty comment)';
  const parentTitle = comment.post?.title ?? comment.tag?.name ?? '';
  const parentUrl = getParentUrl(comment);
  // Compact + collapsed: drop the "on <parent>" line and clamp content to a
  // single line. Expanding restores the normal multi-line summary so the user
  // can see context alongside the full body in the expanded section.
  const compactCollapsed = compact && !expanded;
  return <>
    {!compactCollapsed && parentTitle && parentUrl && (
      <div className={classes.commentParent}>
        <span className={classes.commentParentPrefix}>on</span>
        <Link to={parentUrl} className={classes.commentParentLink} onClick={stopPropagation}>{parentTitle}</Link>
      </div>
    )}
    {!expanded && <div className={classNames(classes.commentBody, compactCollapsed && classes.commentBodyCompact)}>{commentText}</div>}
  </>;
};

export default CommentSummaryContent;
