import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import Headroom from '../../lib/react-headroom'
import Toolbar from '@/lib/vendor/@material-ui/core/src/Toolbar';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import TocIcon from '@/lib/vendor/@material-ui/icons/src/Toc';
import { useCurrentUserId, useFilteredCurrentUser, useGetCurrentUser } from '../common/withUser';
import { SidebarsContext } from './SidebarsWrapper';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { forumHeaderTitleSetting, forumShortTitleSetting, isAF, hasProminentLogoSetting } from '@/lib/instanceSettings';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { isBookUI, isFriendlyUI } from '../../themes/forumTheme';
import { useLocation } from '../../lib/routeUtil';
import { useCurrentAndRecentForumEvents } from '../hooks/useCurrentForumEvent';
import { makeCloudinaryImageUrl } from '@/components/common/cloudinaryHelpers';
import { hasForumEvents } from '@/lib/betas';
import SearchBar from "@/components/common/SearchBar";
import UsersMenu from "../users/UsersMenu";
import { LWUsersAccountMenu, EAUsersAccountMenu } from "../users/UsersAccountMenu";
import NotificationsMenuButton from "../notifications/NotificationsMenuButton";
import { ICON_ONLY_NAVIGATION_BREAKPOINT } from "@/components/common/TabNavigationMenu/NavigationStandalone";
import NavigationDrawer from "@/components/common/TabNavigationMenu/NavigationDrawer";
import { KarmaChangeNotifier } from "../users/karmaChanges/KarmaChangeNotifier";
import HeaderSubtitle from "@/components/common/HeaderSubtitle";
import { Typography } from "@/components/common/Typography";
import ForumIcon from "@/components/common/ForumIcon";
import SiteLogo from "../ea-forum/SiteLogo";
import MessagesMenuButton from "../messaging/MessagesMenuButton";
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { isHomeRoute } from '@/lib/routeChecks';
import { forumSelect } from '@/lib/forumTypeUtils';
import NotificationsMenu from "../notifications/NotificationsMenu";
import { IsLlmChatSidebarOpenContext } from './Layout';
import { useIsOnGrayBackground } from '../hooks/useIsOnGrayBackground';
import FundraiserBanner from '../common/FundraiserBanner';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_FUNDRAISER_BANNER_COOKIE } from '@/lib/cookies/cookies';
import { useStyles, defineStyles } from '../hooks/useStyles';
import { usePrerenderablePathname } from '../next/usePrerenderablePathname';

/** Height of the fundraiser banner */
export const FUNDRAISER_BANNER_HEIGHT = 34;
export const FUNDRAISER_BANNER_HEIGHT_MOBILE = 32;
/** Height of top header (without fundraiser banner). On Book UI sites, this is for desktop only */
const getHeaderHeight = () => isBookUI() ? 64 : 66;
/** Height of top header on mobile (without fundraiser banner). On Friendly UI sites, this is the same as the HEADER_HEIGHT */
const getMobileHeaderHeight = () => isBookUI() ? 56 : 66;


const textColorOverrideStyles = ({
  theme,
  color,
  contrastColor,
  loginButtonBackgroundColor,
  loginButtonHoverBackgroundColor,
  loginButtonColor,
  signupButtonBackgroundColor,
  signupButtonHoverBackgroundColor,
  signupButtonColor,
}: {
  theme: ThemeType,
  color: string,
  contrastColor?: string,
  loginButtonBackgroundColor?: string,
  loginButtonHoverBackgroundColor?: string,
  loginButtonColor?: string,
  signupButtonBackgroundColor?: string,
  signupButtonHoverBackgroundColor?: string,
  signupButtonColor?: string,
}) => ({
  color,
  boxShadow: 'none',
  "& .Header-titleLink": {
    color,
  },
  "& .HeaderSubtitle-subtitle": {
    color,
  },
  "& .SearchBar-searchIcon": {
    color,
  },
  "& .ais-SearchBox-input": {
    color,
  },
  "& .ais-SearchBox-input::placeholder": {
    color,
  },
  "& .KarmaChangeNotifier-starIcon": {
    color,
  },
  "& .KarmaChangeNotifier-gainedPoints": {
    color,
  },
  "& .NotificationsMenuButton-badge": {
    color,
  },
  "& .NotificationsMenuButton-buttonClosed": {
    color,
  },
  "& .MessagesMenuButton-buttonClosed": {
    color,
  },
  "& .UsersMenu-arrowIcon": {
    color,
  },
  "& .EAButton-variantContained": {
    backgroundColor: signupButtonBackgroundColor ?? color,
    color: signupButtonColor ?? contrastColor,
    "&:hover": {
      backgroundColor: signupButtonHoverBackgroundColor ?? `color-mix(in oklab, ${signupButtonBackgroundColor ?? color} 90%, ${signupButtonColor ?? contrastColor})`,
    },
  },
  "& .EAButton-greyContained": {
    backgroundColor: loginButtonBackgroundColor ?? `color-mix(in oklab, ${loginButtonColor ?? color} 15%, ${contrastColor})`,
    color: loginButtonColor ?? color,
    "&:hover": {
      backgroundColor: loginButtonHoverBackgroundColor ?? `color-mix(in oklab, ${loginButtonColor ?? color} 10%, ${theme.palette.background.transparent}) !important`,
    },
  },
});

const LLM_CHAT_SIDEBAR_WIDTH = 500;

type HeaderHeightContextValue = {
  showFundraiserBanner: boolean;
};
const HeaderHeightContext = createContext<HeaderHeightContextValue>({showFundraiserBanner: true});

export const styles = defineStyles("Header", (theme: ThemeType) => ({
  appBar: {
    boxShadow: theme.palette.boxShadow.appBar,
    color: theme.palette.text.bannerAdOverlay,

    ...(forumSelect({
      LWAF: (theme.dark
        ? {
          background: theme.palette.panelBackground.bannerAdTranslucent,
          backdropFilter: 'blur(4px) brightness(1.1)',
          "&$blackBackgroundAppBar": {
            boxShadow: theme.palette.boxShadow.appBarDarkBackground,
            background: theme.palette.panelBackground.appBarDarkBackground,
          },
        } : {
          backgroundColor: theme.palette.header.background,
          backdropFilter: 'blur(4px)',
          "&$blackBackgroundAppBar": {
            boxShadow: theme.palette.boxShadow.appBar,
            background: theme.palette.header.background,
          },
        }
      ) as any,
      default: {
        backgroundColor: theme.palette.header.background,
      },
    })),
    position: "static",
    width: "100%",
    display: "flex",
    zIndex: 1100,
    boxSizing: "border-box",
    flexShrink: 0,
    flexDirection: "column",
    ...(theme.isFriendlyUI ? {
      maxWidth: "100vw",
      overflow: "hidden",
      padding: '1px 20px',
      [theme.breakpoints.down('sm')]: {
        padding: '1px 11px',
      },
      [theme.breakpoints.down('xs')]: {
        padding: '9px 11px',
      },
    } : {}),
  },
  appBarDarkBackground: {
    ...textColorOverrideStyles({
      theme,
      color: "var(--header-text-color)",
      contrastColor: "var(--header-contrast-color)",
    }),
    "--header-text-color": theme.palette.text.alwaysWhite,
    "--header-contrast-color": theme.palette.text.alwaysBlack,
  },
  blackBackgroundAppBar: {},
  root: {
    // This height (including the breakpoint at xs/600px) is set by Headroom, and this wrapper (which surrounds
    // Headroom and top-pads the page) has to match.
    height: "var(--header-height)",
    "@media print": {
      display: "none"
    }
  },
  titleSubtitleContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  titleFundraiserContainer: {
    display: 'flex',
    flexDirection: 'row',
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
    color: theme.palette.text.bannerAdOverlay,
    fontSize: 19,
    '&:hover, &:active': {
      textDecoration: 'none',
      opacity: 0.7,
    },
    display: 'flex',
    alignItems: 'center',
    fontWeight: theme.isFriendlyUI ? 400 : undefined,
    height: theme.isFriendlyUI ? undefined : '19px',
    
    ...(theme.isAF && {
      top: 0,
    }),
  },
  menuButton: {
    marginLeft: -theme.spacing.unit,
    marginRight: theme.spacing.unit,
  },
  icon: {
    width: 24,
    height: 24,
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
    [theme.breakpoints.up(ICON_ONLY_NAVIGATION_BREAKPOINT)]: {
      display:"none !important"
    }
  },
  hideMdDown: {
    [theme.breakpoints.down(ICON_ONLY_NAVIGATION_BREAKPOINT)]: {
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
    alignItems: theme.isFriendlyUI ? 'center' : undefined,
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
  lightconeFundraiserHeaderItem: {
    color: theme.palette.review.winner,
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: '1.4rem',
    marginLeft: theme.spacing.unit,
  },
  lightconeFundraiserHeaderItemSmall: {
    color: theme.palette.review.winner,
    fontFamily: theme.typography.headerStyle.fontFamily,
    fontSize: '1.4rem',
    fontWeight: 600,
    marginLeft: theme.spacing.unit,
    marginBottom: 1.5,
  },
  reserveSpaceForLlmChatSidebar: {
    [theme.breakpoints.up("lg")]: {
      "& .headroom": {
        width: `calc(100% - ${LLM_CHAT_SIDEBAR_WIDTH}px)`,
      },
    }
  },
  headerHeight: {
    "--header-height": `${getHeaderHeight()}px`,
    [theme.breakpoints.down('xs')]: {
      "--header-height": `${getMobileHeaderHeight()}px`,
    },
  },
  headerHeightWithBanner: {
    "--header-height": `${getHeaderHeight() + FUNDRAISER_BANNER_HEIGHT}px`,
    [theme.breakpoints.down('xs')]: {
      "--header-height": `${getMobileHeaderHeight() + FUNDRAISER_BANNER_HEIGHT_MOBILE}px`,
    },
  },
}));

function getForumEventBackgroundStyle(currentForumEvent: ForumEventsDisplay, bannerImageId: string) {
  const darkColor = currentForumEvent.darkColor;
  return `top / cover no-repeat url(${makeCloudinaryImageUrl(bannerImageId, {
    c: "fill",
    dpr: "auto",
    q: "auto",
    f: "auto",
    g: "north",
  })})${darkColor ? `, ${darkColor}` : ''}`;
}

const Header = ({
  standaloneNavigationPresent,
  sidebarHidden,
  toggleStandaloneNavigation,
  stayAtTop=false,
  searchResultsArea,
  backgroundColor,
}: {
  standaloneNavigationPresent: boolean,
  sidebarHidden: boolean,
  toggleStandaloneNavigation: () => void,
  stayAtTop?: boolean,
  searchResultsArea: React.RefObject<HTMLDivElement|null>,
  // CSS var corresponding to the background color you want to apply (see also appBarDarkBackground above)
  backgroundColor?: string,
}) => {
  const classes = useStyles(styles);
  const [navigationOpen, setNavigationOpenState] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationHasOpened, setNotificationHasOpened] = useState(false);
  const [searchOpen, setSearchOpenState] = useState(false);
  const [unFixed, setUnFixed] = useState(true);
  const { showFundraiserBanner } = useContext(HeaderHeightContext);
  const getCurrentUser = useGetCurrentUser();
  const isLoggedIn = !!useCurrentUserId();
  const usernameUnset = useFilteredCurrentUser(u => !!u?.usernameUnset);
  const {toc} = useContext(SidebarsContext)!;
  const { captureEvent } = useTracking()
  const { notificationsOpened } = useUnreadNotifications();
  const { pathname, hash } = useLocation();
  const {currentForumEvent} = useCurrentAndRecentForumEvents();
  let headerStyle = { ...(backgroundColor ? { backgroundColor } : {}) };

  useEffect(() => {
    // When we move to a different page we will be positioned at the top of
    // the page (unless the hash is set) but Headroom doesn't run this callback
    // on navigation so we have to do it manually
    if (!hash) {
      setUnFixed(true);
    }
  }, [pathname, hash]);

  const hasNotificationsPopover = isFriendlyUI();
  const hasKarmaChangeNotifier = !isFriendlyUI() && isLoggedIn && !usernameUnset;
  const hasMessagesButton = isFriendlyUI() && isLoggedIn && !usernameUnset;

  const setNavigationOpen = (open: boolean) => {
    setNavigationOpenState(open);
    captureEvent("navigationBarToggle", {open: open})
  }

  const handleSetNotificationDrawerOpen = useCallback(async (isOpen: boolean): Promise<void> => {
    if (!isLoggedIn) return;
    if (isOpen) {
      setNotificationOpen(true);
      setNotificationHasOpened(true);
      await notificationsOpened();
    } else {
      setNotificationOpen(false);
    }
  }, [isLoggedIn, notificationsOpened]);

  const handleNotificationToggle = () => {
    const currentUser = getCurrentUser()!
    if (!currentUser) return;
    const { lastNotificationsCheck } = currentUser;

    if (hasNotificationsPopover) {
      captureEvent("notificationsIconToggle", {
        previousCheck: lastNotificationsCheck,
      });
    } else {
      captureEvent("notificationsIconToggle", {
        open: !notificationOpen,
        previousCheck: lastNotificationsCheck,
      });
      void handleSetNotificationDrawerOpen(!notificationOpen);
    }
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

  const navigationMenuButton = (
    // The navigation menu button either toggles a free floating sidebar, opens
    // a drawer with site navigation, or a drawer with table of contents. (This
    // is structured a little oddly because the hideSmDown/hideMdUp filters
    // cause a misalignment if they're in the wrong part of the tree.)
    <React.Fragment>
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
                <ForumIcon icon="Menu" className={classes.icon} />
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
                <TocIcon className={classes.icon} />
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
            <ForumIcon icon="Menu" className={classes.icon} />
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
        {(isFriendlyUI() && !sidebarHidden)
          ? <ForumIcon icon="CloseMenu" className={classes.icon} />
          : <ForumIcon icon="Menu" className={classes.icon} />}
      </IconButton>}
    </React.Fragment>
  )

  const usersMenuClass = isFriendlyUI() ? classes.hideXsDown : classes.hideMdDown
  const usersMenuNode = isLoggedIn && <div className={searchOpen ? usersMenuClass : undefined}>
    <AnalyticsContext pageSectionContext="usersMenu">
      <UsersMenu />
    </AnalyticsContext>
  </div>

  const loginButtonNode = isFriendlyUI() ? <EAUsersAccountMenu /> : <LWUsersAccountMenu />;

  // the items on the right-hand side (search, notifications, user menu, login/sign up buttons)
  const rightHeaderItemsNode = <div className={classNames(classes.rightHeaderItems)}>
    <SearchBar onSetIsActive={setSearchOpen} searchResultsArea={searchResultsArea} />
    {!isFriendlyUI() && usersMenuNode}
    {!isLoggedIn && loginButtonNode}
    {hasKarmaChangeNotifier && <KarmaChangeNotifier
      className={(isFriendlyUI() && searchOpen) ? classes.hideXsDown : undefined}
    />}
    {isLoggedIn && !usernameUnset && <NotificationsMenuButton
      toggle={handleNotificationToggle}
      open={notificationOpen}
      className={(isFriendlyUI() && searchOpen) ? classes.hideXsDown : undefined}
    />}
    {hasMessagesButton && <SuspenseWrapper name="MesagesMenuButton">
      <MessagesMenuButton
        className={(isFriendlyUI() && searchOpen) ? classes.hideXsDown : undefined}
      />
    </SuspenseWrapper>}
    {isFriendlyUI() && usersMenuNode}
  </div>

  // the left side nav menu
  const headerNavigationDrawer = <NavigationDrawer
    open={navigationOpen}
    handleOpen={() => setNavigationOpen(true)}
    handleClose={() => setNavigationOpen(false)}
    toc={toc?.sectionData ?? null}
  />

  // the right side notifications menu
  const headerNotificationsMenu = isLoggedIn && !hasNotificationsPopover
    && (
      <NotificationsMenu
        open={notificationOpen}
        hasOpened={notificationHasOpened}
        setIsOpen={handleSetNotificationDrawerOpen}
      />
    );

  const bannerImageId = currentForumEvent?.bannerImageId

  // Adjust header width when LLM chat sidebar is open and header is fixed
  const llmChatSidebarOpen = useContext(IsLlmChatSidebarOpenContext);

  const setForumEventHeaderStyle = hasForumEvents() && isHomeRoute(pathname) && bannerImageId && currentForumEvent?.eventFormat !== "BASIC" && !backgroundColor;
  if (setForumEventHeaderStyle) {
    const forumEventHeaderStyle = setForumEventHeaderStyle ? {
      background: getForumEventBackgroundStyle(currentForumEvent, bannerImageId),
      "--header-text-color": currentForumEvent.bannerTextColor ?? undefined,
      "--header-contrast-color": currentForumEvent.darkColor ?? undefined,
    } : {};

    headerStyle = {
      ...headerStyle,
      ...(setForumEventHeaderStyle ? forumEventHeaderStyle : {}),
    }
  }

  // Make all the text and icons the same color as the text on the current forum event banner
  const useContrastText = Object.keys(headerStyle).includes('backgroundColor') || Object.keys(headerStyle).includes('background');

  const isGrayBackground = useIsOnGrayBackground();

  return (
    <AnalyticsContext pageSectionContext="header">
      <div className={classes.root}>
        <Headroom
          disableInlineStyles
          downTolerance={1} upTolerance={1}
          height={showFundraiserBanner ? getHeaderHeight() + FUNDRAISER_BANNER_HEIGHT : getHeaderHeight()}
          className={classNames(classes.headroom, {
            [classes.headroomPinnedOpen]: searchOpen,
            [classes.reserveSpaceForLlmChatSidebar]: llmChatSidebarOpen && !unFixed,
          })}
          onUnfix={() => setUnFixed(true)}
          onUnpin={() => setUnFixed(false)}
          disable={stayAtTop}
        >
          {showFundraiserBanner && <FundraiserBanner />}
          <header
            className={classNames(
              classes.appBar,
              useContrastText && classes.appBarDarkBackground,
              !isGrayBackground && classes.blackBackgroundAppBar,
            )}
            style={headerStyle}
          >
            <Toolbar disableGutters={isFriendlyUI()}>
              {navigationMenuButton}
              <Typography className={classes.title} variant="title">
                <div className={classes.hideSmDown}>
                  <div className={classes.titleSubtitleContainer}>
                    <div className={classes.titleFundraiserContainer}>
                      <Link to="/" className={classes.titleLink}>
                        {hasProminentLogoSetting.get() && <div className={classes.siteLogo}><SiteLogo eaContrast={useContrastText}/></div>}
                        {forumHeaderTitleSetting.get()}
                      </Link>
                    </div>
                    <HeaderSubtitle />
                  </div>
                </div>
                <div className={classNames(classes.hideMdUp, classes.titleFundraiserContainer)}>
                  <Link to="/" className={classes.titleLink}>
                    {hasProminentLogoSetting.get() && <div className={classes.siteLogo}><SiteLogo eaContrast={useContrastText}/></div>}
                    {forumShortTitleSetting.get()}
                  </Link>
                </div>
              </Typography>
              {rightHeaderItemsNode}
            </Toolbar>
          </header>
          {headerNavigationDrawer}
        </Headroom>
        {headerNotificationsMenu}
      </div>
    </AnalyticsContext>
  )
}

export const HeaderHeightProvider = ({ children }: { children: React.ReactNode }) => {
  const classes = useStyles(styles);
  const [cookies] = useCookiesWithConsent([HIDE_FUNDRAISER_BANNER_COOKIE]);
  const hideFundraiserBanner = cookies[HIDE_FUNDRAISER_BANNER_COOKIE] === "true";
  const pathname = usePrerenderablePathname();
  const isFrontPage = isHomeRoute(pathname);
  const showFundraiserBanner = !hideFundraiserBanner && isFrontPage;
  const value = useMemo<HeaderHeightContextValue>(() => ({ showFundraiserBanner, }), [showFundraiserBanner]);

  return (
    <HeaderHeightContext.Provider value={value}>
      <span className={classNames(classes.headerHeight, {
        [classes.headerHeightWithBanner]: showFundraiserBanner,
      })}>
        {children}
      </span>
    </HeaderHeightContext.Provider>
  );
};

export default registerComponent('Header', Header, {
  areEqual: "auto",
  hocs: [withErrorBoundary]
});

