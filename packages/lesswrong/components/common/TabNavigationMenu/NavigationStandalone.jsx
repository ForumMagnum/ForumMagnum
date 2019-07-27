import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  root: {
    position: "absolute",
    zIndex: theme.zIndexes.tabNavigation,
    width:"100%",
    [theme.breakpoints.up('lg')]: {
      top: 64,
      left:0,
      width:260,
      paddingTop: 30,
      paddingBottom: 70,
      // flexDirection: "column",
    },
    [theme.breakpoints.down('md')]: {
      position: "fixed",
      bottom: 0,
      left: 0,
      backgroundColor: theme.palette.grey[300],
      width: "100%",
      // flexDirection: "row",
      // TODO; move back to Navigation standalone?
    },
    "@media print": {
      display: "none"
    },
  }
})

const NavigationStandalone = ({classes}) => {
  const { TabNavigationMenu } = Components
  return <div className={classes.root}>
    <TabNavigationMenu standalone />
  </div>
}

registerComponent(
  'NavigationStandalone', NavigationStandalone,
  withStyles(styles, { name: 'NavigationStandalone'})
);
