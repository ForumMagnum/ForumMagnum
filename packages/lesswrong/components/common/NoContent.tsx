import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  root: {
    color: theme.palette.grey[600],
    margin: theme.spacing.unit*2
  },
})

const NoContent = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType<typeof styles>,
}) => {
  return <Components.Typography variant='body2' className={classes.root}>
    {children}
  </Components.Typography>
}

const NoContentComponent = registerComponent('NoContent', NoContent, {styles});

declare global {
  interface ComponentTypes {
    NoContent: typeof NoContentComponent
  }
}
