import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';

const styles = theme => ({
  paper: {
    width: 225
  },
  drawerNavigationMenu: {
    paddingTop: '10px',
    left:0,
    width:260,
    paddingBottom: 20,
    // flexDirection: "column",
  }
})

const NavigationDrawer = ({open, handleOpen, handleClose, classes}) => {
  const { TabNavigationMenu } = Components
  // console.log('navdrawer open', open)
  return <SwipeableDrawer
    open={open}
    onClose={(event) => handleClose()}
    onOpen={(event) => handleOpen()}
    classes={{paper: classes.paper}}
  >
    <div className={classes.drawerNavigationMenu}>
      <TabNavigationMenu />
    </div>
  </SwipeableDrawer>
}

registerComponent(
  'NavigationDrawer', NavigationDrawer,
  withStyles(styles, { name: 'NavigationDrawer'})
);
