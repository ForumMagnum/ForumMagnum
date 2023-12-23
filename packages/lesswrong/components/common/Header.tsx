import React, { useContext, useState, useCallback, useEffect } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { NoSSR } from '../../lib/utils/componentsWithChildren';
import Headroom from '../../lib/react-headroom'
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import TocIcon from '@material-ui/icons/Toc';
import { useCurrentUser } from '../common/withUser';
import { SidebarsContext } from './SidebarsWrapper';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { PublicInstanceSetting, isEAForum } from '../../lib/instanceSettings';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import { hasProminentLogoSetting } from '../../lib/publicSettings';

import { useLocation } from '../../lib/routeUtil';
import { useIsGivingSeason } from '../ea-forum/giving-portal/hooks';

export const forumHeaderTitleSetting = new PublicInstanceSetting<string>('forumSettings.headerTitle', "LESSWRONG", "warning")
export const forumShortTitleSetting = new PublicInstanceSetting<string>('forumSettings.shortForumTitle', "LW", "warning")
/** Height of top header. On Book UI sites, this is for desktop only */
export const HEADER_HEIGHT = isBookUI ? 64 : 66;
/** Height of top header on mobile. On Friendly UI sites, this is the same as the HEADER_HEIGHT */
export const MOBILE_HEADER_HEIGHT = isBookUI ? 56 : HEADER_HEIGHT;

export const styles = (theme: ThemeType): JssStyles => ({
  appBar: {
    boxShadow: theme.palette.boxShadow.appBar,
    color: theme.palette.header.text,
    backgroundColor: theme.palette.header.background,
    position: "static",
    width: "100%",
    display: "flex",
    zIndex: 1100,
    boxSizing: "border-box",
    flexShrink: 0,
    flexDirection: "column",
    ...(isFriendlyUI ? {
      padding: '1px 20px',
      [theme.breakpoints.down('sm')]: {
        padding: '1px 11px',
      },
      [theme.breakpoints.down('xs')]: {
        padding: '9px 11px',
      },
    } : {})
  },
  root: {
    // This height (including the breakpoint at xs/600px) is set by Headroom, and this wrapper (which surrounds
    // Headroom and top-pads the page) has to match.
    height: HEADER_HEIGHT,
    [theme.breakpoints.down('xs')]: {
      height: MOBILE_HEADER_HEIGHT,
    },
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
  //  maxWidth: 130,
  },
  titleLink: {
    color: theme.palette.header.text,
    fontSize: 19,
    '&:hover, &:active': {
      textDecoration: 'none',
      opacity: 0.7,
    },
    display: 'flex',
    alignItems: 'center',
    fontWeight: isFriendlyUI ? 400 : undefined,
  },
  menuButton: {
    marginLeft: -theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  siteLogo: {
    marginLeft:  -7,
    marginRight: 6,
    [theme.breakpoints.down('sm')]: {
      marginLeft: -12,
      marginRight: 3
    },
  },
  hideLgUp: {
    [theme.breakpoints.up('lg')]: {
      display:"none !important"
    }
  },
  hideMdDown: {
    [theme.breakpoints.down('md')]: {
      display:"none !important"
    }
  },
  hideSmDown: {
    [theme.breakpoints.down('sm')]: {
      display: "none !important",
    },
  },
  hideXsDown: {
    [theme.breakpoints.down('xs')]: {
      display: "none !important",
    },
  },
  hideMdUp: {
    [theme.breakpoints.up('md')]: {
      display: "none !important",
    },
  },
  rightHeaderItems: {
    marginRight: -theme.spacing.unit,
    marginLeft: "auto",
    display: "flex",
    alignItems: isFriendlyUI ? 'center' : undefined,
  },
  // Prevent rearranging of mobile header when search loads after SSR
  searchSSRStandin: {
    minWidth: 48
  },
  headroom: {
    // Styles for header scrolling, provided by react-headroom
    // https://github.com/KyleAMathews/react-headroom
    "& .headroom": {
      top: "unset",
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

const Header = ({
  standaloneNavigationPresent,
  sidebarHidden,
  toggleStandaloneNavigation,
  stayAtTop=false,
  searchResultsArea,
  classes,
}: {
  standaloneNavigationPresent: boolean,
  sidebarHidden: boolean,
  toggleStandaloneNavigation: ()=>void,
  stayAtTop?: boolean,
  searchResultsArea: React.RefObject<HTMLDivElement>,
  classes: ClassesType,
}) => {
  const [navigationOpen, setNavigationOpenState] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationHasOpened, setNotificationHasOpened] = useState(false);
  const [searchOpen, setSearchOpenState] = useState(false);
  const [unFixed, setUnFixed] = useState(true);
  const currentUser = useCurrentUser();
  const {toc} = useContext(SidebarsContext)!;
  const { captureEvent } = useTracking()
  const { unreadNotifications, unreadPrivateMessages, notificationsOpened } = useUnreadNotifications();
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // When we move to a different page we will be positioned at the top of
    // the page (unless the hash is set) but Headroom doesn't run this callback
    // on navigation so we have to do it manually
    if (!hash) {
      setUnFixed(true);
    }
  }, [pathname, hash]);

  const setNavigationOpen = (open: boolean) => {
    setNavigationOpenState(open);
    captureEvent("navigationBarToggle", {open: open})
  }

  const handleSetNotificationDrawerOpen = async (isOpen: boolean): Promise<void> => {
    if (!currentUser) return;
    if (isOpen) {
      setNotificationOpen(true);
      setNotificationHasOpened(true);
      await notificationsOpened();
    } else {
      setNotificationOpen(false);
    }
  }

  const handleNotificationToggle = () => {
    if (!currentUser) return;
    const { lastNotificationsCheck } = currentUser

    captureEvent("notificationsIconToggle", {open: !notificationOpen, previousCheck: lastNotificationsCheck})
    void handleSetNotificationDrawerOpen(!notificationOpen);
  }

  // We do two things when the search is open:
  //  1) Pin the header open with the Headroom component
  //  2) Hide the username on mobile so users with long usernames can still
  //     enter search queries
  // Called by SearchBar.
  const setSearchOpen = useCallback((isOpen: boolean) => {
    if (isOpen) { captureEvent("searchToggle", {"open": isOpen}) }
    setSearchOpenState(isOpen);
  }, [captureEvent]);

  const NavigationMenuButton = () => {
    // The navigation menu button either toggles a free floating sidebar, opens
    // a drawer with site navigation, or a drawer with table of contents. (This
    // is structured a little oddly because the hideSmDown/hideMdUp filters
    // cause a misalignment if they're in the wrong part of the tree.)
    return <React.Fragment>
      {toc?.sectionData?.sections
        ? <>
            <div className={classes.hideSmDown}>
              <IconButton
                className={classNames(
                  classes.menuButton,
                  {[classes.hideLgUp]: standaloneNavigationPresent && unFixed}
                )}
                color="inherit"
                aria-label="Menu"
                onClick={()=>setNavigationOpen(true)}
              >
                <ForumIcon icon="Menu" />
              </IconButton>
            </div>
            <div className={classes.hideMdUp}>
              <IconButton
                className={classNames(
                  classes.menuButton,
                  {[classes.hideLgUp]: standaloneNavigationPresent && unFixed}
                )}
                color="inherit"
                aria-label="Menu"
                onClick={()=>setNavigationOpen(true)}
              >
                <TocIcon />
              </IconButton>
            </div>
          </>
        : <IconButton
            className={classNames(
              classes.menuButton,
              {[classes.hideLgUp]: standaloneNavigationPresent && unFixed}
            )}
            color="inherit"
            aria-label="Menu"
            onClick={()=>setNavigationOpen(true)}
          >
            <ForumIcon icon="Menu" />
          </IconButton>
      }
      {standaloneNavigationPresent && unFixed && <IconButton
        className={classNames(
          classes.menuButton,
          classes.hideMdDown
        )}
        color="inherit"
        aria-label="Menu"
        onClick={toggleStandaloneNavigation}
      >
        {(isFriendlyUI && !sidebarHidden) ? <ForumIcon icon="CloseMenu" /> : <ForumIcon icon="Menu" />}
      </IconButton>}
    </React.Fragment>
  }

  const {
    SearchBar, UsersMenu, UsersAccountMenu, NotificationsMenuButton, NavigationDrawer,
    NotificationsMenu, KarmaChangeNotifier, HeaderSubtitle, Typography, ForumIcon,
    GivingSeasonHeader, ActiveDialogues
  } = Components;
  
  const usersMenuClass = isFriendlyUI ? classes.hideXsDown : classes.hideMdDown
  const usersMenuNode = currentUser && <div className={searchOpen ? usersMenuClass : undefined}>
    <AnalyticsContext pageSectionContext="usersMenu">
      <UsersMenu />
    </AnalyticsContext>
  </div>

  // the items on the right-hand side (search, notifications, user menu, login/sign up buttons)
  const rightHeaderItemsNode = <div className={classes.rightHeaderItems}>
    <NoSSR onSSR={<div className={classes.searchSSRStandin} />} >
      <SearchBar onSetIsActive={setSearchOpen} searchResultsArea={searchResultsArea} />
    </NoSSR>
    {!isFriendlyUI && usersMenuNode}
    {!currentUser && <UsersAccountMenu />}
    {currentUser && !currentUser.usernameUnset && <KarmaChangeNotifier
      currentUser={currentUser}
      className={(isFriendlyUI && searchOpen) ? classes.hideXsDown : undefined}
    />}
    {currentUser && !currentUser.usernameUnset && <NotificationsMenuButton
      unreadNotifications={unreadNotifications}
      toggle={handleNotificationToggle}
      open={notificationOpen}
      className={(isFriendlyUI && searchOpen) ? classes.hideXsDown : undefined}
    />}
    {isFriendlyUI && usersMenuNode}
  </div>

  // the left side nav menu
  const HeaderNavigationDrawer = () => <NavigationDrawer
    open={navigationOpen}
    handleOpen={() => setNavigationOpen(true)}
    handleClose={() => setNavigationOpen(false)}
    toc={toc?.sectionData ?? null}
  />

  // the right side notifications menu
  const HeaderNotificationsMenu = () => currentUser && <NotificationsMenu
    unreadPrivateMessages={unreadPrivateMessages}
    open={notificationOpen}
    hasOpened={notificationHasOpened}
    setIsOpen={handleSetNotificationDrawerOpen}
  />

  // special case for the homepage header of EA Forum Giving Season 2023
  // TODO: delete after 2023
  const isGivingSeason = useIsGivingSeason();
  if ((isGivingSeason && pathname === "/") || (pathname.startsWith("/voting-portal")) || (pathname.startsWith("/giving-portal"))) {
    return (
      <GivingSeasonHeader
        searchOpen={searchOpen}
        hasLogo={hasProminentLogoSetting.get()}
        unFixed={unFixed}
        setUnFixed={setUnFixed}
        NavigationMenuButton={NavigationMenuButton}
        rightHeaderItems={rightHeaderItemsNode}
        HeaderNavigationDrawer={HeaderNavigationDrawer}
        HeaderNotificationsMenu={HeaderNotificationsMenu}
      />
    );
  }

  return (
    <AnalyticsContext pageSectionContext="header">
      <div className={classes.root}>
        <Headroom
          disableInlineStyles
          downTolerance={10} upTolerance={10}
          height={64}
          className={classNames(classes.headroom, {
            [classes.headroomPinnedOpen]: searchOpen,
          })}
          onUnfix={() => setUnFixed(true)}
          onUnpin={() => setUnFixed(false)}
          disable={stayAtTop}
        >
          <header className={classes.appBar}>
            <Toolbar disableGutters={isFriendlyUI}>
              <NavigationMenuButton />
              <Typography className={classes.title} variant="title">
                <div className={classes.hideSmDown}>
                  <div className={classes.titleSubtitleContainer}>
                    <Link to="/" className={classes.titleLink}>
                      {hasProminentLogoSetting.get() && <div className={classes.siteLogo}><Components.SiteLogo/></div>}
                      {forumHeaderTitleSetting.get()}
                    </Link>
                    <HeaderSubtitle />
                  </div>
                </div>
                <div className={classes.hideMdUp}>
                  <Link to="/" className={classes.titleLink}>
                    {hasProminentLogoSetting.get() && <div className={classes.siteLogo}><Components.SiteLogo/></div>}
                    {forumShortTitleSetting.get()}
                  </Link>
                </div>
              </Typography>
              {!isEAForum &&<ActiveDialogues />}
              {rightHeaderItemsNode}
            </Toolbar>
          </header>
          <HeaderNavigationDrawer />
        </Headroom>
        <HeaderNotificationsMenu />
      </div>
    </AnalyticsContext>
  )
}

const HeaderComponent = registerComponent('Header', Header, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    Header: typeof HeaderComponent
  }
}
