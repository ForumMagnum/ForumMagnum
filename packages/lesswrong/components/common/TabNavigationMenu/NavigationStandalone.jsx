import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    position: "absolute",
    zIndex: theme.zIndexes.tabNavigation,
  },
  sidebar: {
    position: "absolute",
    [theme.breakpoints.down('md')]: {
      display: "none"
    },
    top: 20,
    left:0,
    width:260,
  },
  footerBar: {
    [theme.breakpoints.up('lg')]: {
      display: "none"
    },
    position: "fixed",
    bottom: 0,
    left: 0,
    backgroundColor: theme.palette.grey[300],
    width: "100%",
  },
  "@media print": {
    display: "none"
  }
})

const NavigationStandalone = ({classes}) => {
  const { TabNavigationMenu, TabNavigationMenuFooter } = Components
  // TODO; Different tabnavigationmenu for mobile standalone
  return <div className={classes.root}>
    {/* TODO; at this point it seems like there's a reasonable performance /
        cleanliness game to be won by only including this if we're large */}
    <div className={classes.sidebar}>
      <TabNavigationMenu standalone />
    </div>
    <div className={classes.footerBar}>
      <TabNavigationMenuFooter standalone />
    </div>
  </div>
}

registerComponent(
  'NavigationStandalone', NavigationStandalone,
  withStyles(styles, { name: 'NavigationStandalone'})
);
