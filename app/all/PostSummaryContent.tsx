"use client";

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { normalizeWhitespace } from './normalizeWhitespace';

// Title + excerpt shown in the middle of a post row. The title is the
// "emphasis" element that recolors on row hover (via .activity-row-emphasis).
const styles = defineStyles('PostSummaryContent', (theme: ThemeType) => ({
  singleLine: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  postTitle: {
    fontFamily: theme.typography.postStyle.fontFamily,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: 1.3,
    color: theme.palette.greyAlpha(0.9),
    transition: 'font-size 220ms ease, line-height 220ms ease, color 120ms ease',
  },
  postTitleExpanded: {
    // Sized between display1 (24px) and display2 (36.4px) so the expanded title
    // reads as the section's headline without dwarfing the post body underneath.
    fontSize: 28,
    lineHeight: 1.2,
    whiteSpace: 'normal',
    overflow: 'visible',
    textOverflow: 'clip',
  },
  postExcerpt: {
    marginTop: 1,
    fontSize: 14,
    lineHeight: 1.6,
    color: theme.palette.greyAlpha(0.55),
    maxHeight: 45,
    opacity: 1,
    overflow: 'hidden',
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    transition: 'max-height 220ms ease, opacity 180ms ease, margin-top 220ms ease',
  },
  postExcerptHidden: {
    maxHeight: 0,
    opacity: 0,
    marginTop: 0,
  },
  emptyExcerpt: {
    color: theme.palette.greyAlpha(0.3),
    fontStyle: 'italic',
  },
}));

const PostSummaryContent = ({post, expanded, compact}: {post: PostsList, expanded: boolean, compact: boolean}) => {
  const classes = useStyles(styles);
  const title = post.title || '(untitled)';
  const excerpt = normalizeWhitespace(post.contents?.plaintextDescription ?? '');
  // Hide excerpt when expanded (title takes over) or when compact mode is on.
  const hideExcerpt = expanded || compact;
  return <>
    <div className={classNames(classes.postTitle, !expanded && classes.singleLine, expanded && classes.postTitleExpanded, 'activity-row-emphasis')}>{title}</div>
    <div className={classNames(classes.postExcerpt, !excerpt && classes.emptyExcerpt, hideExcerpt && classes.postExcerptHidden)}>
      {excerpt || 'No preview available'}
    </div>
  </>;
};

export default PostSummaryContent;
