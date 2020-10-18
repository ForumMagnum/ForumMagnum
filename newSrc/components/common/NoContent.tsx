import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.grey[600],
    margin: theme.spacing.unit*2
  },
})

const NoContent = ({children, classes}: {
  children: React.ReactNode,
  classes: ClassesType,
}) => {
  return <Typography variant='body2' className={classes.root}>
    {children}
  </Typography>
}

const NoContentComponent = registerComponent('NoContent', NoContent, {styles});

declare global {
  interface ComponentTypes {
    NoContent: typeof NoContentComponent
  }
}
