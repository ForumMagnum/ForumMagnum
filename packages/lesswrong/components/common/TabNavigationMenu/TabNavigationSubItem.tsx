import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib/components';
import classNames from 'classnames'
import { iconWidth } from './TabNavigationItem'
import { TAB_NAVIGATION_MENU_WIDTH } from './TabNavigationMenu';

const iconPadding = (theme: ThemeType) =>
  theme.isFriendlyUI ? theme.spacing.unit / 2 : iconWidth + (theme.spacing.unit * 2);

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    display: "block",
    paddingBottom: theme.spacing.unit,
    // padding reflects how large an icon+padding is
    paddingLeft: (theme.spacing.unit*2) + iconPadding(theme),
    color: theme.isFriendlyUI ? theme.palette.grey[600] : theme.palette.grey[700],
    ...(theme.isBookUI && theme.dark && {
      color: theme.palette.text.bannerAdOverlay,
    }),
    width:
      TAB_NAVIGATION_MENU_WIDTH - // base width
      ((theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2))) - // paddingLeft,
      (theme.spacing.unit*2), // leave some space on the right,
    fontSize: "1rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    '&:hover': {
      opacity: theme.isFriendlyUI ? 1 : 0.6,
      color: theme.isFriendlyUI ? theme.palette.grey[800] : undefined,
    },
    boxSizing: "content-box"
  }
})

const TabNavigationSubItem = ({children, classes, className}: {
  children?: React.ReactNode,
  classes: ClassesType<typeof styles>,
  className?: string,
}) => {
  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

export default registerComponent('TabNavigationSubItem', TabNavigationSubItem, {styles});


