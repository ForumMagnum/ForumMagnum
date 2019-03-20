import { registerComponent } from 'meteor/vulcan:core';
import { withRouter, Link } from 'react-router';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';
import withUser from '../common/withUser';

import { compassIcon } from '../icons/compassIcon';
import { questionsGlobeIcon } from '../icons/questionsGlobeIcon';
import { communityGlobeIcon } from '../icons/communityGlobeIcon';


const styles = (theme) => ({
  root: {
    position: "absolute",
    width:"100%",
    zIndex: theme.zIndexes.tabNavigation,
    [theme.breakpoints.up('lg')]: {
      top: 92,
      left:0,
      width:200,
    },
    [theme.breakpoints.down('md')]: {
      position: "fixed",
      left: 0,
      bottom: 0
    },
  },
  tabMenu: {
    display: "flex",
    justifyContent: "space-around",
    zIndex: theme.zIndexes.tabNavigation,
    backgroundColor: "white",
    [theme.breakpoints.up('lg')]: {
      flexDirection: "column",
    },
    [theme.breakpoints.down('md')]: {
      borderTop: "solid 1px rgba(0,0,0,.2)",
      backgroundColor: theme.palette.grey[200],
    },
  },
  selected: {
    '& $icon': {
      opacity: 1,
    },
    '& $navText': {
      color: theme.palette.grey[900],
    },
    [theme.breakpoints.up('lg')]: {
      backgroundColor: theme.palette.grey[200],
    },
    [theme.breakpoints.down('md')]: {
      backgroundColor: theme.palette.grey[300],
    },
  },
  navButtonWrapper: {
    width: 200,
    [theme.breakpoints.down('md')]: {
      width: "20%",
    },
    '&:hover': {
      opacity:1
    }
  },
  navButtonInnerWrapper: {
    paddingTop: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    [theme.breakpoints.down('md')]: {
      padding:0,
      width: "100%",
    }
  },
  navButton: {
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.up('lg')]: {
      width: 168,
      justifyContent: "flex-start",
      flexDirection: "row",
    },
    [theme.breakpoints.down('md')]: {
      flexDirection: "column",
      paddingTop: theme.spacing.unit,
    },
  },
  icon: {
    display: "block",
    opacity: .45,
    width: 30,
    height: 28,
    [theme.breakpoints.up('lg')]: {
      marginRight: theme.spacing.unit*2,
      display: "inline",
    }
  },
  navText: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    [theme.breakpoints.down('md')]: {
      fontSize: 10,
      marginBottom: 3,
      marginTop: 3,
    },
    [theme.breakpoints.up('lg')]: {
      textTransform: "none !important",
    },
  },
  hideOnMobile: {
    [theme.breakpoints.down('md')]: {
      display: "none"
    },
  },
  hideOnDesktop: {
    [theme.breakpoints.up('lg')]: {
      display: "none"
    },
  },
  homeIcon: {
    '& svg': {
      height: 29,
      position: "relative",
      top: -1
    }
  },
})

const TabNavigationMenu = ({
  classes,
  location,
  currentUser
}) => {

  const { pathname } = location
  
  // TODO: BETA Remove the admin requirements on this component once it's ready to be deployed to master.

  if (!(currentUser && currentUser.isAdmin)) { return null }

  return (
    <div className={classes.root}>
      <div className={classes.tabMenu}>
        <Tooltip placement="right" title="Latest posts, comments and curated content.">
          <Link to="/" className={classNames(classes.navButtonWrapper, {[classes.selected]: pathname === "/"})}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <span className={classes.icon}>
                  <span className={classes.homeIcon}>{ compassIcon }</span>
                </span>
                <span className={classes.navText}>
                  Home
                </span>
              </div>
            </Button>
          </Link>
        </Tooltip>
        <Tooltip placement="right" title={<div>
            <div>Curated collections of LessWrong's best writing.</div>
          </div>}>
          <Link to="/library" className={classNames(classes.navButtonWrapper, {[classes.selected]: pathname === "/library"})}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <span className={classes.icon}>
                  <img src="/bookIcon.svg" />
                </span>
                <span className={classes.navText}>
                  Library
                </span>
              </div>
            </Button>
          </Link>
        </Tooltip>
        <Tooltip placement="right" title={<div>
          <div>• Ask simple newbie questions.</div>
          <div>• Collaborate on open research questions.</div>
          <div>• Pose and resolve confusions.</div>
        </div>}>
          <Link to="/questions" className={classNames(classes.navButtonWrapper, {[classes.selected]: pathname === "/questions"})}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <span className={classes.icon}>
                  { questionsGlobeIcon }
                </span>
                <span className={classes.navText}>
                  <span className={classes.hideOnMobile}>Open </span>Questions
                </span>
              </div>
            </Button>
          </Link>
        </Tooltip>
        <Tooltip placement="right" title={<div>Find a meetup near you.</div>}>
          <Link to="/community" className={classNames(classes.navButtonWrapper, {[classes.selected]: pathname === "/community"})}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <span className={classes.icon}>
                  { communityGlobeIcon }
                </span>
                <span className={classes.navText}>
                  Community<span className={classes.hideOnMobile}> Events</span>
                </span>
              </div>
            </Button>
          </Link>
        </Tooltip>
        <Tooltip placement="right" title="See all posts, filtered and sorted however you like.">
          <Link to="/allPosts" className={classNames(classes.navButtonWrapper, {[classes.selected]: pathname === "/allPosts"})}>
            <Button className={classes.navButtonInnerWrapper}>
              <div className={classes.navButton}>
                <span className={classes.icon}>
                  <img src="/scrollIcon.svg" />
                </span>
                <span className={classes.navText}>
                  All Posts
                </span>
              </div>
            </Button>
          </Link>
        </Tooltip>
      </div>
    </div>
  )
};

registerComponent('TabNavigationMenu', TabNavigationMenu, withRouter, withUser, withStyles(styles, { name: 'TabNavigationMenu'}));