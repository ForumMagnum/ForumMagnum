"use client";

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import UsersNameDisplay from '@/components/users/UsersNameDisplay';
import FormatDate from '@/components/common/FormatDate';
import { JustifyIcon } from '@/components/lexical/icons/JustifyIcon';

// The clickable headline row. Karma on the left, type-specific content in the
// middle, author/date on the right, and a caret indicating expand state.
const styles = defineStyles('ActivitySummaryRow', (theme: ThemeType) => ({
  summary: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    padding: '6px 8px 6px 0',
    minWidth: 0,
    cursor: 'pointer',
    '&:hover .activity-row-caret': {
      color: theme.palette.greyAlpha(0.55),
    },
  },
  karmaWrap: {
    flex: '0 0 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  karma: {
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
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 1,
    fontSize: 12,
    color: theme.palette.greyAlpha(0.5),
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1.4,
  },
  metaPost: {
    marginTop: 8,
  },
  metaPrimary: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
  },
  metaSeparator: {
    color: theme.palette.greyAlpha(0.25),
  },
  author: {
    color: theme.palette.greyAlpha(0.65),
  },
  metaContext: {
    fontSize: 11,
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: theme.palette.greyAlpha(0.4),
  },
  metaContextLink: {
    color: 'inherit',
    '&:hover': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
    },
  },
  caret: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 1,
    color: theme.palette.greyAlpha(0.25),
    userSelect: 'none',
    opacity: 0,
    transition: 'color 120ms ease, transform 120ms ease, opacity 120ms ease',
  },
  caretExpanded: {
    transform: 'rotate(-90deg)',
    color: theme.palette.greyAlpha(0.55),
  },
}));

function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation();
}

// Treat Enter/Space like a click for keyboard accessibility.
function handleToggleKey(event: React.KeyboardEvent, onToggle: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  onToggle();
}

interface ActivitySummaryRowProps {
  baseScore: number;
  user: UsersMinimumInfo | null | undefined;
  postedAt: Date;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isPost?: boolean;
}

const ActivitySummaryRow = ({baseScore, user, postedAt, expanded, onToggle, children, isPost}: ActivitySummaryRowProps) => {
  const classes = useStyles(styles);
  const karmaSignClass = baseScore > 0 ? classes.karmaPositive : baseScore < 0 ? classes.karmaNegative : undefined;
  return (
    <div
      className={classes.summary}
      onClick={onToggle}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={(e) => handleToggleKey(e, onToggle)}
    >
      <div className={classes.karmaWrap}>
        <span className={classNames(classes.karma, karmaSignClass)}>{baseScore}</span>
        <span className={classNames(classes.caret, expanded && classes.caretExpanded, 'activity-row-caret')} aria-hidden="true">›</span>
      </div>
      <div className={classes.content}>
        <div className={classNames(classes.meta, isPost && classes.metaPost)} onClick={stopPropagation}>
          <div className={classes.metaPrimary}>
            <span className={classes.author}><UsersNameDisplay user={user} /></span>
            <span className={classes.metaSeparator}>·</span>
            <FormatDate date={postedAt} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default ActivitySummaryRow;
