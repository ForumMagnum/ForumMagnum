import React from 'react';
import classNames from 'classnames';
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

const ModerationSectionTitle = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, className)}>{children}</div>;
};

export default ModerationSectionTitle;
