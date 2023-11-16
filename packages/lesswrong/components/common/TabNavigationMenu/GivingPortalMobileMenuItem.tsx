import React from 'react';
import { registerComponent, Components } from '../../../lib/vulcan-lib/components';
import { TabNavigationItemProps } from './TabNavigationItem';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.givingPortal.rhsLink,
    '&:hover': {
      color: theme.palette.givingPortal.rhsLink,
      filter: "brightness(0.6)"
    },
    [theme.breakpoints.up('md')]: {
      display: 'none'
    },
  }
})

const GivingPortalMobileMenuItem = ({tab, onClick, classes}: TabNavigationItemProps) => {
  const { TabNavigationItem } = Components
  
  return <TabNavigationItem
    key={tab.id}
    tab={tab}
    onClick={onClick}
    className={classes.root}
  />
}

const GivingPortalMobileMenuItemComponent = registerComponent("GivingPortalMobileMenuItem", GivingPortalMobileMenuItem, {styles, stylePriority: 1});

declare global {
  interface ComponentTypes {
    GivingPortalMobileMenuItem: typeof GivingPortalMobileMenuItemComponent
  }
}
