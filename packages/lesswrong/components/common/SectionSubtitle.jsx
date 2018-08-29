import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    fontStyle: 'italic',
    fontSize: 16,
    cursor: "pointer",
    color: theme.palette.grey[600],
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[500],
    },
    ...theme.typography.postStyle
  }
})

const SectionSubtitle = ({children, classes, className}) => {
  return <Typography component='span' variant='body1' className={classNames(classes.root, className)}>
    {children}
  </Typography>
}

registerComponent( 'SectionSubtitle', SectionSubtitle, withStyles(styles, {name: 'SectionSubtitle'}))
