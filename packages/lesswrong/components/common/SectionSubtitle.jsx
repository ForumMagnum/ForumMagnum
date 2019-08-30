import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    ...theme.typography.body1,
    ...theme.typography.commentStyle,
    color: theme.palette.grey[700],
    display: "inline-block",
  }
})

const SectionSubtitle = ({children, classes, className}) => {
  return <Typography component='span' variant='subtitle1' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

registerComponent( 'SectionSubtitle', SectionSubtitle, withStyles(styles, {name: 'SectionSubtitle'}))
