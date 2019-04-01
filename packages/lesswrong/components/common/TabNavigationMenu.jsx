import { registerComponent, Components } from 'meteor/vulcan:core';
import { withRouter, Link } from 'react-router';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import withUser from '../common/withUser';

import { compassIcon } from '../icons/compassIcon';
import { questionsGlobeIcon } from '../icons/questionsGlobeIcon';
import { communityGlobeIcon } from '../icons/communityGlobeIcon';
import { bookIcon } from '../icons/bookIcon'
import { allPostsIcon } from '../icons/allPostsIcon'
;

export const iconWidth = 30

const styles = (theme) => ({
  root: {
    position: "absolute",
    width:"100%",
    zIndex: theme.zIndexes.tabNavigation,
    [theme.breakpoints.up('lg')]: {
      top: 64,
      left:0,
      width:270,
    },
    [theme.breakpoints.down('md')]: {
      position: "unset",
      height: 80,
    },
  },
  tabMenu: {
    display: "flex",
    justifyContent: "space-around",
    zIndex: theme.zIndexes.tabNavigation,
    backgroundColor: "#ffffffd4",
    [theme.breakpoints.up('lg')]: {
      paddingTop: 30,
      paddingBottom: 70,
      flexDirection: "column",
    },
    [theme.breakpoints.down('md')]: {
      position: "absolute",
      top: 74,
      left: 0,
      width: "100%"
    },
    [theme.breakpoints.down('xs')]: {
      top: 66,
    },
  },
  selected: {
    '& $icon': {
      opacity: 1,
    },
    '& $navText': {
      color: theme.palette.grey[900],
      fontWeight: 600,
    },
  },
  navButton: {
    [theme.breakpoints.down('md')]: {
      width: "20%",
    },
    '&:hover': {
      opacity:.6
    },
    paddingTop: theme.spacing.unit*1.5,
    paddingBottom: theme.spacing.unit*1.5,
    paddingLeft: theme.spacing.unit*2,
    paddingRight: theme.spacing.unit*2,
    display: "flex",
    alignItems: "center",
    [theme.breakpoints.up('lg')]: {
      justifyContent: "flex-start",
      flexDirection: "row",
    },
    [theme.breakpoints.down('md')]: {
      paddingTop: theme.spacing.unit*2,
      paddingBottom: theme.spacing.unit,
      width: "100%",
      flexDirection: "column",
    }
  },
  icon: {
    display: "block",
    opacity: .3,
    width: iconWidth,
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
      fontSize: '1rem',
      marginBottom: 3,
      marginTop: 8,
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
  const { TabNavigationSubItem, TabNavigationEventsList } = Components

  // TODO: BETA Remove the admin requirements on this component once it's ready to be deployed to master.

  if (!(currentUser && currentUser.isAdmin)) { return null }

  const lat = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[1]
  const lng = currentUser && currentUser.mongoLocation && currentUser.mongoLocation.coordinates[0]
  let eventsListTerms = {
    view: 'events',
    limit: 3,
  }
  if (lat && lng) {
    eventsListTerms = {
      view: 'nearbyEvents',
      lat: lat,
      lng: lng,
      limit: 3,
    }
  }

  return (
    <div className={classes.root}>
      <div className={classes.tabMenu}>
        <Tooltip placement="right" title="Latest posts, comments and curated content.">
          <Link to="/" className={classNames(classes.navButton, {[classes.selected]: pathname === "/"})}>
            <span className={classes.icon}>
              <span className={classes.homeIcon}>{ compassIcon }</span>
            </span>
            <span className={classes.navText}>
              Home
            </span>
          </Link>
        </Tooltip>

        <Tooltip placement="right-start" title={<div>
          <div>• Ask simple newbie questions.</div>
          <div>• Collaborate on open research questions.</div>
          <div>• Pose and resolve confusions.</div>
        </div>}>
          <Link to="/questions" className={classNames(classes.navButton, {[classes.selected]: pathname === "/questions"})}>
            <span className={classes.icon}>
              { questionsGlobeIcon }
            </span>
            <span className={classes.navText}>
              <span className={classes.hideOnMobile}>Open </span>Questions
            </span>
          </Link>
        </Tooltip>

        <Tooltip placement="right" title={<div>
            <div>Curated collections of LessWrong's best writing.</div>
          </div>}>
          <Link to="/library" className={classNames(classes.navButton, {[classes.selected]: pathname === "/library"})}>
              <span className={classes.icon}>
                { bookIcon }
              </span>
              <span className={classes.navText}>
                Library
              </span>
          </Link>
        </Tooltip>

        <Tooltip placement="right-start" title={<div>
            <p>
              LessWrong was founded by Eliezer Yudkowsky. For two years he wrote a blogpost a day about topics including rationality, science, ambition and artificial intelligence. 
            </p>
            <p>
              Those posts have been edited down into this introductory collection, recommended for new users.
            </p>
          </div>}>
          <Link to="/rationality">
            <TabNavigationSubItem>
              Rationality: A-Z
            </TabNavigationSubItem>
          </Link>
        </Tooltip>
        <Tooltip placement="right-start" title={<div>
            The Codex is a collection of essays written by Scott Alexander that discuss how good reasoning works, how to learn from the institution of science, and different ways society has been and could be designed.
          </div>}>
          <Link to="/codex">
            <TabNavigationSubItem>
              The Codex
            </TabNavigationSubItem>
          </Link>
        </Tooltip>
        <Tooltip placement="right-start" title={<div>
            <p><em>Harry Potter and the Methods of Rationality</em></p>
            <p>
              What if Harry was a scientist? What would you do if the universe had magic in it? A story that illustrates many rationality concepts.
            </p>
          </div>}>
          <Link to="/codex">
            <TabNavigationSubItem>
              HPMOR
            </TabNavigationSubItem>
          </Link>
        </Tooltip>

        <Tooltip placement="right" title={<div>Find a meetup near you.</div>}>
          <Link to="/community" className={classNames(classes.navButton, {[classes.selected]: pathname === "/community"})}>
            <span className={classes.icon}>
              { communityGlobeIcon }
            </span>
            <span className={classes.navText}>
              Community<span className={classes.hideOnMobile}> Events</span>
            </span>
          </Link>
        </Tooltip>
        <TabNavigationEventsList terms={eventsListTerms} />

        <Tooltip placement="right" title="See all posts, filtered and sorted however you like.">
          <Link to="/allPosts" className={classNames(classes.navButton, {[classes.selected]: pathname === "/allPosts"})}>
            <span className={classes.icon}>
              { allPostsIcon }
            </span>
            <span className={classes.navText}>
              Archive
            </span>
          </Link>
        </Tooltip>
      </div>
    </div>
  )
};

registerComponent('TabNavigationMenu', TabNavigationMenu, withRouter, withUser, withStyles(styles, { name: 'TabNavigationMenu'}));
