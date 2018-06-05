import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import { Link } from 'react-router';

const NavigationMenu = ({open, handleClose, handleToggle}) =>
  <Drawer docked={false}
    width={225}
    open={open}
    onRequestChange={(open) => handleToggle(open)}
    containerClassName="menu-drawer"
    containerStyle={{height: "100vh"}}
    overlayStyle={{height: "100vh"}}
  >
    <MenuItem onClick={handleClose} containerElement={<Link to={"/"}/>}> HOME </MenuItem>
    <Divider />
    <MenuItem onClick={handleClose} containerElement={<Link to={"/library"}/>}> LIBRARY </MenuItem>
    <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/rationality"}/>}>
      RATIONALITY: A-Z
    </MenuItem>
    <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/codex"}/>}>
      THE CODEX
    </MenuItem>
    <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/hpmor"}/>}>
      HPMOR
    </MenuItem>
    <Divider />
    <MenuItem onClick={handleClose} containerElement={<Link to={"/community"}/>}> COMMUNITY </MenuItem>
    <MenuItem onClick={handleClose} containerElement={<Link to={"/daily"}/>}> ALL POSTS </MenuItem>
    <MenuItem onClick={handleClose} containerElement={<Link to={"/meta"}/>}> META </MenuItem>
    <MenuItem onClick={handleClose} containerElement={<Link to={"/about"}/>}> ABOUT </MenuItem>
  {/*<MenuItem containerElement={<Link to={"/library"}/>}> THE LIBRARY </MenuItem>*/}
</Drawer>;

registerComponent('NavigationMenu', NavigationMenu);
