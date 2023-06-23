import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import classNames from 'classnames'
import { iconWidth } from './TabNavigationItem'
import { TAB_NAVIGATION_MENU_WIDTH } from './TabNavigationMenu';
import { isEAForum } from '../../../lib/instanceSettings';

const iconPadding = (theme: ThemeType) =>
  isEAForum ? theme.spacing.unit / 2 : iconWidth + (theme.spacing.unit * 2);

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    ...theme.typography.body2,
    display: "block",
    paddingBottom: theme.spacing.unit,
    // padding reflects how large an icon+padding is
    paddingLeft: (theme.spacing.unit*2) + iconPadding(theme),
    color: theme.palette.grey[isEAForum ? 600 : 700],
    width:
      TAB_NAVIGATION_MENU_WIDTH - // base width
      ((theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2))) - // paddingLeft,
      (theme.spacing.unit*2), // leave some space on the right,
    fontSize: "1rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    '&:hover': {
      opacity: isEAForum ? 1 : 0.6,
      color: isEAForum ? theme.palette.grey[800] : undefined,
    },
    boxSizing: "content-box"
  }
})

const TabNavigationSubItem = ({children, classes, className}: {
  children?: React.ReactNode,
  classes: ClassesType,
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
