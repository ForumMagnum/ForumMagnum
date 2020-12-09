import React, { PureComponent } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdateCurrentUser, WithUpdateCurrentUserProps } from '../hooks/useUpdateCurrentUser';
import { Link } from '../../lib/reactRouterWrapper';
import NoSSR from 'react-no-ssr';
import Headroom from '../../lib/react-headroom'
import { withTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import TocIcon from '@material-ui/icons/Toc';
import grey from '@material-ui/core/colors/grey';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { withTracking, AnalyticsContext } from '../../lib/analyticsEvents';
import { forumTypeSetting, PublicInstanceSetting } from '../../lib/instanceSettings';

const forumHeaderTitleSetting = new PublicInstanceSetting<string>('forumSettings.headerTitle', "LESSWRONG", "warning")
const forumShortTitleSetting = new PublicInstanceSetting<string>('forumSettings.shortForumTitle', "LW", "warning")
export const getHeaderTextColor = (theme: ThemeType) => {
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

const styles = (theme: ThemeType): JssStyles => ({
  appBar: {
    boxShadow: "0 1px 1px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.05)",
  },
  root: {
    // This height (including the breakpoint at xs/600px) is set by Headroom, and this wrapper (which surrounds
    // Headroom and top-pads the page) has to match.
    height: 64,
    [theme.breakpoints.down('xs')]: {
      height: 56,
    },
    
    flexGrow: 1,
    "@media print": {
      display: "none"
    }
  },
  titleSubtitleContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  title: {
    flex: 1,
    position: "relative",
    top: 3,
    paddingRight: theme.spacing.unit,
    color: theme.palette.text.secondary,
  },
  titleLink: {
    color: getHeaderTextColor(theme),
    fontSize: 19,
    '&:hover, &:focus, &:active': {
      textDecoration: 'none',
      opacity: 0.7,
    },
    display: 'flex',
    alignItems: 'center',
  },
  menuButton: {
    marginLeft: -theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  siteLogo: {
    marginLeft: -theme.spacing.unit * 1.5,
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
  hideSmDown: {
    [theme.breakpoints.down('sm')]: {
      display: "none",
    },
  },
  hideMdUp: {
    [theme.breakpoints.up('md')]: {
      display: "none",
    },
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

interface ExternalProps {
  standaloneNavigationPresent: any,
  toggleStandaloneNavigation: any,
  toc: any,
  searchResultsArea: any,
}
interface HeaderProps extends ExternalProps, WithUserProps, WithStylesProps, WithTrackingProps, WithUpdateCurrentUserProps {
  theme: ThemeType,
}
interface HeaderState {
  navigationOpen: boolean,
  notificationOpen: boolean,
  notificationHasOpened: boolean,
  searchOpen: boolean,
  unFixed: boolean,
}
class Header extends PureComponent<HeaderProps,HeaderState> {
  state: HeaderState = {
    navigationOpen: false,
    notificationOpen: false,
    notificationHasOpened: false,
    searchOpen: false,
    unFixed: true
  }

  setNavigationOpen = (open) => {
    const { captureEvent } = this.props
    this.setState({navigationOpen: open})
    captureEvent("navigationBarToggle", {open: open})
  }

  handleNotificationToggle = () => {
    const { notificationOpen } = this.state
    const { captureEvent, currentUser } = this.props
    if (!currentUser) return;
    const { lastNotificationsCheck } = currentUser

    captureEvent("notificationsIconToggle", {open: !notificationOpen, previousCheck: lastNotificationsCheck})
    this.handleSetNotificationDrawerOpen(!notificationOpen);
  }

  handleSetNotificationDrawerOpen = (isOpen: boolean): void => {
    const { updateCurrentUser, currentUser } = this.props;
    if (!currentUser) return;
    if (isOpen) {
      void updateCurrentUser({lastNotificationsCheck: new Date()});
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
    const { captureEvent } = this.props
    if (isOpen) { captureEvent("searchToggle", {"open": isOpen}) }
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
            <div className={classes.hideSmDown}>
              <MenuIcon />
            </div>
            <div className={classes.hideMdUp}>
              <TocIcon />
            </div>
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
    const notificationTerms: NotificationsViewTerms = {view: 'userNotifications', userId: currentUser ? currentUser._id : "", type: "newMessage"}
    const hasLogo = forumTypeSetting.get() === 'EAForum'

    const {
      SearchBar, UsersMenu, UsersAccountMenu, NotificationsMenuButton, NavigationDrawer,
      NotificationsMenu, KarmaChangeNotifier, HeaderSubtitle, Typography
    } = Components;

    return (
        <AnalyticsContext pageSectionContext="header">
          <div className={classes.root}>
            <Headroom
              disableInlineStyles
              downTolerance={10} upTolerance={10}
              height={64}
              className={classNames(
                classes.headroom,
                { [classes.headroomPinnedOpen]: searchOpen }
              )}
              onUnfix={() => this.setState({unFixed: true})}
              onUnpin={() => this.setState({unFixed: false})}
            >
              <AppBar className={classes.appBar} position="static" color={theme.palette.headerType || "default"}>
                  <Toolbar disableGutters={forumTypeSetting.get() === 'EAForum'}>
                  {this.renderNavigationMenuButton()}
                  <Typography className={classes.title} variant="title">
                    <div className={classes.hideSmDown}>
                      <div className={classes.titleSubtitleContainer}>
                        <Link to="/" className={classes.titleLink}>
                          {hasLogo && <div className={classes.siteLogo}><Components.SiteLogo/></div>}
                          {forumHeaderTitleSetting.get()}
                        </Link>
                        <HeaderSubtitle />
                      </div>
                    </div>
                    <div className={classes.hideMdUp}>
                      <Link to="/" className={classes.titleLink}>
                        {hasLogo && <div className={classes.siteLogo}><Components.SiteLogo/></div>}
                        {forumShortTitleSetting.get()}
                      </Link>
                    </div>
                  </Typography>
                  <div className={classes.rightHeaderItems}>
                    <NoSSR onSSR={<div className={classes.searchSSRStandin} />} >
                      <SearchBar onSetIsActive={this.setSearchOpen} searchResultsArea={searchResultsArea} />
                    </NoSSR>
                    {currentUser && <div className={searchOpen ? classes.hideOnMobile : undefined}>
                        <AnalyticsContext pageSectionContext="usersMenu">
                          <UsersMenu color={getHeaderTextColor(theme)} />
                        </AnalyticsContext>
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
        </AnalyticsContext>
    )
  }
}

const HeaderComponent = registerComponent<ExternalProps>('Header', Header, {
  styles,
  hocs: [
    withErrorBoundary,
    withUpdateCurrentUser,
    withUser, withTracking,
    withTheme(),
  ]
});

declare global {
  interface ComponentTypes {
    Header: typeof HeaderComponent
  }
}
