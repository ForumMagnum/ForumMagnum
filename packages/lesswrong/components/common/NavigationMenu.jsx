import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  drawerPaper: {
    width: 225,
  },
});

const NavigationMenu = ({open, handleOpen, handleClose, classes}) => {
  const af = getSetting('AlignmentForum', false);
  return <SwipeableDrawer
    open={open}
    onClose={(event) => handleClose()}
    onOpen={(event) => handleOpen()}
    classes={{
      paper: classes.drawerPaper
    }}
  >
    <MenuItem onClick={handleClose} containerElement={<Link to={"/"}/>}> HOME </MenuItem>
    <Divider />
    {!af && <MenuItem onClick={handleClose} containerElement={<Link to={"/library"}/>}> LIBRARY </MenuItem>}
    {!af && <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/rationality"}/>}>
      RATIONALITY: A-Z
    </MenuItem>}
    {!af && <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/codex"}/>}>
      THE CODEX
    </MenuItem>}
    {!af && <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/hpmor"}/>}>
      HPMOR
    </MenuItem>}
    <Divider />
    {!af && <MenuItem onClick={handleClose} containerElement={<Link to={"/community"}/>}> COMMUNITY </MenuItem>}
    <MenuItem onClick={handleClose} containerElement={<Link to={"/daily"}/>}> POSTS BY DATE </MenuItem>
    <MenuItem onClick={handleClose} containerElement={<Link to={"/meta"}/>}> META </MenuItem>
    <MenuItem onClick={handleClose} containerElement={<Link to={"/about"}/>}> ABOUT  </MenuItem>
    {/*<MenuItem containerElement={<Link to={"/library"}/>}> THE LIBRARY </MenuItem>*/}
  </SwipeableDrawer>;
}


registerComponent('NavigationMenu', NavigationMenu, withStyles(styles, { name: "NavigationMenu" }));
