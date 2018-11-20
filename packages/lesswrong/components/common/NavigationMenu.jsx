import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
import { Link } from 'react-router';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  drawerPaperWithoutToC: {
    width: 225,
  },
  
  // If there's a table of contents, make the drawer wider than if there isn't
  // one (because post section titles tend to be longer than top-level
  // navigation options).
  drawerPaperWithToC: {
    width: 300,
  },
});

const NavigationMenu = ({open, handleOpen, handleClose, classes, toc}) => {
  const af = getSetting('AlignmentForum', false);
  return <SwipeableDrawer
    open={open}
    onClose={(event) => handleClose()}
    onOpen={(event) => handleOpen()}
    classes={{
      paper: toc ? classes.drawerPaperWithToC : classes.drawerPaperWithoutToC
    }}
  >
    <MenuItem onClick={handleClose} containerElement={<Link to={"/"}/>}> Home </MenuItem>
    
    <Divider />
    
    {toc && <React.Fragment>
      <Components.TableOfContentsList
        document={toc.document}
        sections={toc.sections}
        onClickSection={() => handleClose()}
        drawerStyle={true}
      />
      <Divider />
    </React.Fragment>}
    
    {!af && <MenuItem onClick={handleClose} containerElement={<Link to={"/library"}/>}> Library </MenuItem>}
    
    {!af && <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/rationality"}/>}>
      Rationality: A-Z
    </MenuItem>}
    
    {!af && <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/codex"}/>}>
      The Codex
    </MenuItem>}
    
    {!af && <MenuItem
      onClick={handleClose}
      innerDivStyle={{paddingLeft:"35px" }}
      containerElement={<Link to={"/hpmor"}/>}>
      HPMOR
    </MenuItem>}
    
    <Divider />
    
    {!af && <MenuItem onClick={handleClose} containerElement={<Link to={"/community"}/>}> Community </MenuItem>}
    
    <MenuItem onClick={handleClose} containerElement={<Link to={"/daily"}/>}> Posts by Date </MenuItem>
    
    <MenuItem onClick={handleClose} containerElement={<Link to={"/meta"}/>}> Meta </MenuItem>
    
    <Divider />
    
    <MenuItem onClick={handleClose} containerElement={<Link to={"/about"}/>}> About  </MenuItem>
  </SwipeableDrawer>;
}


registerComponent('NavigationMenu', NavigationMenu, withStyles(styles, { name: "NavigationMenu" }));
