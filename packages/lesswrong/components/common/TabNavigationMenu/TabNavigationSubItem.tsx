import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { createStyles } from '@material-ui/core/styles';
import classNames from 'classnames'
import { iconWidth } from './TabNavigationItem'

const styles = createStyles((theme) => ({
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
    overflow: "hidden",
    '&:hover': {
      opacity: .6
    }
  }
}))

const TabNavigationSubItem = ({children, classes, className}: {
  children?: any,
  classes: any,
  className?: string,
}) => {
  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

const TabNavigationSubItemComponent = registerComponent('TabNavigationSubItem', TabNavigationSubItem, {styles});

declare global {
  interface ComponentTypes {
    TabNavigationSubItem: typeof TabNavigationSubItemComponent
  }
}
