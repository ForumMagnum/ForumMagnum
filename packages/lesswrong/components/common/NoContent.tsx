import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Typography } from "./Typography";

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[600],
    margin: theme.spacing.unit*2
  },
})

const NoContentInner = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return <Typography variant='body2' className={classes.root}>
    {children}
  </Typography>
}

export const NoContent = registerComponent('NoContent', NoContentInner, {styles});

declare global {
  interface ComponentTypes {
    NoContent: typeof NoContent
  }
}
