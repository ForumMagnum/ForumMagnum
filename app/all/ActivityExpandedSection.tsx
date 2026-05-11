"use client";

import React from 'react';
import { Link } from '@/lib/reactRouterWrapper';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

// The drawer-style body that appears below a row when it's expanded.
// Body content is rendered by the caller; this owns the layout and permalink.
const styles = defineStyles('ActivityExpandedSection', (theme: ThemeType) => ({
  expandedSection: {
    // Align horizontally with the summary row above: the title sits ~4px from
    // the row's left edge (caret pulled left with negative margin), and the
    // summary uses 8px of right padding.
    paddingLeft: 4,
    paddingRight: 8,
    paddingTop: 4,
    paddingBottom: 14,
  },
  expandedFooter: {
    marginTop: 10,
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 12,
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

function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation();
}

interface ActivityExpandedSectionProps {
  permalinkUrl: string;
  permalinkLabel: string;
  children: React.ReactNode;
}

const ActivityExpandedSection = ({permalinkUrl, permalinkLabel, children}: ActivityExpandedSectionProps) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.expandedSection} onClick={stopPropagation}>
      {children}
      <div className={classes.expandedFooter}>
        <Link to={permalinkUrl} className={classes.permalink}>{permalinkLabel}</Link>
      </div>
    </div>
  );
};

export default ActivityExpandedSection;
