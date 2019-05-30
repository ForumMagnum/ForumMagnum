import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
import React from 'react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import MenuItem from '@material-ui/core/MenuItem';
import Divider from '@material-ui/core/Divider';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import { Link } from '../../lib/reactRouterWrapper.js';
import Home from '@material-ui/icons/Home';
import LocalLibrary from '@material-ui/icons/LocalLibrary';
import Details from '@material-ui/icons/Details';
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
    overflow:"hidden",
  },
  tableOfContents: {
    padding: "16px 0 16px 16px",
    position:"absolute",
    overflowY:"scroll",
    left:55,
    maxWidth: 247,
    height:"100%",
    display:"none",
    [theme.breakpoints.down('sm')]: {
      display:"block"
    }
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
    padding:theme.spacing.unit,
    paddingLeft: theme.spacing.unit*2,
  },
  navButtons: {
    display: "flex",
    flexDirection: "column",
    width:55,
    backgroundColor: theme.palette.grey[100],
    paddingTop: theme.spacing.unit*2,
    paddingBottom: theme.spacing.unit,
    borderRight: "solid 1px rgba(0,0,0,.1)",
    height:"100%",
    color: theme.palette.grey[600],
    [theme.breakpoints.up('md')]: {
      display:"none"
    }
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
  sequences: {
    fontSize: 20,
    fontWeight: 600,
    position:"relative",
    left:4,
    width: 24,
    textAlign:"center",
    color: theme.palette.grey[500]
  },
  divider: {
    marginTop:theme.spacing.unit,
    marginBottom:theme.spacing.unit
  },
  menuIcon: {
    width:24,
    color: theme.palette.grey[600]
  },
  defaultNavMenu: {
    marginTop: theme.spacing.unit
  },
  hideDefaultNav: {
    [theme.breakpoints.down('sm')]: {
      display:"none"
    }
  }
});

const NavigationMenu = ({open, handleOpen, handleClose, classes, toc}) => {
  const af = getSetting('forumType') === 'AlignmentForum';

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
  const showToc = toc && toc.sections

  return <SwipeableDrawer
    open={open}
    onClose={(event) => handleClose()}
    onOpen={(event) => handleOpen()}
    classes={{
      paper: showToc ? classes.drawerPaperWithToC : classes.drawerPaperWithoutToC
    }}
  >
    {showToc && <div className={classes.navButtons}>
      <Tooltip title="Home" placement="right">
        <Link to="/" className={classes.navButton}>
          <Home/>
        </Link>
      </Tooltip>
      <Divider className={classes.divider}/>
      <Tooltip title="All Posts" placement="right">
        <Link to="/allPosts" className={classes.navButton}>
          <ListAlt/>
        </Link>
      </Tooltip>
      <Tooltip title="About" placement="right">
        <Link to="/about" className={classes.navButton}>
          <span className={classes.about}>?</span>
        </Link>
      </Tooltip>
    </div>}
    <div className={classNames(classes.defaultNavMenu, {[classes.hideDefaultNav]:showToc})}>
      <NavigationMenuLink icon={<Home/>} to="/" label="Home"/>

      <Divider className={classes.divider}/>

      <NavigationMenuLink icon={<ListAlt/>} to={"/allPosts"} label="All Posts"/>
      <NavigationMenuLink icon={<Details/>} to={"/meta"} label="Community"/>
      <NavigationMenuLink icon={<span className={classes.about}>?</span>} to={"/about"} label="About"/>
    </div>
    {showToc && <React.Fragment>
      <div className={classes.tableOfContents}>
        <Components.TableOfContentsList
          sectionData={toc}
          onClickSection={() => handleClose()}
          drawerStyle={true}
        />
      </div>
    </React.Fragment>}
  </SwipeableDrawer>;
}


registerComponent('NavigationMenu', NavigationMenu, withStyles(styles, { name: "NavigationMenu" }));
