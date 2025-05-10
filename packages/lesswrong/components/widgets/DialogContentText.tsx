import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';
import { Typography } from "../common/Typography";

export const styles = defineStyles("DialogContentText", theme => ({
  root: {
    color: theme.palette.text.secondary,
  },
}), {stylePriority: -1});

export function DialogContentText({className, children}: {
  className?: string
  children?: React.ReactNode
}) {
  const classes = useStyles(styles);
  return <Typography component="p" variant="subheading" className={classNames(className, classes.root)}>
    {children}
  </Typography>
}
