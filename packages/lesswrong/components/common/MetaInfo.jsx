import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import classNames from 'classnames'

const styles = (theme) => ({
  root: {
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: ".5em"
  },
  button: {
    cursor: "pointer",
    '&:hover, &:active, &:focus': {
      color: theme.palette.grey[400],
    },
  },
  largeMargin: {
    marginRight: "1em"
  }
})

const MetaInfo = ({children, classes, button, block, largeMargin, className}) => {
  return <Typography
    component='span'
    variant='body2'
    className={classNames(
      classes.root, {
        [classes.button]: button,
        [classes.largeMargin]: largeMargin},
      className)}>
    {children}
  </Typography>
}

registerComponent( 'MetaInfo', MetaInfo, withStyles(styles, {name: 'MetaInfo'}))
