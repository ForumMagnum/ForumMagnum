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
  block: {
    display: "block"
  },
  wideSpacing: {
    marginRight: "1em"
  }
})

const SmallItemStyle = ({children, classes, button, block, wideSpacing, className}) => {
  return <Typography
    component='span'
    variant='body2'
    className={classNames(
      classes.root, {
        [classes.button]: button,
        [classes.block]: block,
        [classes.wideSpacing]: wideSpacing},
      className)}>
    {children}
  </Typography>
}

registerComponent( 'SmallItemStyle', SmallItemStyle, withStyles(styles, {name: 'SmallItemStyle'}))
