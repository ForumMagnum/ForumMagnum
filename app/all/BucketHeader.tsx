"use client";

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

// The bucket label strip. Range/count slots are intentionally unused for now
// but the layout reserves space for them.
const styles = defineStyles('BucketHeader', (theme: ThemeType) => ({
  header: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.08)}`,
  },
  label: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: theme.palette.greyAlpha(0.78),
  },
  range: {
    fontSize: 12,
    color: theme.palette.greyAlpha(0.45),
  },
  count: {
    marginLeft: 'auto',
    fontSize: 12,
    color: theme.palette.greyAlpha(0.45),
    fontVariantNumeric: 'tabular-nums',
  },
  actions: {
    marginLeft: 'auto',
  },
}));

const BucketHeader = ({label, children}: {label: string, children?: React.ReactNode}) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.header}>
      <span className={classes.label}>{label}</span>
      {children && <div className={classes.actions}>{children}</div>}
    </div>
  );
};

export default BucketHeader;
