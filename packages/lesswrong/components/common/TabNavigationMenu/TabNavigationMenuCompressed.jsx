import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';

// -- See here for all the tab content --
import menuTabs from './menuTabs'

const styles = (theme) => {
  // console.log('theme breakpoints', theme.breakpoints.up('lg'))
  // console.log('theme.zIndex.tabNavigation', theme.zIndexes.tabNavigation)
  return {
    root: {
      display: "flex",
      flexDirection: "column",
      width:55,
      backgroundColor: theme.palette.grey[100],
      borderRight: "solid 1px rgba(0,0,0,.1)",
      height:"100%",
      color: theme.palette.grey[600],
    },
    divider: {
      marginTop:theme.spacing.unit,
      marginBottom:theme.spacing.unit
    }
  }
}

// TODO; should this just be footer but with flexDirection: column?
const TabNavigationMenuCompressed = ({classes}) => {
  const { TabNavigationCompressedItem } = Components

  return (
    <div className={classes.root}>
      {menuTabs[getSetting('forumType')].map(tab => {
        // console.log('tab', tab)
        if (!tab.showOnCompressed) {
          return
        }
        if (tab.divider) {
          return <Divider key={tab.id} className={classes.divider} />
        }
        return <TabNavigationCompressedItem key={tab.id} tab={tab} />
      })}
    </div>
    // TODO; how to find faq info
  )
};

registerComponent(
  'TabNavigationMenuCompressed', TabNavigationMenuCompressed,
  withStyles(styles, { name: 'TabNavigationMenuCompressed'})
);
