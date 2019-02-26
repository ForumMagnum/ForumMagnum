import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    fontStyle: 'italic',
    cursor: "pointer",
    color: theme.palette.grey[600],
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[500],
    }
  }
})

const SectionSubtitle = ({children, classes, className}) => {
  return <Typography component='span' variant='subheading' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

registerComponent( 'SectionSubtitle', SectionSubtitle, withStyles(styles, {name: 'SectionSubtitle'}))
