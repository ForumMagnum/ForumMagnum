"use client";

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import UsersNameDisplay from '@/components/users/UsersNameDisplay';
import FormatDate from '@/components/common/FormatDate';
import { commentGetPageUrlFromIds } from '@/lib/collections/comments/helpers';
import { normalizeWhitespace } from './normalizeWhitespace';
import { Link } from '@/lib/reactRouterWrapper';
import { useExpandable } from './useExpandable';
import ActivityExpandedBody from './ActivityExpandedBody';

// One-line parent-comment row, styled to match the top-level ActivitySummaryRow:
// karma on the left, single-line preview text, author + date on the right.
// Clicking the row toggles an inline expansion that shows the comment body.
const styles = defineStyles('ActivityRowSingleLineComment', (theme: ThemeType) => ({
  row: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    padding: '4px 8px 4px 0',
    minWidth: 0,
    color: 'inherit',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'none',
      background: theme.palette.greyAlpha(0.03),
    },
  },
  karma: {
    flex: '0 0 32px',
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
    fontSize: 13,
    color: theme.palette.greyAlpha(0.7),
  },
  karmaPositive: {
    color: theme.palette.greyAlpha(0.95),
  },
  karmaNegative: {
    color: theme.palette.greyAlpha(0.4),
  },
  content: {
    flex: '1 1 auto',
    minWidth: 0,
    overflow: 'hidden',
  },
  meta: {
    float: 'right',
    marginLeft: 10,
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.5),
    fontVariantNumeric: 'tabular-nums',
  },
  metaSeparator: {
    color: theme.palette.greyAlpha(0.25),
  },
  author: {
    color: theme.palette.greyAlpha(0.65),
  },
  preview: {
    fontSize: 13,
    lineHeight: 1.45,
    color: theme.palette.greyAlpha(0.85),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  expandedBodyWrapper: {
    paddingTop: 4,
    paddingBottom: 10,
    // ActivityExpandedBody applies marginLeft: 42 to align past the karma column
    // when rendered below a row. Here the body lives inside the content column,
    // which is already past the karma column, so neutralize that offset.
    '& > div': {
      marginLeft: 0,
    },
  },
  expandedFooter: {
    marginTop: 10,
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: 12,
  },
  permalink: {
    color: theme.palette.primary.main,
    fontWeight: 500,
    letterSpacing: '0.01em',
    '&:hover': {
      textDecoration: 'none',
      color: theme.palette.primary.dark,
    },
  },
}));

function handleToggleKey(event: React.KeyboardEvent, onToggle: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onToggle();
}

interface ActivityRowSingleLineCommentProps {
  comment: CommentsList;
}

const ActivityRowSingleLineComment = ({comment}: ActivityRowSingleLineCommentProps) => {
  const classes = useStyles(styles);
  const { expanded, toggle } = useExpandable();
  const baseScore = comment.baseScore ?? 0;
  const karmaSignClass = baseScore > 0 ? classes.karmaPositive : baseScore < 0 ? classes.karmaNegative : undefined;
  const previewText = normalizeWhitespace(comment.contents?.plaintextMainText ?? '') || '(empty comment)';
  const commentUrl = commentGetPageUrlFromIds({
    postId: comment.postId,
    tagSlug: comment.tag?.slug,
    tagCommentType: comment.tagCommentType,
    commentId: comment._id,
  });
  return (
    <div
      className={classes.row}
      onClick={toggle}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={(e) => handleToggleKey(e, toggle)}
    >
      <span className={classNames(classes.karma, karmaSignClass)}>{baseScore}</span>
      <div className={classes.content}>
        <div className={classes.meta}>
          <span className={classes.author}><UsersNameDisplay user={comment.user} /></span>
          <span className={classes.metaSeparator}>·</span>
          <FormatDate date={comment.postedAt} />
        </div>
        {expanded ? (
          <div className={classes.expandedBodyWrapper}>
            <ActivityExpandedBody
              html={comment.contents?.html ?? ''}
              contentType="comment"
              description={`comment ${comment._id}`}
              emptyText="(empty comment)"
            />
            <div className={classes.expandedFooter}>
              <Link to={commentUrl} className={classes.permalink}>View comment →</Link>
            </div>
          </div>
        ) : (
          <div className={classes.preview}>{previewText}</div>
        )}
      </div>
    </div>
  );
};

export default ActivityRowSingleLineComment;
