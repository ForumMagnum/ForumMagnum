import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withUpdate, getSetting } from 'meteor/vulcan:core';
import { Link } from 'react-router-dom';
import NoSSR from 'react-no-ssr';
import Headroom from 'react-headroom'
import { withStyles, withTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import TocIcon from '@material-ui/icons/Toc';
import Typography from '@material-ui/core/Typography';
import Hidden from '@material-ui/core/Hidden';
import Users from 'meteor/vulcan:users';
import grey from '@material-ui/core/colors/grey';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';

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
    position: "relative",
    top: 3,
    paddingRight: theme.spacing.unit
  },
  titleLink: {
    color: getHeaderTextColor(theme),
    fontSize: 19,
    '&:hover, &:focus, &:active': {
      textDecoration: 'none',
      opacity: 0.7,
    }
  },
  menuButton: {
    marginLeft: -theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  hideOnDesktop: {
    [theme.breakpoints.up('lg')]: {
      display:"none"
    }
  },
  hideOnMobile: {
    [theme.breakpoints.down('md')]: {
      display:"none"
    }
  },
  rightHeaderItems: {
    marginRight: -theme.spacing.unit,
    display: "flex",
  },
  // Prevent rearranging of mobile header when search loads after SSR
  searchSSRStandin: {
    minWidth: 48
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

class Header extends PureComponent {
  state = {
    navigationOpen: false,
    notificationOpen: false,
    notificationHasOpened: false,
    searchOpen: false,
    unFixed: true
  }

  setNavigationOpen = (open) => {
    this.setState({navigationOpen: open})
  }

  handleNotificationToggle = () => {
    this.handleSetNotificationDrawerOpen(!this.state.notificationOpen);
  }

  handleSetNotificationDrawerOpen = (isOpen) => {
    if (isOpen) {
      this.props.updateUser({
        selector: {_id: this.props.currentUser._id},
        data: {lastNotificationsCheck: new Date()}
      })
      this.setState({
        notificationOpen: true,
        notificationHasOpened: true
      })
    } else {
      this.setState({notificationOpen: false})
    }
  }

  // We do two things when the search is open:
  //  1) Pin the header open with the Headroom component
  //  2) Hide the username on mobile so users with long usernames can still
  //     enter search queries
  // Called by SearchBar.
  setSearchOpen = (isOpen) => {
    this.setState({
      searchOpen: isOpen
    });
  }

  renderNavigationMenuButton = () => {
    const {standaloneNavigationPresent, toggleStandaloneNavigation, classes, toc} = this.props
    const { unFixed } = this.state
    return <React.Fragment>
      <IconButton
        className={classNames(
          classes.menuButton,
          {[classes.hideOnDesktop]: standaloneNavigationPresent && unFixed}
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
      {standaloneNavigationPresent && unFixed && <IconButton
        className={classNames(
          classes.menuButton,
          classes.hideOnMobile
        )}
        color="inherit"
        aria-label="Menu"
        onClick={toggleStandaloneNavigation}
      >
        <MenuIcon />
      </IconButton>}
    </React.Fragment>
  }

  render() {
    const { currentUser, classes, theme, toc, searchResultsArea } = this.props
    const { notificationOpen, notificationHasOpened, navigationOpen, searchOpen } = this.state
    const notificationTerms = {view: 'userNotifications', userId: currentUser ? currentUser._id : "", type: "newMessage"}

    const {
      SearchBar, UsersMenu, UsersAccountMenu, NotificationsMenuButton, NavigationDrawer,
      NotificationsMenu, KarmaChangeNotifier, HeaderSubtitle
    } = Components;

    return (
      <div className={classes.root}>
        <Headroom
          disableInlineStyles
          downTolerance={10} upTolerance={10}
          className={classNames(
            classes.headroom,
            { [classes.headroomPinnedOpen]: searchOpen }
          )}
          onUnfix={() => this.setState({unFixed: true})}
          onUnpin={() => this.setState({unFixed: false})}
        >
          <AppBar className={classes.appBar} position="static" color={theme.palette.headerType || "default"}>
            <Toolbar>
              {this.renderNavigationMenuButton()}
              <Typography className={classes.title} variant="h6" color="textSecondary">
                <Hidden smDown implementation="css">
                  <Link to="/" className={classes.titleLink}>
                    {getSetting('forumSettings.headerTitle', 'LESSWRONG')}
                  </Link>
                  <HeaderSubtitle />
                </Hidden>
                <Hidden mdUp implementation="css">
                  <Link to="/" className={classes.titleLink}>
                    {getSetting('forumSettings.shortForumTitle', 'LW')}
                  </Link>
                </Hidden>
              </Typography>
              <div className={classes.rightHeaderItems}>
                <NoSSR onSSR={<div className={classes.searchSSRStandin} />} >
                  <SearchBar onSetIsActive={this.setSearchOpen} searchResultsArea={searchResultsArea} />
                </NoSSR>
                {currentUser && <div className={searchOpen ? classes.hideOnMobile : undefined}>
                    <UsersMenu color={getHeaderTextColor(theme)} />
                  </div>}
                {!currentUser && <UsersAccountMenu color={getHeaderTextColor(theme)} />}
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

Header.propTypes = {
  currentUser: PropTypes.object,
  classes: PropTypes.object.isRequired,
  searchResultsArea: PropTypes.object,
};

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

registerComponent('Header', Header, withErrorBoundary, [withUpdate, withUpdateOptions], withUser, withStyles(styles, { name: 'Header'}), withTheme);
