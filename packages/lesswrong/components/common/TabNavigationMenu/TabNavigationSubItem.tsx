import React from 'react';
import classNames from 'classnames'
import { iconWidth } from './TabNavigationItem'
import { TAB_NAVIGATION_MENU_WIDTH } from './TabNavigationMenu';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const iconPadding = (theme: ThemeType) => iconWidth + 16;

const styles = defineStyles("TabNavigationSubItem", (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    display: "block",
    paddingBottom: 8,
    // padding reflects how large an icon+padding is
    paddingLeft: 16 + iconPadding(theme),
    color: theme.palette.grey[700],
    ...(theme.dark && {
      color: theme.palette.text.bannerAdOverlay,
    }),
    width:
      TAB_NAVIGATION_MENU_WIDTH - // base width
      (16 + (iconWidth + 16)) - // paddingLeft,
      16, // leave some space on the right,
    fontSize: "1rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    '&:hover': {
      opacity: 0.6
    },
    boxSizing: "content-box"
  }
}))

const TabNavigationSubItem = ({children, className}: {
  children?: React.ReactNode,
  className?: string,
}) => {
  const classes = useStyles(styles);
  return <div className={classNames(classes.root, className)}>
    {children}
  </div>
}

export default TabNavigationSubItem;


