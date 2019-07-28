import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';

// -- See here for all the tab content --
import menuTabs from './menuTabs'

const styles = (theme) => {
  // console.log('theme breakpoints', theme.breakpoints.up('lg'))
  // console.log('theme.zIndex.tabNavigation', theme.zIndexes.tabNavigation)
  return {
    root: {
      display: "flex",
      justifyContent: "space-around",
      backgroundColor: "#ffffffd4",
      flexDirection: "row",
    }
  }
}

const TabNavigationMenuFooter = ({classes}) => {
  const { TabNavigationFooterItem } = Components

  return (
    <div className={classes.root}>
      {menuTabs[getSetting('forumType')].map(tab => {
        // console.log('tab', tab)
        if (!tab.showOnMobileStandalone) {
          return
        }
        // NB: No support for custom components or dividers on footer
        return <TabNavigationFooterItem
          key={tab.id}
          tab={tab}
        />
      })}
    </div>
    // TODO; how to find faq info
    // Maybe by having regular bar pull out in footer mode
  )
};

registerComponent(
  'TabNavigationMenuFooter', TabNavigationMenuFooter,
  withStyles(styles, { name: 'TabNavigationMenuFooter'})
);
