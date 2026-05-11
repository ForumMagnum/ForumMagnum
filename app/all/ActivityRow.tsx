"use client";

import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

// Outermost shell for a single feed entry; gets a subtle tint when expanded.
const styles = defineStyles('ActivityRow', (theme: ThemeType) => ({
  row: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    lineHeight: 1.45,
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
    transition: 'background-color 120ms ease',
  },
  rowExpanded: {
    background: theme.palette.greyAlpha(0.025),
  },
}));

const ActivityRow = ({expanded, children}: {expanded: boolean, children: React.ReactNode}) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.row, expanded && classes.rowExpanded)}>{children}</div>;
};

export default ActivityRow;
