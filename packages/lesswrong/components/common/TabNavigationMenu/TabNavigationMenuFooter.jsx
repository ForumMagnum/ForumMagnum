import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

// -- See here for all the tab content --
import menuTabs from './menuTabs'

const styles = (theme) => ({
  root: {
    display: "flex",
    justifyContent: "space-around",
    backgroundColor: "#ffffffd4",
    flexDirection: "row",
  }
})

const TabNavigationMenuFooter = ({classes}) => {
  const { TabNavigationFooterItem } = Components

  return (
    <div className={classes.root}>
      {menuTabs[getSetting('forumType')].map(tab => {
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
  )
};

registerComponent(
  'TabNavigationMenuFooter', TabNavigationMenuFooter,
  withStyles(styles, { name: 'TabNavigationMenuFooter'})
);
