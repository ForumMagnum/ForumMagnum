import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames'
import { iconWidth } from './TabNavigationItem'

const styles = (theme) => ({
  root: {
    ...theme.typography.body1,
    display: "block",
    paddingBottom: theme.spacing.unit,
    // padding reflects how large an icon+padding is
    paddingLeft: (theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2)),
    paddingRight: theme.spacing.unit*2,
    color: theme.palette.grey[600],
    fontSize: "1rem",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden",
    '&:hover': {
      opacity: .6
    }
  }
})

const TabNavigationSubItem = ({children, classes, className}) => {
  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

registerComponent( 'TabNavigationSubItem', TabNavigationSubItem, withStyles(styles, {name: 'TabNavigationSubItem'}))
