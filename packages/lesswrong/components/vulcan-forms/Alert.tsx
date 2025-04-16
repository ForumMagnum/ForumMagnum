import React from 'react';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("Alert", theme => ({
  alert: {
    color: theme.palette.error.main,
  },
}));

const Alert = ({ children }: {
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  return <div className={classes.alert}>
    {children}
  </div>;
}

const AlertComponent = registerComponent('Alert', Alert);

declare global {
  interface ComponentTypes {
    Alert: typeof AlertComponent
  }
}

