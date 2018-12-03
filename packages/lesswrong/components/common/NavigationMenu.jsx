import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { Link } from 'react-router';
import Home from '@material-ui/icons/Home';
import LocalLibrary from '@material-ui/icons/LocalLibrary';
import Details from '@material-ui/icons/details';
import ListAlt from '@material-ui/icons/ListAlt';
import Public from '@material-ui/icons/Public';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Tooltip from '@material-ui/core/Tooltip';

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
  tableOfContents: {
    margin:16,
    position:"absolute",
    left:55,
    maxWidth: 215,
  },
  menuItem: {
    fontSize: 16,
    // ...theme.typography.postStyle,
    color: "rgba(0,0,0, 0.87)",
  },
  indented: {
    paddingLeft: 35,
  },
  navButton: {
    padding:theme.spacing.unit
  },
  navButtons: {
    display: "flex",
    flexDirection: "column",
    width:55,
    backgroundColor: theme.palette.grey[100],
    paddingTop: theme.spacing.unit*2,
    paddingLeft: 6,
    paddingBottom: theme.spacing.unit,
    borderRight: "solid 1px rgba(0,0,0,.1)",
    height:"100%",
    color: theme.palette.grey[600]
  },
  about: {
    fontSize: 22,
    fontWeight: 600,
    fontFamily: ['sans-serif'].join(','),
    position:"relative",
    left:4,
    width: 24,
    textAlign:"center"
  },
  menuIcon: {
    width:24,
    color: theme.palette.grey[600]
  }
});

const NavigationMenu = ({open, handleOpen, handleClose, classes, toc}) => {
  const af = getSetting('AlignmentForum', false);

  const NavigationMenuLink = ({to, label, icon, indent=false}) => (
    <MenuItem
      onClick={handleClose}
      component={Link} to={to}
      classes={{
        root: classNames(classes.menuItem, {[classes.indented]: indent})
      }}
    >
      <ListItemIcon className={classes.menuIcon}><span>{icon}</span></ListItemIcon> {label}
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
    {toc && <div className={classes.navButtons}>
      <Tooltip title="Home" placement="right">
        <Link to="/" className={classes.navButton}>
          <Home/>
        </Link>
      </Tooltip>
      <Tooltip title="Library" placement="right">
        <Link to="/library" className={classes.navButton}>
          <LocalLibrary/>
        </Link>
      </Tooltip>
      <Tooltip title="Meta" placement="right">
        <Link to="/meta" className={classes.navButton}>
          <Details/>
        </Link>
      </Tooltip>
      <Tooltip title="Community Events" placement="right">
        <Link to="/community" className={classes.navButton}>
          <Public/>
        </Link>
      </Tooltip>
      <Tooltip title="Posts by Date" placement="right">
        <Link to="/daily" className={classes.navButton}>
          <ListAlt/>
        </Link>
      </Tooltip>
      <Tooltip title="About" placement="right">
        <Link to="/about" className={classes.navButton}>
          <span className={classes.about}>?</span>
        </Link>
      </Tooltip>
    </div>}
    {!toc && <NavigationMenuLink icon={<Home/>} to="/" label="Home"/>}

    {!toc && <Divider />}

    {!af && !toc && <NavigationMenuLink icon={<LocalLibrary/>} to="/library" label="Library"/>}
    {!af && !toc && <NavigationMenuLink indent={true} to="/rationality" label="Rationality: A-Z"/>}
    {!af && !toc  && <NavigationMenuLink indent={true} to="/codex" label="The Codex"/>}
    {!af && !toc  && <NavigationMenuLink indent={true} to="/hpmor" label="HPMOR"/>}

    {!toc && <Divider />}

    {!af && !toc && <NavigationMenuLink icon={<Public/>} to={"/community"} label="Community Events"/>}
    {!toc && <NavigationMenuLink icon={<ListAlt/>} to={"/daily"} label="Posts by Date"/>}
    {!toc && <NavigationMenuLink icon={<Details/>} to={"/meta"} label="Meta"/>}
    {!toc && <NavigationMenuLink icon={<span className={classes.about}>?</span>} to={"/about"} label="About"/>}
    {!toc && <Divider />}
    {toc && <React.Fragment>
      <div className={classes.tableOfContents}>
        <Components.TableOfContentsList
          document={toc.document}
          sections={toc.sections}
          onClickSection={() => handleClose()}
          drawerStyle={true}
        />
      </div>
      <Divider />
    </React.Fragment>}
  </SwipeableDrawer>;
}


registerComponent('NavigationMenu', NavigationMenu, withStyles(styles, { name: "NavigationMenu" }));
