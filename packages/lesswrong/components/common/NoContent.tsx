import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = createStyles((theme) => ({
  root: {
    color: theme.palette.grey[600],
    margin: theme.spacing.unit*2
  },
}))

const NoContent = ({children, classes}) => {
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
