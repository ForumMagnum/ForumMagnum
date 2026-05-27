"use client";

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

// Outermost shell for a single feed entry; gets a subtle tint when expanded.
const styles = defineStyles('ActivityRow', (theme: ThemeType) => ({
  row: {
    position: 'relative',
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    lineHeight: 1.45,
    paddingTop: 6,
    paddingBottom: 10,
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    transition: 'background-color 120ms ease',
    '&:hover .activity-row-caret': {
      opacity: 1,
    },
  },
  rowExpanded: {
    background: theme.palette.panelBackground.default,
  },
  caret: {
    position: 'absolute',
    bottom: 26,
    left: 0,
    width: 40,
    zIndex: 0,
    textAlign: 'center',
    fontSize: 24,
    lineHeight: 1,
    color: theme.palette.greyAlpha(0.25),
    userSelect: 'none',
    cursor: 'pointer',
    opacity: 0,
    transition: 'color 120ms ease, transform 120ms ease, opacity 120ms ease',
  },
  caretExpanded: {
    transform: 'rotate(-90deg)',
    color: theme.palette.greyAlpha(0.55),
    opacity: 1,
    zIndex: 2,
  },
}));

const ActivityRow = ({expanded, compact, onToggle, children}: {expanded: boolean, compact: boolean, onToggle: () => void, children: React.ReactNode}) => {
  const classes = useStyles(styles);
  const showCaret = !compact || expanded;
  return (
    <div className={classNames(classes.row, expanded && classes.rowExpanded)}>
      {children}
      {showCaret && (
        <span
          className={classNames(classes.caret, expanded && classes.caretExpanded, 'activity-row-caret')}
          aria-hidden="true"
          onClick={onToggle}
        >›</span>
      )}
    </div>
  );
};

export default ActivityRow;
