import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withEdit, getSetting } from 'meteor/vulcan:core';
import { withRouter, Link } from '../../lib/reactRouterWrapper.js';
import NoSSR from 'react-no-ssr';
import Headroom from 'react-headroom'
import { withStyles, withTheme } from '@material-ui/core/styles';
// import withWidth from '@material-ui/core/withWidth';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import TocIcon from '@material-ui/icons/Toc';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import { withApollo } from 'react-apollo';
import Users from 'meteor/vulcan:users';
import getHeaderSubtitleData from '../../lib/modules/utils/getHeaderSubtitleData';
import grey from '@material-ui/core/colors/grey';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
// import { isMobileByWidth } from '../../lib/modules/utils/isMobile.js';
// import { isMobileByScreensize } from '../../lib/modules/utils/isMobile.js';

export const getHeaderTextColor = theme => {
  if (theme.palette.headerType === 'primary') {
    return theme.palette.primary.contrastText
  } else if (theme.palette.headerType === 'secondary') {
    return theme.palette.secondary.contrastText
  } else if (theme.palette.type === "dark") {
    return theme.palette.getContrastText(grey[900])
  } else {
    return theme.palette.getContrastText(grey[100])
  }
}

const styles = theme => ({
  appBar: {
    boxShadow: "0 1px 1px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.05)",
  },
  root: {
    flexGrow: 1,
    "@media print": {
      display: "none"
    }
  },
  title: {
    flex: 1,
  },
  titleLink: {
    color: getHeaderTextColor(theme),
    verticalAlign: 'middle',
    fontSize: 19,
    position: "relative",
    display: 'inline-flex',
    alignItems: 'center',
    top: 3,
    '&:hover, &:focus, &:active': {
      textDecoration: 'none',
      opacity: 0.7,
    }
  },
  subtitle: {
    marginLeft: '1em',
    paddingLeft: '1em',
    textTransform: 'uppercase',
    borderLeft: `1px solid ${grey[400]}`,
  },
  menuButton: {
    marginLeft: -theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  hideOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display:"none"
    }
  },
  rightHeaderItems: {
    marginRight: -theme.spacing.unit,
    display: "flex",
  },
  headroom: {
    // Styles for header scrolling, provided by react-headroom
    // https://github.com/KyleAMathews/react-headroom
    "& .headroom": {
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1300,
    },
    "& .headroom--unfixed": {
      position: "relative",
      transform: "translateY(0)",
    },
    "& .headroom--scrolled": {
      transition: "transform 200ms ease-in-out",
    },
    "& .headroom--unpinned": {
      position: "fixed",
      transform: "translateY(-100%)",
    },
    "& .headroom--pinned": {
      position: "fixed",
      transform: "translateY(0%)",
    },
  },
  headroomPinnedOpen: {
    "& .headroom--unpinned": {
      transform: "none !important",
    },
    "& .headroom--unfixed": {
      position: "fixed !important",
    },
  },
});

class Header extends Component {
  state = {
    navigationOpen: false,
    notificationOpen: false,
    notificationHasOpened: false,
    headroomPinnedOpen: false,
  }

  setNavigationOpen = (open) => {
    this.setState({navigationOpen: open})
  }

  handleNotificationToggle = () => {
    this.handleSetNotificationDrawerOpen(!this.state.notificationOpen);
  }

  handleSetNotificationDrawerOpen = (isOpen) => {
    if (isOpen) {
      this.props.editMutation({
        documentId: this.props.currentUser._id,
        set: {lastNotificationsCheck: new Date()},
        unset: {}
      })
      this.setState({
        notificationOpen: true,
        notificationHasOpened: true
      })
    } else {
      this.setState({notificationOpen: false})
    }
  }

  // Set whether Headroom (the auto-hiding top bar) is pinned so it doesn't
  // hide on scroll. Called by SearchBar, which pins the header open when a
  // search is active.
  setHeadroomPinnedOpen = (isPinned) => {
    this.setState({
      headroomPinnedOpen: isPinned
    });
  }

  render() {
    const {
      currentUser, classes, routes, location, params, client, theme, toc, searchResultsArea,
      standaloneNavigationPresent, width
    } = this.props
    const { notificationOpen, notificationHasOpened, navigationOpen, headroomPinnedOpen } = this.state
    const routeName = routes[1].name
    const query = location && location.query
    const { subtitleLink = "", subtitleText = "" } = getHeaderSubtitleData(routeName, query, params, client) || {}
    const notificationTerms = {view: 'userNotifications', userId: currentUser ? currentUser._id : "", type: "newMessage"}

    // console.log('navopen', navigationOpen)
    // console.log('width', width)
    // console.log('isMobile', isMobileByWidth(width, {mdIsMobile: false}))
    // console.log('isMobile', isMobileByScreensize())
    // const showNavigationDrawer = standaloneNavigationPresent && true

    const {
      SearchBar, UsersMenu, UsersAccountMenu, NotificationsMenuButton, NavigationDrawer,
      NotificationsMenu, KarmaChangeNotifier
    } = Components;

    return (
      <div className={classes.root}>
        <Headroom
          disableInlineStyles
          downTolerance={10} upTolerance={10}
          className={classNames(
            classes.headroom,
            { [classes.headroomPinnedOpen]: headroomPinnedOpen }
          )}
        >
          <AppBar className={classes.appBar} position="static" color={theme.palette.headerType || "default"}>
            <Toolbar>
              <IconButton
                className={classNames(
                  classes.menuButton,
                  {[classes.hideOnDesktop]: standaloneNavigationPresent}
                )}
                color="inherit"
                aria-label="Menu"
                onClick={()=>this.setNavigationOpen(true)}
              >
              {/* Show the ToC icon if there's a table of contents being displayed  */}
                {toc && toc.sections ? (
                  <span>
                    <Hidden smDown implementation="css">
                      <MenuIcon />
                    </Hidden>
                    <Hidden mdUp implementation="css">
                      <TocIcon />
                    </Hidden>
                  </span>
                ) : <MenuIcon />}
              </IconButton>
              <Typography className={classes.title} variant="title" color="textSecondary">
                <Hidden smDown implementation="css">
                  <Link to="/" className={classes.titleLink}>
                    <Components.SiteLogo/>
                    {getSetting('forumSettings.headerTitle', 'LESSWRONG')}
                  </Link>
                  {subtitleLink && <span className={classes.subtitle}>
                    <Link to={subtitleLink} className={classes.titleLink}>
                      {subtitleText}
                    </Link>
                  </span>}
                </Hidden>
                <Hidden mdUp implementation="css">
                  <Link to="/" className={classes.titleLink}>
                    <Components.SiteLogo/>
                    {getSetting('forumSettings.shortForumTitle', 'LW')}
                  </Link>
                </Hidden>
              </Typography>
              <div className={classes.rightHeaderItems}>
                <NoSSR>
                  <SearchBar onSetIsActive={this.setHeadroomPinnedOpen} searchResultsArea={searchResultsArea} />
                </NoSSR>
                {currentUser ? <UsersMenu color={getHeaderTextColor(theme)} /> : <UsersAccountMenu color={getHeaderTextColor(theme)} />}
                {currentUser && <KarmaChangeNotifier documentId={currentUser._id}/>}
                {currentUser && <NotificationsMenuButton color={getHeaderTextColor(theme)} toggle={this.handleNotificationToggle} terms={{view: 'userNotifications', userId: currentUser._id}} open={notificationOpen}/>}
              </div>
            </Toolbar>
          </AppBar>
          <NavigationDrawer
            open={navigationOpen}
            handleOpen={() => this.setNavigationOpen(true)}
            handleClose={() => this.setNavigationOpen(false)}
            toc={toc}
          />
        </Headroom>
        {currentUser && <NotificationsMenu open={notificationOpen} hasOpened={notificationHasOpened} terms={notificationTerms} setIsOpen={this.handleSetNotificationDrawerOpen} />}
      </div>
    )
  }
}

Header.displayName = "Header";

Header.propTypes = {
  currentUser: PropTypes.object,
  classes: PropTypes.object.isRequired,
  routes: PropTypes.array.isRequired,
  location: PropTypes.object.isRequired,
  params: PropTypes.object,
  client: PropTypes.object.isRequired,
  searchResultsArea: PropTypes.object,
};

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

// withWidth(),
registerComponent('Header', Header, withErrorBoundary, withRouter, withApollo, [withEdit, withEditOptions], withUser, withStyles(styles, { name: 'Header'}), withTheme());
