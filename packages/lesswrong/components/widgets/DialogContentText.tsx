import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Components } from '@/lib/vulcan-lib/components';
import classNames from 'classnames';

export const styles = defineStyles("DialogContentText", theme => ({
  root: {
    color: theme.palette.text.secondary,
  },
}), {stylePriority: -1});

export function DialogContentText({className, children}: {
  className?: string
  children?: React.ReactNode
}) {
  const { Typography } = Components;
  const classes = useStyles(styles);
  return <Typography component="p" variant="subheading" className={classNames(className, classes.root)}>
    {children}
  </Typography>
}
