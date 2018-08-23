import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = (theme) => ({
  root: {
    fontStyle: 'italic',
    fontSize: 16,
    color: theme.palette.grey[600],
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[500],
    },
    ...theme.typography.postStyle
  }
})

const SectionSubtitle = ({children, classes, className}) => {
  return <Typography component='span' variant='body1' className={classes.root}>
    <span className={className}>{children}</span>
  </Typography>
}

registerComponent( 'SectionSubtitle', SectionSubtitle, withStyles(styles, {name: 'SectionSubtitle'}))
