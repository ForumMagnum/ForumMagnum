import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ModerationSectionTitle', (theme: ThemeType) => ({
  root: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: theme.palette.grey[600],
    letterSpacing: '0.5px',
    flexShrink: 0,
  },
}));

const ModerationSectionTitle = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles(styles);
  return <div className={classes.root}>{children}</div>;
};

export default ModerationSectionTitle;
