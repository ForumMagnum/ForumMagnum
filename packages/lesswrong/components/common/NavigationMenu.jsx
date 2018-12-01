import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router';

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
  
  menuItem: {
    fontSize: 16,
    ...theme.typography.postStyle,
    color: "rgba(0,0,0, 0.87)",
  },
  indented: {
    paddingLeft: 35,
  },
});

const NavigationMenu = ({open, handleOpen, handleClose, classes, toc}) => {
  const af = getSetting('AlignmentForum', false);
  
  const NavigationMenuLink = ({to, label, indent=false}) => (
    <MenuItem
      onClick={handleClose}
      component={Link} to={to}
      classes={{
        root: classNames(classes.menuItem, {[classes.indented]: indent})
      }}
    >
      {label}
    </MenuItem>
  )
  
  return <SwipeableDrawer
    open={open}
    onClose={(event) => handleClose()}
    onOpen={(event) => handleOpen()}
    classes={{
      paper: toc ? classes.drawerPaperWithToC : classes.drawerPaperWithoutToC
    }}
  >
    <NavigationMenuLink to="/" label="Home"/>
    
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
    
    {!af && <NavigationMenuLink to="/library" label="Library"/>}
    {!af && <NavigationMenuLink indent={true} to="/rationality" label="Rationality: A-Z"/>}
    {!af && <NavigationMenuLink indent={true} to="/codex" label="The Codex"/>}
    {!af && <NavigationMenuLink indent={true} to="/hpmor" label="HPMOR"/>}
    
    <Divider />
    
    {!af && <NavigationMenuLink to={"/community"} label="Community"/>}
    <NavigationMenuLink to={"/daily"} label="Posts by Date"/>
    <NavigationMenuLink to={"/meta"} label="Meta"/>
    
    <Divider />
    
    <NavigationMenuLink to={"/about"} label="About"/>
  </SwipeableDrawer>;
}


registerComponent('NavigationMenu', NavigationMenu, withStyles(styles, { name: "NavigationMenu" }));
