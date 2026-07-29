import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('HoverPreviewSpinner', (theme: ThemeType) => ({
  // Sized in em so it scales with whatever it sits next to.
  spinner: {
    display: 'inline-block',
    width: '1em',
    height: '1em',
    border: `1.5px solid ${theme.palette.grey[600]}`,
    borderTopColor: 'transparent',
    borderRadius: '50%',
    opacity: 0.75,
    animation: 'hover-preview-spin 0.7s linear infinite',
  },
  '@keyframes hover-preview-spin': {
    to: {
      transform: 'rotate(1turn)',
    },
  },
}));

export function HoverPreviewSpinner({ className }: { className?: string }) {
  const classes = useStyles(styles);
  return <span className={className}><span className={classes.spinner} /></span>;
}
