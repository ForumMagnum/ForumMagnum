import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames'
import { iconWidth } from './TabNavigationMenu'

const styles = (theme) => ({
  root: {
    ...theme.typography.body2,
    display: "block",
    paddingBottom: theme.spacing.unit,
    // padding reflects how large an icon+padding is
    paddingLeft: (theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2)),
    paddingRight: theme.spacing.unit*2,
    color: theme.palette.grey[600],
    fontSize: "1rem",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    [theme.breakpoints.down('md')]: {
      display: "none"
    },
    overflow: "hidden"
  }
})

const TabNavigationSubItem = ({children, classes, className}) => {
  return <div className={classNames(classes.root, className)}>
    <a>{children}</a>
  </div>
}

registerComponent( 'TabNavigationSubItem', TabNavigationSubItem, withStyles(styles, {name: 'TabNavigationSubItem'}))
