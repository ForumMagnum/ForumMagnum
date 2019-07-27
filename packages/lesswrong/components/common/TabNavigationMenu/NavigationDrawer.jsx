import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';

const styles = theme => ({
  paper: {
    width: 225,
  },
})

const NavigationDrawer = ({open, handleOpen, handleClose, classes}) => {
  const { TabNavigationMenu } = Components
  return <SwipeableDrawer
    open={open}
    onClose={(event) => handleClose()}
    onOpen={(event) => handleOpen()}
    classes={{paper: classes.paper}}
  >
    <TabNavigationMenu />
  </SwipeableDrawer>
}

registerComponent(
  'NavigationDrawer', NavigationDrawer,
  withStyles(styles, { name: 'NavigationDrawer'})
);
