// @inheritedComponent Typography

import React from 'react';
import Typography from '@/lib/vendor/@material-ui/core/src/Typography';
import { defineStyles } from '../hooks/useStyles';

export const styles = defineStyles("DialogContentText", theme => ({
  /* Styles applied to the root element. */
  root: {},
}));

export function DialogContentText({className, children}: {
  className?: string
  children?: React.ReactNode
}) {
  return <Typography component="p" variant="subheading" color="textSecondary" className={className}>
    {children}
  </Typography>
}
