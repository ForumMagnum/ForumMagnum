import { registerComponent } from 'meteor/vulcan:core';
import { withRouter, Link } from 'react-router';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Home from '@material-ui/icons/Home';
import LocalLibrary from '@material-ui/icons/LocalLibrary';
import ListAlt from '@material-ui/icons/ListAlt';
import Public from '@material-ui/icons/Public';
import QuestionAnswer from '@material-ui/icons/QuestionAnswer';
import Button from '@material-ui/core/Button';
import Headroom from 'react-headroom'
import { isMobile } from '../../lib/modules/utils/isMobile.js'


const styles = (theme) => ({
  root: {
    position: "absolute",
    width:"100%",
    [theme.breakpoints.up('md')]: {
      top: 110,
      left:5,
      width:148,
      borderRadius: 3,
    },
    [theme.breakpoints.down('sm')]: {
      position: "fixed",
      left: 0,
      bottom: 0,
      zIndex:1000,
    },
  },
  tabMenu: {
    display: "flex",
    justifyContent: "space-around",
    zIndex:1000,
    backgroundColor: "white",
    [theme.breakpoints.up('md')]: {
      flexDirection: "column",
      paddingTop: theme.spacing.unit,
      paddingBottom: theme.spacing.unit,
    },
    [theme.breakpoints.down('sm')]: {
      borderTop: "solid 1px rgba(0,0,0,.2)",
      backgroundColor: theme.palette.grey[200],
    },
  },
  navButtonWrapper: {
    [theme.breakpoints.down('sm')]: {
      width: "20%",
    },
  },
  navButtonInnerWrapper: {
    [theme.breakpoints.down('sm')]: {
      padding:0,
      paddingBottom: theme.spacing.unit/2,
      width: "100%",
    }
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.up('md')]: {
      width: 116,
      justifyContent: "flex-start",
      flexDirection: "row",
    },
    [theme.breakpoints.down('sm')]: {
      flexDirection: "column",
      paddingTop: theme.spacing.unit,
    },
    '&.selected': {
      backgroundColor: theme.palette.grey[100],
    }
  },
  icon: {
    display: "block",
    color: theme.palette.grey[400],
    marginBottom: theme.spacing.unit/2,
    [theme.breakpoints.up('md')]: {
      marginRight: theme.spacing.unit,
      display: "inline",
    },
    '&.selected': {
      color: theme.palette.grey[900],
    }
  },
  navText: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    [theme.breakpoints.down('sm')]: {
      fontSize: 8,
    },
    [theme.breakpoints.up('md')]: {
      textTransform: "none !important",
      paddingBottom: 5,
      paddingLeft: 6,
    },
    '&.selected': {
      color: theme.palette.grey[900],
    }
  },
})

const TabNavigationMenu = ({
  classes,
  location
}) => {

  const pathname = location.pathname
  
  return (
    <div className={classes.root}>
      <Headroom downTolerance={10} upTolerance={12} disable={!isMobile()}>
        <div className={classes.tabMenu}>
          <Link to="/" className={classes.navButtonWrapper}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <Home className={classNames(classes.icon, {selected: pathname === "/"})}/> 
                <span className={classNames(classes.navText, {selected: pathname === "/"})}>
                  Home
                </span>
              </div>
            </Button>
          </Link>
          <Link to="/questions" className={classes.navButtonWrapper}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <QuestionAnswer className={classNames(classes.icon, {selected: pathname === "/questions"})}/> 
                <span className={classNames(classes.navText, {selected: pathname === "/questions"})}>
                  Questions
                </span>
              </div>
            </Button>
          </Link>
          <Link to="/library" className={classes.navButtonWrapper}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <LocalLibrary className={classNames(classes.icon, {selected: pathname === "/library"})}/> 
                <span className={classNames(classes.navText, {selected: pathname === "/library"})}>
                  Library
                </span>
              </div>
            </Button>
          </Link>
          <Link to="/allPosts" className={classes.navButtonWrapper}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <ListAlt className={classNames(classes.icon, {selected: pathname === "/allPosts"})}/> 
                <span className={classNames(classes.navText, {selected: pathname === "/allPosts"})}>
                  All Posts
                </span>
              </div>
            </Button>
          </Link>
          <Link to="/community" className={classes.navButtonWrapper}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <Public className={classNames(classes.icon, {selected: pathname === "/community"})}/> 
                <span className={classNames(classes.navText, {selected: pathname === "/community"})}>
                  Community
                </span>
              </div>
            </Button>
          </Link>
        </div>
      </Headroom>
    </div>
  )
};

registerComponent('TabNavigationMenu', TabNavigationMenu, withRouter, withStyles(styles, { name: 'TabNavigationMenu'}));