import { registerComponent, Components, getSetting } from 'meteor/vulcan:core';
import { withRouter, Link } from '../../lib/reactRouterWrapper.js';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Tooltip from '@material-ui/core/Tooltip';
import withUser from '../common/withUser';

import { compassIcon } from '../icons/compassIcon';
import { questionsGlobeIcon } from '../icons/questionsGlobeIcon';
import { communityGlobeIcon } from '../icons/communityGlobeIcon';
import { BookIcon } from '../icons/bookIcon'
import { allPostsIcon } from '../icons/allPostsIcon';

export const iconWidth = 30
const smallIconSize = 23

const EventsList = ({currentUser, classes}) => {
  const { TabNavigationEventsList } = Components

  const lat = currentUser &&
    currentUser.mongoLocation &&
    currentUser.mongoLocation.coordinates[1]
  const lng = currentUser &&
    currentUser.mongoLocation &&
    currentUser.mongoLocation.coordinates[0]
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
  return <span className={classes.hideOnMobile}>
    <TabNavigationEventsList terms={eventsListTerms} />
  </span>
}

const styles = (theme) => {
  // console.log('theme breakpoints', theme.breakpoints.up('lg'))
  return {
    root: {
      position: "absolute",
      width:"100%",
      zIndex: theme.zIndexes.tabNavigation,
      // TODO; extract to header
      [theme.breakpoints.up('lg')]: {
        top: 64,
        left:0,
        width:260,
      },
      [theme.breakpoints.down('md')]: {
        position: "unset",
      },
      "@media print": {
        display: "none"
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
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100%",
        backgroundColor: theme.palette.grey[300]
      },
    },
    // TODO; this is fucked
    drawerPaper: {
      width: 225,
    },
    selected: {
      '& $icon': {
        opacity: 1,
      },
      '& $navText': {
        color: theme.palette.grey[900],
        fontWeight: 600,
      },
      [theme.breakpoints.down('md')]: {
        backgroundColor: theme.palette.grey[400]
      }
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
        paddingTop: theme.spacing.unit,
        paddingBottom: 2,
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
      },
      [theme.breakpoints.down('md')]: {
        opacity: .45,
        width: smallIconSize,
        height: smallIconSize,
        '& svg': {
          width: smallIconSize,
          height: smallIconSize,
        }
      }
    },
    navText: {
      ...theme.typography.body2,
      color: theme.palette.grey[600],
      [theme.breakpoints.down('md')]: {
        fontSize: '.8rem',
        color: theme.palette.grey[700],
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
        top: -1,
        [theme.breakpoints.down('md')]: {
          height: smallIconSize,
          width: smallIconSize
        }
      }
    },
    divider: {
      width: 50,
      marginLeft: (theme.spacing.unit*2) + (iconWidth + (theme.spacing.unit*2)) - 2,
      marginTop: theme.spacing.unit*1.5,
      marginBottom: theme.spacing.unit*2.5,
      borderBottom: "solid 1px rgba(0,0,0,.2)",
      [theme.breakpoints.down('md')]: {
        display: "none"
      },
    },
  }
}

// TODO; document tab
const forumTabs = {
  LessWrong: [
    {
      id: 'home',
      title: 'Home',
      link: '/',
      class: 'homeIcon',
      icon: compassIcon,
      tooltip: 'Latest posts, comments and curated content.',
    }, {
      id: 'questions',
      title: 'Questions',
      link: '/questions',
      icon: questionsGlobeIcon,
      tooltip: <div>
        <div>• Ask simple newbie questions.</div>
        <div>• Collaborate on open research questions.</div>
        <div>• Pose and resolve confusions.</div>
      </div>
    }, {
      id: 'library',
      title: 'Library',
      link: '/library',
      icon: BookIcon,
      tooltip: "Curated collections of LessWrong's best writing.",
    // next 3 are subItems
    }, {
      id: 'r-az',
      title: 'Rationality: A-Z',
      link: '/rationality',
      tooltip: <div>
        <p>
          LessWrong was founded by Eliezer Yudkowsky. For two years he wrote a blogpost a day about topics including rationality, science, ambition and artificial intelligence.
        </p>
        <p>
          Those posts have been edited down into this introductory collection, recommended for new users.
        </p>
      </div>,
      subItem: true,
    }, {
      id: 'codex',
      title: 'The Codex',
      link: '/codex',
      tooltip: 'The Codex is a collection of essays written by Scott Alexander that discuss how good reasoning works, how to learn from the institution of science, and different ways society has been and could be designed.',
      subItem: true,
    }, {
      id: 'hpmor',
      title: 'HPMOR',
      link: '/hpmor',
      tooltip: 'What if Harry was a scientist? What would you do if the universe had magic in it? A story that illustrates many rationality concepts.',
      subItem: true,
    }, {
      id: 'events',
      title: 'Community Events',
      link: '/community',
      icon: communityGlobeIcon,
      tooltip: 'Find a meetup near you.',
    }, {
      id: 'eventsList',
      customComponent: EventsList,
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
    }, {
      id: 'divider',
      divider: true,
    }, {
      id: 'shortform',
      title: 'Shortform [Beta]',
      link: '/shortform',
      subItem: true,
    // TODO; confirm removal of meta
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
    }, {
      id: 'faq',
      title: 'FAQ',
      link: '/faq',
      subItem: true,
    }
  ],
  AlignmentForum: [
    {
      id: 'home',
      title: 'Home',
      link: '/',
      class: 'homeIcon',
      icon: compassIcon,
      tooltip: 'Latest posts, comments and curated content.'
    }, {
      id: 'questions',
      title: 'Questions',
      link: '/questions',
      icon: questionsGlobeIcon,
      tooltip: <div>
        <div>• Ask simple newbie questions.</div>
        <div>• Collaborate on open research questions.</div>
        <div>• Pose and resolve confusions.</div>
      </div>
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
    }, {
      id: 'divider',
      divider: true,
    }, {
      id: 'shortform',
      title: 'Shortform [Beta]',
      link: '/shortform',
      subItem: true,
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
    }, {
      id: 'faq',
      title: 'FAQ',
      link: '/faq',
      subItem: true,
    }
  ],
  EAForum: [
    // TODO; copy, icons
    {
      id: 'home',
      title: 'Home',
      link: '/',
      class: 'homeIcon',
      icon: compassIcon,
      tooltip: 'Latest posts. TODO;',
    }, {
      id: 'community',
      title: 'Community',
      link: '/meta',
      icon: communityGlobeIcon,
      tooltip: 'Community posts TODO;.',
    }, {
      id: 'questions',
      title: 'Questions',
      link: '/questions',
      icon: questionsGlobeIcon,
      tooltip: <div>
        <div>• Ask simple newbie questions.</div>
        <div>• Collaborate on open research questions.</div>
        <div>• Pose and resolve confusions.</div>
        <div>• TODO; Aaron plz review.</div>
      </div>
    }, {
      id: 'allPosts',
      title: 'All Posts',
      link: '/allPosts',
      icon: allPostsIcon,
      tooltip: 'See all posts, filtered and sorted however you like.',
    }, {
      id: 'divider',
      divider: true,
    }, {
      id: 'shortform',
      title: 'Shortform [Beta]',
      link: '/shortform',
      subItem: true,
    }, {
      id: 'about',
      title: 'About',
      link: '/about',
      subItem: true,
    }, {
      id: 'faq',
      title: 'FAQ',
      link: '/faq',
      subItem: true,
    }
  ]
}

const TabNavigationMenu = ({currentUser, classes, location, open, handleOpen, handleClose}) => {
  const { pathname } = location
  const { TabNavigationSubItem } = Components

  const customComponentProps = {
    currentUser, classes
  }

  return (
    <div className={classes.root}>
      <div className={classes.tabMenu}>
        {forumTabs[getSetting('forumType')].map(tab => {
          // console.log('tab', tab)
          if (tab.divider) {
            return <div key={tab.id} className={classes.divider} />
          }
          if (tab.customComponent) {
            return <tab.customComponent key={tab.id} {...customComponentProps} />
          }
          return <React.Fragment key={tab.id}>
            <Tooltip placement='right-start' title={tab.tooltip || ''}>
              <Link
                to={tab.link}
                className={classNames({
                  [classes.navButton]: !tab.subItem,
                  [classes.selected]: pathname === tab.link
                })}
              >
                {/* TODO; all icons take classname */}
                {tab.icon && <span
                  // TODO; homeIcon
                  className={classNames(classes.icon, {[classes.homeIcon]: tab.id === 'home'})}
                >
                  {tab.id === 'library' ? <tab.icon/> : tab.icon}
                </span>}
                {tab.subItem ?
                  <TabNavigationSubItem>
                    {tab.title}
                  </TabNavigationSubItem> :
                  <span className={classes.navText}>
                    {tab.title}
                  </span>
                }
              </Link>
            </Tooltip>
          </React.Fragment>
        })}
        {/* TODO; better mobile behavior, include way to find faq */}
      </div>
    </div>
  )
};

registerComponent('TabNavigationMenu', TabNavigationMenu, withRouter, withUser, withStyles(styles, { name: 'TabNavigationMenu'}));
