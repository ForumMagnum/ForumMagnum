import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: theme.spacing.unit,
    fontSize: ".85rem",
    lineHeight: "1.5em"
  },
  button: {
    cursor: "pointer",
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[400],
    },
  }
})

const SidebarInfo = ({children, classes, button, className}) => {
  return <Typography
    component='span'
    className={classNames(classes.root, {[classes.button]: button}, className)}
    variant='body2'>
      {children}
  </Typography>
}

registerComponent( 'SidebarInfo', SidebarInfo, withStyles(styles, {name: 'SidebarInfo'}))
