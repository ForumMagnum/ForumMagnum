import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("Alert", theme => ({
  alert: {
    color: theme.palette.error.main,
  },
}));

export const Alert = ({ children }: {
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  return <div className={classes.alert}>
    {children}
  </div>;
}
