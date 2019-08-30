import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  root: {
    color: theme.palette.grey[600],
    margin: theme.spacing.unit*2
  },
})

const NoContent = ({children, classes}) => {
  return <Typography variant='body1' className={classes.root}>
    {children}
  </Typography>
}

registerComponent( 'NoContent', NoContent, withStyles(styles, {name: 'MetaInfo'}))
