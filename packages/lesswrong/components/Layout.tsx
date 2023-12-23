import React, {useRef, useState, useCallback, useEffect, FC, ReactNode, useMemo} from 'react';
import { Components, registerComponent } from '../lib/vulcan-lib';
import { useUpdate } from '../lib/crud/withUpdate';
import classNames from 'classnames'
import { useTheme } from './themes/useTheme';
import { useLocation } from '../lib/routeUtil';
import { AnalyticsContext } from '../lib/analyticsEvents'
import { UserContext } from './common/withUser';
import { TimezoneWrapper } from './common/withTimezone';
import { DialogManager } from './common/withDialog';
import { CommentBoxManager } from './hooks/useCommentBox';
import { ItemsReadContextWrapper } from './hooks/useRecordPostView';
import { pBodyStyle } from '../themes/stylePiping';
import { DatabasePublicSetting, googleTagManagerIdSetting } from '../lib/publicSettings';
import { isAF, isLW } from '../lib/instanceSettings';
import { globalStyles } from '../themes/globalStyles/globalStyles';
import { ForumOptions, forumSelect } from '../lib/forumTypeUtils';
import { userCanDo } from '../lib/vulcan-users/permissions';
import { Helmet, NoSSR } from '../lib/utils/componentsWithChildren';
import { DisableNoKibitzContext } from './users/UsersNameDisplay';
import { LayoutOptions, LayoutOptionsContext } from './hooks/useLayoutOptions';
// enable during ACX Everywhere
// import { HIDE_MAP_COOKIE } from '../lib/cookies/cookies';
import { HEADER_HEIGHT } from './common/Header';
import { useCookiePreferences } from './hooks/useCookiesWithConsent';
import { useHeaderVisible } from './hooks/useHeaderVisible';
import StickyBox from '../lib/vendor/react-sticky-box';
import { isFriendlyUI } from '../themes/forumTheme';
import { useIsGivingSeason } from './ea-forum/giving-portal/hooks';

export const petrovBeforeTime = new DatabasePublicSetting<number>('petrov.beforeTime', 0)
const petrovAfterTime = new DatabasePublicSetting<number>('petrov.afterTime', 0)

const STICKY_SECTION_TOP_MARGIN = 20;

// These routes will have the standalone TabNavigationMenu (aka sidebar)
//
// Refer to routes.js for the route names. Or console log in the route you'd
// like to include
const standaloneNavMenuRouteNames: ForumOptions<string[]> = {
  'LessWrong': [
    'home', 'allPosts', 'questions', 'library', 'Shortform', 'Sequences', 'collections', 'nominations', 'reviews',
  ],
  'AlignmentForum': ['alignment.home', 'library', 'allPosts', 'questions', 'Shortform'],
  'EAForum': ['home', 'allPosts', 'questions', 'Shortform', 'eaLibrary', 'tagsSubforum', 'EAForumWrapped'],
  'default': ['home', 'allPosts', 'questions', 'Community', 'Shortform',],
}

/**
 * When a new user signs up, their profile is 'incomplete' (ie; without a display name)
 * and we require them to fill this in in the NewUserCompleteProfile form before continuing.
 * This is a list of route names that the user is allowed to view despite having an
 * 'incomplete' account.
 */
const allowedIncompletePaths: string[] = ["termsOfUse"];

const styles = (theme: ThemeType): JssStyles => ({
  main: {
    paddingTop: theme.spacing.mainLayoutPaddingTop,
    paddingBottom: 15,
    marginLeft: "auto",
    marginRight: "auto",
    background: theme.palette.background.default,
    // Make sure the background extends to the bottom of the page, I'm sure there is a better way to do this
    // but almost all pages are bigger than this anyway so it's not that important
    minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
    gridArea: 'main',
    [theme.breakpoints.down('sm')]: {
      paddingTop: 0,
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  mainNoFooter: {
    paddingBottom: 0,
  },
  mainFullscreen: {
    height: "100%",
    padding: 0,
  },
  mainUnspacedGrid: {
    [theme.breakpoints.down('sm')]: {
      paddingTop: 0,
      paddingLeft: 0,
      paddingRight: 0,
    }
  },
  fullscreen: {
    // The min height of 600px here is so that the page doesn't shrink down completely when the keyboard is open on mobile.
    // I chose 600 as being a bit smaller than the smallest phone screen size, although it's hard to find a good reference
    // for this. Here is one site with a good list from 2018: https://mediag.com/blog/popular-screen-resolutions-designing-for-all/
    height: "max(100vh, 600px)",
    display: "flex",
    flexDirection: "column",
  },
  fullscreenBodyWrapper: {
    flexBasis: 0,
    flexGrow: 1,
    overflow: "auto",
    [theme.breakpoints.down('xs')]: {
      overflow: "visible",
    },
  },
  spacedGridActivated: {
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateAreas: `
        "navSidebar ... main ... sunshine"
      `,
      gridTemplateColumns: `
        minmax(0, min-content)
        minmax(0, 1fr)
        minmax(0, min-content)
        minmax(0, 1.4fr)
        minmax(0, min-content)
      `,
    },
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  unspacedGridActivated: {
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateAreas: `
        "navSidebar main sunshine"
      `,
      gridTemplateColumns: `
        0px
        minmax(0, 1fr)
        minmax(0, min-content)
      `,
    },
    '& .Layout-main': {
      width: '100%',
      paddingTop: 0,
    },
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  eaHomeLayout: {
    display: "flex",
    alignItems: "start",
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  navSidebar: {
    gridArea: 'navSidebar'
  },
  sunshine: {
    gridArea: 'sunshine'
  },
  whiteBackground: {
    background: theme.palette.background.pageActiveAreaBackground,
  },
  '@global': {
    ...globalStyles(theme),
    p: pBodyStyle(theme),
    '.mapboxgl-popup': {
      willChange: 'auto !important',
      zIndex: theme.zIndexes.styledMapPopup
    },
    // Font fallback to ensure that all greek letters just directly render as Arial
    '@font-face': {
      fontFamily: "GreekFallback",
      src: "local('Arial')",
      unicodeRange: 'U+0370-03FF, U+1F00-1FFF' // Unicode range for greek characters
    },
    // Hide the CKEditor table alignment menu
    '.ck-table-properties-form__alignment-row': {
      display: "none !important"
    },
  },
  searchResultsArea: {
    position: "absolute",
    zIndex: theme.zIndexes.searchResults,
    top: 0,
    width: "100%",
  },
  // enable during ACX Everywhere
  hideHomepageMapOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  stickyWrapper: {
    transition: "transform 200ms ease-in-out",
    transform: `translateY(${STICKY_SECTION_TOP_MARGIN}px)`,
    marginBottom: 20,
  },
  stickyWrapperHeaderVisible: {
    transform: `translateY(${HEADER_HEIGHT + STICKY_SECTION_TOP_MARGIN}px)`,
  },
});

const StickyWrapper: FC<{
  eaHomeLayout: boolean,
  headerVisible: boolean,
  headerAtTop: boolean,
  children: ReactNode,
  classes: ClassesType,
}> = ({eaHomeLayout, headerVisible, headerAtTop, children, classes}) =>
  eaHomeLayout
    ? (
      <StickyBox offsetTop={0} offsetBottom={20}>
        <div className={classNames(classes.stickyWrapper, {
          [classes.stickyWrapperHeaderVisible]: headerVisible && !headerAtTop,
        })}>
          {children}
        </div>
      </StickyBox>
    )
    : <>{children}</>;

const Layout = ({currentUser, children, classes}: {
  currentUser: UsersCurrent|null,
  children?: React.ReactNode,
  classes: ClassesType,
}) => {
  const searchResultsAreaRef = useRef<HTMLDivElement|null>(null);
  const [disableNoKibitz, setDisableNoKibitz] = useState(false);
  const [hideNavigationSidebar,setHideNavigationSidebar] = useState(!!(currentUser?.hideNavigationSidebar));
  const theme = useTheme();
  const {currentRoute, pathname} = useLocation();
  const layoutOptionsState = React.useContext(LayoutOptionsContext);
  const { explicitConsentGiven: cookieConsentGiven, explicitConsentRequired: cookieConsentRequired } = useCookiePreferences();
  const showCookieBanner = cookieConsentRequired === true && !cookieConsentGiven;
  const {headerVisible, headerAtTop} = useHeaderVisible();

  // enable during ACX Everywhere
  // const [cookies] = useCookiesWithConsent()
  const renderCommunityMap = false // replace with following line to enable during ACX Everywhere
  // (isLW) && (currentRoute?.name === 'home') && (!currentUser?.hideFrontpageMap) && !cookies[HIDE_MAP_COOKIE]
  
  const {mutate: updateUser} = useUpdate({
    collectionName: "Users",
    fragmentName: 'UsersCurrent',
  });
  
  const toggleStandaloneNavigation = useCallback(() => {
    if (currentUser) {
      void updateUser({
        selector: {_id: currentUser._id},
        data: {
          hideNavigationSidebar: !hideNavigationSidebar
        }
      })
    }
    setHideNavigationSidebar(!hideNavigationSidebar);
  }, [updateUser, currentUser, hideNavigationSidebar]);

  // Some pages (eg post pages) have a solid white background, others (eg front page) have a gray
  // background against which individual elements in the central column provide their own
  // background. (In dark mode this is black and dark gray instead of white and light gray). This
  // is handled by putting `classes.whiteBackground` onto the main wrapper.
  //
  // But, caveat/hack: If the page has horizontal scrolling and the horizontal scrolling is the
  // result of a floating window, the page wrapper doesn't extend far enough to the right. So we
  // also have a `useEffect` which adds a class to `<body>`. (This has to be a useEffect because
  // <body> is outside the React tree entirely. An alternative way to do this would be to change
  // overflow properties so that `<body>` isn't scrollable but a `<div>` in here is.)
  const useWhiteBackground = currentRoute?.background === "white";
  
  useEffect(() => {
    const isWhite = document.body.classList.contains(classes.whiteBackground);
    if (isWhite !== useWhiteBackground) {
      if (useWhiteBackground) {
        document.body.classList.add(classes.whiteBackground);
      } else {
        document.body.classList.remove(classes.whiteBackground);
      }
    }
  }, [useWhiteBackground, classes.whiteBackground]);

  if (!layoutOptionsState) {
    throw new Error("LayoutOptionsContext not set");
  }

  const noKibitzContext = useMemo(
    () => ({ disableNoKibitz, setDisableNoKibitz }),
    [disableNoKibitz, setDisableNoKibitz]
  );

  const isGivingSeason = useIsGivingSeason();
  const renderGivingSeason = isGivingSeason && pathname === "/";

  const render = () => {
    const {
      NavigationStandalone,
      ErrorBoundary,
      Footer,
      Header,
      FlashMessages,
      AnalyticsClient,
      AnalyticsPageInitializer,
      NavigationEventSender,
      PetrovDayWrapper,
      NewUserCompleteProfile,
      CommentOnSelectionPageWrapper,
      SidebarsWrapper,
      IntercomWrapper,
      HomepageCommunityMap,
      CookieBanner,
      AdminToggle,
      SunshineSidebar,
      EAHomeRightHandSide,
      GivingSeasonBanner,
    } = Components;

    const baseLayoutOptions: LayoutOptions = {
      // Check whether the current route is one which should have standalone
      // navigation on the side. If there is no current route (ie, a 404 page),
      // then it should.
      // FIXME: This is using route names, but it would be better if this was
      // a property on routes themselves.
      standaloneNavigation: !currentRoute || forumSelect(standaloneNavMenuRouteNames).includes(currentRoute.name),
      renderSunshineSidebar: !!currentRoute?.sunshineSidebar && !!(userCanDo(currentUser, 'posts.moderate.all') || currentUser?.groups?.includes('alignmentForumAdmins')),
      shouldUseGridLayout: !currentRoute || forumSelect(standaloneNavMenuRouteNames).includes(currentRoute.name),
      unspacedGridLayout: !!currentRoute?.unspacedGrid,
    }

    const { overridenLayoutOptions: overrideLayoutOptions } = layoutOptionsState

    const standaloneNavigation = overrideLayoutOptions.standaloneNavigation ?? baseLayoutOptions.standaloneNavigation
    const renderSunshineSidebar = overrideLayoutOptions.renderSunshineSidebar ?? baseLayoutOptions.renderSunshineSidebar
    const shouldUseGridLayout = overrideLayoutOptions.shouldUseGridLayout ?? baseLayoutOptions.shouldUseGridLayout
    const unspacedGridLayout = overrideLayoutOptions.unspacedGridLayout ?? baseLayoutOptions.unspacedGridLayout
    // The friendly home page has a unique grid layout, to account for the right hand side column.
    const friendlyHomeLayout = isFriendlyUI && currentRoute?.name === 'home'

    const showNewUserCompleteProfile = currentUser?.usernameUnset &&
      !allowedIncompletePaths.includes(currentRoute?.name ?? "404");

    const renderPetrovDay = () => {
      const currentTime = (new Date()).valueOf()
      const beforeTime = petrovBeforeTime.get()
      const afterTime = petrovAfterTime.get()
    
      return currentRoute?.name === "home" && isLW
        && beforeTime < currentTime
        && currentTime < afterTime
    }

    return (
      <AnalyticsContext path={pathname}>
      <UserContext.Provider value={currentUser}>
      <TimezoneWrapper>
      <ItemsReadContextWrapper>
      <SidebarsWrapper>
      <DisableNoKibitzContext.Provider value={noKibitzContext}>
      <CommentOnSelectionPageWrapper>
        <div className={classNames(
          "wrapper",
          {'alignment-forum': isAF, [classes.fullscreen]: currentRoute?.fullscreen}
        )} id="wrapper">
          <DialogManager>
            <CommentBoxManager>
              <Helmet>
                {theme.typography.fontDownloads &&
                  theme.typography.fontDownloads.map(
                    (url: string)=><link rel="stylesheet" key={`font-${url}`} href={url}/>
                  )
                }
                <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
              </Helmet>

              <AnalyticsClient/>
              <AnalyticsPageInitializer/>
              <NavigationEventSender/>
              {/* Only show intercom after they have accepted cookies */}
              <NoSSR>
                {showCookieBanner ? <CookieBanner /> : <IntercomWrapper/>}
              </NoSSR>

              <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
              {/* Google Tag Manager i-frame fallback */}
              <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerIdSetting.get()}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>

              {!currentRoute?.standalone && <Header
                searchResultsArea={searchResultsAreaRef}
                standaloneNavigationPresent={standaloneNavigation}
                sidebarHidden={hideNavigationSidebar}
                toggleStandaloneNavigation={toggleStandaloneNavigation}
                stayAtTop={!!currentRoute?.staticHeader}
              />}
              {/* enable during ACX Everywhere */}
              {renderCommunityMap && <span className={classes.hideHomepageMapOnMobile}><HomepageCommunityMap dontAskUserLocation={true}/></span>}
              {renderPetrovDay() && <PetrovDayWrapper/>}
              {renderGivingSeason && <GivingSeasonBanner />}

              <div className={classNames(classes.standaloneNavFlex, {
                [classes.spacedGridActivated]: shouldUseGridLayout && !unspacedGridLayout,
                [classes.unspacedGridActivated]: shouldUseGridLayout && unspacedGridLayout,
                [classes.eaHomeLayout]: friendlyHomeLayout && !renderSunshineSidebar,
                [classes.fullscreenBodyWrapper]: currentRoute?.fullscreen,
              }
              )}>
                {isFriendlyUI && <AdminToggle />}
                {standaloneNavigation &&
                  <StickyWrapper
                    eaHomeLayout={friendlyHomeLayout}
                    headerVisible={headerVisible}
                    headerAtTop={headerAtTop}
                    classes={classes}
                  >
                    <NavigationStandalone
                      sidebarHidden={hideNavigationSidebar}
                      unspacedGridLayout={unspacedGridLayout}
                      noTopMargin={friendlyHomeLayout}
                    />
                  </StickyWrapper>
                }
                <div ref={searchResultsAreaRef} className={classes.searchResultsArea} />
                <div className={classNames(classes.main, {
                  [classes.whiteBackground]: useWhiteBackground,
                  [classes.mainNoFooter]: currentRoute?.noFooter,
                  [classes.mainFullscreen]: currentRoute?.fullscreen,
                  [classes.mainUnspacedGrid]: shouldUseGridLayout && unspacedGridLayout,
                })}>
                  <ErrorBoundary>
                    <FlashMessages />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    {showNewUserCompleteProfile
                      ? <NewUserCompleteProfile currentUser={currentUser}/>
                      : children
                    }
                  </ErrorBoundary>
                  {!currentRoute?.fullscreen && !currentRoute?.noFooter && <Footer />}
                </div>
                {!renderSunshineSidebar &&
                  friendlyHomeLayout &&
                  !showNewUserCompleteProfile &&
                  <StickyWrapper
                    eaHomeLayout={friendlyHomeLayout}
                    headerVisible={headerVisible}
                    headerAtTop={headerAtTop}
                    classes={classes}
                  >
                    <EAHomeRightHandSide />
                  </StickyWrapper>
                }
                {renderSunshineSidebar && <div className={classes.sunshine}>
                  <NoSSR>
                    <SunshineSidebar/>
                  </NoSSR>
                </div>}
              </div>
            </CommentBoxManager>
          </DialogManager>
        </div>
      </CommentOnSelectionPageWrapper>
      </DisableNoKibitzContext.Provider>
      </SidebarsWrapper>
      </ItemsReadContextWrapper>
      </TimezoneWrapper>
      </UserContext.Provider>
      </AnalyticsContext>
    )
  };
  return render();
}

const LayoutComponent = registerComponent('Layout', Layout, {styles});

declare global {
  interface ComponentTypes {
    Layout: typeof LayoutComponent
  }
}
