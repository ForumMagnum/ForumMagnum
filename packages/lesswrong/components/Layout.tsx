import React, {useRef, useState, useCallback, useEffect, FC, ReactNode, useMemo} from 'react';
import { registerComponent } from '../lib/vulcan-lib/components';
import classNames from 'classnames'
import { useTheme } from './themes/useTheme';
import { useLocation } from '../lib/routeUtil';
import { AnalyticsContext } from '../lib/analyticsEvents'
import { UserContext, UserContextProvider } from './common/withUser';
import { TimezoneWrapper } from './common/withTimezone';
import { DialogManager } from './common/withDialog';
import { CommentBoxManager } from './hooks/useCommentBox';
import { ItemsReadContextWrapper } from './hooks/useRecordPostView';
import { pBodyStyle } from '../themes/stylePiping';
import { DatabasePublicSetting, blackBarTitle, googleTagManagerIdSetting } from '../lib/publicSettings';
import { isAF, isEAForum, isLW, isLWorAF } from '../lib/instanceSettings';
import { globalStyles } from '../themes/globalStyles/globalStyles';
import { userCanDo } from '../lib/vulcan-users/permissions';
import { Helmet } from "./common/Helmet";
import { DisableNoKibitzContext } from './users/UsersNameDisplay';
import { LayoutOptions, LayoutOptionsContext } from './hooks/useLayoutOptions';
// enable during ACX Everywhere
// import { HIDE_MAP_COOKIE } from '../lib/cookies/cookies';
import Header, { HEADER_HEIGHT } from './common/Header';
import { useCookiePreferences } from './hooks/useCookiesWithConsent';
import { useHeaderVisible } from './hooks/useHeaderVisible';
import StickyBox from '../lib/vendor/react-sticky-box';
import { isFriendlyUI } from '../themes/forumTheme';
import { requireCssVar } from '../themes/cssVars';
import { UnreadNotificationsContextProvider } from './hooks/useUnreadNotifications';
import { CurrentAndRecentForumEventsProvider } from './hooks/useCurrentForumEvent';
export const petrovBeforeTime = new DatabasePublicSetting<number>('petrov.beforeTime', 0)
export const petrovAfterTime = new DatabasePublicSetting<number>('petrov.afterTime', 0)

import { LoginPopoverContextProvider } from './hooks/useLoginPopoverContext';
import DeferRender from './common/DeferRender';
import { userHasLlmChat } from '@/lib/betas';
import { AutosaveEditorStateContext } from './editor/EditorFormComponent';

import GlobalButtonBurst, { buttonBurstSetting } from './ea-forum/GlobalButtonBurst';
import NavigationStandalone from "./common/TabNavigationMenu/NavigationStandalone";
import ErrorBoundary from "./common/ErrorBoundary";
import Footer from "./common/Footer";
import FlashMessages from "./common/FlashMessages";
import AnalyticsClient from "./common/AnalyticsClient";
import AnalyticsPageInitializer from "./common/AnalyticsPageInitializer";
import EAOnboardingFlow from "./ea-forum/onboarding/EAOnboardingFlow";
import BasicOnboardingFlow from "./onboarding/BasicOnboardingFlow";
import { CommentOnSelectionPageWrapper } from "./comments/CommentOnSelection";
import SidebarsWrapper from "./common/SidebarsWrapper";
import HomepageCommunityMap from "./seasonal/HomepageMap/HomepageCommunityMap";
import AdminToggle from "./admin/AdminToggle";
import SunshineSidebar from "./sunshineDashboard/SunshineSidebar";
import EAHomeRightHandSide from "./ea-forum/EAHomeRightHandSide";
import ForumEventBanner from "./forumEvents/ForumEventBanner";
import GlobalHotkeys from "./common/GlobalHotkeys";
import LanguageModelLauncherButton from "./languageModels/LanguageModelLauncherButton";
import LlmChatWrapper from "./languageModels/LlmChatWrapper";
import LWBackgroundImage from "./LWBackgroundImage";
import IntercomWrapper from "./common/IntercomWrapper";
import CookieBanner from "./common/CookieBanner/CookieBanner";
import { defineStyles, useStyles } from './hooks/useStyles';
import { useMutationNoCache } from '@/lib/crud/useMutationNoCache';
import { gql } from "@/lib/generated/gql-codegen";
import { DelayedLoading } from './common/DelayedLoading';
import { SuspenseWrapper } from './common/SuspenseWrapper';

const UsersCurrentUpdateMutation = gql(`
  mutation updateUserLayout($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...UsersCurrent
      }
    }
  }
`);

const STICKY_SECTION_TOP_MARGIN = 20;

/**
 * When a new user signs up, their profile is 'incomplete' (ie; without a display name)
 * and we require them to fill this in using the onboarding flow before continuing.
 * This is a list of route names that the user is allowed to view despite having an
 * 'incomplete' account.
 */
const allowedIncompletePaths: string[] = ["termsOfUse"];

const styles = defineStyles("Layout", (theme: ThemeType) => ({
  main: {
    paddingTop: theme.spacing.mainLayoutPaddingTop,
    paddingBottom: 15,
    marginLeft: "auto",
    marginRight: "auto",
    // Make sure the background extends to the bottom of the page, I'm sure there is a better way to do this
    // but almost all pages are bigger than this anyway so it's not that important
    minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
    gridArea: 'main',
    [theme.breakpoints.down('md')]: {
      paddingTop: isFriendlyUI ? 0 : theme.spacing.mainLayoutPaddingTop,
    },
    [theme.breakpoints.down('sm')]: {
      paddingTop: isFriendlyUI ? 0 : 10,
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  wrapper: {
    position: 'relative',
    overflowX: 'clip'
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
        "navSidebar ... main imageGap sunshine"
      `,
      gridTemplateColumns: `
        minmax(0, min-content)
        minmax(0, 1fr)
        minmax(0, min-content)
        minmax(0, ${isLWorAF ? 7 : 1}fr)
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
  languageModelLauncher: {
    position: 'absolute',
    top: '-57px',
    right: '-334px',
    [theme.breakpoints.down('lg')]: {
      display: 'none',
    }
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
    '@font-face': [{
        fontFamily: "GreekFallback",
        src: "local('Arial')",
        unicodeRange: 'U+0370-03FF, U+1F00-1FFF' // Unicode range for greek characters
      },
      {
        fontFamily: "ETBookRoman",
        src: "url('https://res.cloudinary.com/lesswrong-2-0/raw/upload/v1723063815/et-book-roman-line-figures_tvofzs.woff') format('woff')",  
      },
    ],
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
}));

const wrappedBackgroundColor = requireCssVar("palette", "wrapped", "background")

const StickyWrapper = ({children}: {
  children: ReactNode,
}) => {
  const classes = useStyles(styles);
  const {headerVisible, headerAtTop} = useHeaderVisible();

  return <StickyBox offsetTop={0} offsetBottom={20}>
    <div className={classNames(classes.stickyWrapper, {
      [classes.stickyWrapperHeaderVisible]: headerVisible && !headerAtTop,
    })}>
      {children}
    </div>
  </StickyBox>
}

const MaybeStickyWrapper: FC<{
  sticky: boolean,
  children: ReactNode,
}> = ({sticky, children}) => {
  return sticky
    ? <StickyWrapper>{children}</StickyWrapper>
    : <>{children}</>;
}

const Layout = ({currentUser, children}: {
  currentUser: UsersCurrent|null,
  children?: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const currentUserId = currentUser?._id;
  const searchResultsAreaRef = useRef<HTMLDivElement|null>(null);
  const [disableNoKibitz, setDisableNoKibitz] = useState(false); 
  const [autosaveEditorState, setAutosaveEditorState] = useState<(() => Promise<void>) | null>(null);
  const hideNavigationSidebarDefault = currentUser ? !!(currentUser?.hideNavigationSidebar) : false
  const [hideNavigationSidebar,setHideNavigationSidebar] = useState(hideNavigationSidebarDefault);
  const theme = useTheme();
  const {currentRoute, pathname} = useLocation();
  const layoutOptionsState = React.useContext(LayoutOptionsContext);

  // enable during ACX Everywhere
  // const [cookies] = useCookiesWithConsent()
  const renderCommunityMap = false // replace with following line to enable during ACX Everywhere
  // (isLW) && (currentRoute?.name === 'home') && (!currentUser?.hideFrontpageMap) && !cookies[HIDE_MAP_COOKIE]
  
  const [updateUserNoCache] = useMutationNoCache(UsersCurrentUpdateMutation);
  
  const toggleStandaloneNavigation = useCallback(() => {
    if (currentUserId) {
      void updateUserNoCache({
        variables: {
          selector: { _id: currentUserId },
          data: {
            hideNavigationSidebar: !hideNavigationSidebar
          }
        }
      })
    }
    setHideNavigationSidebar(!hideNavigationSidebar);
  }, [updateUserNoCache, currentUserId, hideNavigationSidebar]);

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

  const autosaveEditorStateContext = useMemo(
    () => ({ autosaveEditorState, setAutosaveEditorState }),
    [autosaveEditorState, setAutosaveEditorState]
  );

  const isWrapped = pathname.startsWith('/wrapped');

  let headerBackgroundColor: ColorString;
  // For the EAF Wrapped page, we change the header's background color to a dark blue.
  if (isWrapped) {
    headerBackgroundColor = wrappedBackgroundColor;
  } else if (pathname.startsWith("/voting-portal")) {
    headerBackgroundColor = "transparent";
  } else if (blackBarTitle.get()) {
    headerBackgroundColor = 'rgba(0, 0, 0, 0.7)';
  }

  const render = () => {
    const baseLayoutOptions: LayoutOptions = {
      // Check whether the current route is one which should have standalone
      // navigation on the side. If there is no current route (ie, a 404 page),
      // then it should.
      // FIXME: This is using route names, but it would be better if this was
      // a property on routes themselves.
      standaloneNavigation: !currentRoute || !!currentRoute.hasLeftNavigationColumn,
      renderSunshineSidebar: !!currentRoute?.sunshineSidebar && !!(userCanDo(currentUser, 'posts.moderate.all') || currentUser?.groups?.includes('alignmentForumAdmins')) && !currentUser?.hideSunshineSidebar,
      renderLanguageModelChatLauncher: !!currentUser && userHasLlmChat(currentUser),
      shouldUseGridLayout: !currentRoute || !!currentRoute.hasLeftNavigationColumn,
      unspacedGridLayout: !!currentRoute?.unspacedGrid,
    }

    const { overridenLayoutOptions: overrideLayoutOptions } = layoutOptionsState

    const standaloneNavigation = overrideLayoutOptions.standaloneNavigation ?? baseLayoutOptions.standaloneNavigation
    const renderSunshineSidebar = overrideLayoutOptions.renderSunshineSidebar ?? baseLayoutOptions.renderSunshineSidebar
    const renderLanguageModelChatLauncher = overrideLayoutOptions.renderLanguageModelChatLauncher ?? baseLayoutOptions.renderLanguageModelChatLauncher
    const shouldUseGridLayout = overrideLayoutOptions.shouldUseGridLayout ?? baseLayoutOptions.shouldUseGridLayout
    const unspacedGridLayout = overrideLayoutOptions.unspacedGridLayout ?? baseLayoutOptions.unspacedGridLayout
    const navigationFooterBar = !currentRoute || currentRoute.navigationFooterBar;
    // The friendly home page has a unique grid layout, to account for the right hand side column.
    const friendlyHomeLayout = isFriendlyUI && currentRoute?.name === 'home'

    const isIncompletePath = allowedIncompletePaths.includes(currentRoute?.name ?? "404");
    
    return (
      <AnalyticsContext path={pathname}>
      <UserContextProvider value={currentUser}>
      <UnreadNotificationsContextProvider>
      <TimezoneWrapper>
      <ItemsReadContextWrapper>
      <LoginPopoverContextProvider>
      <SidebarsWrapper>
      <AutosaveEditorStateContext.Provider value={autosaveEditorStateContext}>
      <LlmChatWrapper>
      <DisableNoKibitzContext.Provider value={noKibitzContext}>
      <CommentOnSelectionPageWrapper>
      <CurrentAndRecentForumEventsProvider>
        <div className={classNames(
          "wrapper",
          {'alignment-forum': isAF, [classes.fullscreen]: currentRoute?.fullscreen, [classes.wrapper]: isLWorAF},
          useWhiteBackground && classes.whiteBackground
        )} id="wrapper">
          {buttonBurstSetting.get() && <GlobalButtonBurst />}
          <DialogManager>
            <CommentBoxManager>
              <Helmet name="fonts">
                {theme.typography.fontDownloads &&
                  theme.typography.fontDownloads.map(
                    (url: string)=><link rel="stylesheet" key={`font-${url}`} href={url}/>
                  )
                }
                <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
              </Helmet>

              <AnalyticsClient/>
              <AnalyticsPageInitializer/>
              <GlobalHotkeys/>
              {/* Only show intercom after they have accepted cookies */}
              <DeferRender ssr={false}>
                <MaybeCookieBanner isWrapped={isWrapped} />
              </DeferRender>

              <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
              {/* Google Tag Manager i-frame fallback */}
              <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerIdSetting.get()}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>

              {!currentRoute?.standalone && <SuspenseWrapper name="Header">
                <Header
                  searchResultsArea={searchResultsAreaRef}
                  standaloneNavigationPresent={standaloneNavigation}
                  sidebarHidden={hideNavigationSidebar}
                  toggleStandaloneNavigation={toggleStandaloneNavigation}
                  stayAtTop={!!currentRoute?.staticHeader}
                  backgroundColor={headerBackgroundColor}
                />
              </SuspenseWrapper>}
              <SuspenseWrapper name="ForumEventBanner">
                <ForumEventBanner />
              </SuspenseWrapper>
              {/* enable during ACX Everywhere */}
              {renderCommunityMap && <span className={classes.hideHomepageMapOnMobile}>
                <SuspenseWrapper name="HomepageCommunityMap">
                  <HomepageCommunityMap dontAskUserLocation={true}/>
                </SuspenseWrapper>
              </span>}

              <div className={classNames({
                [classes.spacedGridActivated]: shouldUseGridLayout && !unspacedGridLayout,
                [classes.unspacedGridActivated]: shouldUseGridLayout && unspacedGridLayout,
                [classes.eaHomeLayout]: friendlyHomeLayout && !renderSunshineSidebar,
                [classes.fullscreenBodyWrapper]: currentRoute?.fullscreen,
              }
              )}>
                {isFriendlyUI && !isWrapped && <AdminToggle />}
                {standaloneNavigation && <SuspenseWrapper fallback={<span/>} name="NavigationStandalone" >
                  <MaybeStickyWrapper sticky={friendlyHomeLayout}>
                    <DeferRender ssr={true} clientTiming='mobile-aware'>
                      <SuspenseWrapper name="NavigationStandalone">
                        <NavigationStandalone
                          sidebarHidden={hideNavigationSidebar}
                          unspacedGridLayout={unspacedGridLayout}
                          noTopMargin={friendlyHomeLayout}
                        />
                      </SuspenseWrapper>
                    </DeferRender>
                  </MaybeStickyWrapper>
                </SuspenseWrapper>}
                {/* {isLWorAF && navigationFooterBar && <TabNavigationMenuFooter />} */}
                <div ref={searchResultsAreaRef} className={classes.searchResultsArea} />
                <div className={classNames(classes.main, {
                  [classes.mainNoFooter]: currentRoute?.noFooter,
                  [classes.mainFullscreen]: currentRoute?.fullscreen,
                  [classes.mainUnspacedGrid]: shouldUseGridLayout && unspacedGridLayout,
                })}>
                  <ErrorBoundary>
                    <FlashMessages />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    <SuspenseWrapper name="Route" fallback={<DelayedLoading/>}>
                      {children}
                    </SuspenseWrapper>
                    <SuspenseWrapper name="OnboardingFlow">
                      {!isIncompletePath && isEAForum ? <EAOnboardingFlow/> : <BasicOnboardingFlow/>}
                    </SuspenseWrapper>
                  </ErrorBoundary>
                  {!currentRoute?.fullscreen && !currentRoute?.noFooter && <Footer />}
                </div>
                {isLW && <LWBackgroundImage standaloneNavigation={standaloneNavigation} />}
                {!renderSunshineSidebar &&
                  friendlyHomeLayout &&
                  <MaybeStickyWrapper sticky={friendlyHomeLayout}>
                    <DeferRender ssr={true} clientTiming='mobile-aware'>
                      <SuspenseWrapper name="EAHomeRightHandSide">
                        <EAHomeRightHandSide />
                      </SuspenseWrapper>
                    </DeferRender>
                  </MaybeStickyWrapper>
                }
                {renderSunshineSidebar && <div className={classes.sunshine}>
                  <DeferRender ssr={false}>
                    <SuspenseWrapper name="SunshineSidebar">
                      <SunshineSidebar/>
                    </SuspenseWrapper>
                  </DeferRender>
                </div>}
                {renderLanguageModelChatLauncher && <div>
                  <DeferRender ssr={false}>
                    <LanguageModelLauncherButton/>
                  </DeferRender>
                </div>}
              </div>
            </CommentBoxManager>
          </DialogManager>
        </div>
      </CurrentAndRecentForumEventsProvider>
      </CommentOnSelectionPageWrapper>
      </DisableNoKibitzContext.Provider>
      </LlmChatWrapper>
      </AutosaveEditorStateContext.Provider>
      </SidebarsWrapper>
      </LoginPopoverContextProvider>
      </ItemsReadContextWrapper>
      </TimezoneWrapper>
      </UnreadNotificationsContextProvider>
      </UserContextProvider>
      </AnalyticsContext>
    )
  };
  return render();
}

function MaybeCookieBanner({isWrapped}: {isWrapped: boolean}) {
  const { explicitConsentGiven: cookieConsentGiven, explicitConsentRequired: cookieConsentRequired } = useCookiePreferences();
  const showCookieBanner = cookieConsentRequired === true && !cookieConsentGiven;

  if (showCookieBanner) {
    return (
      <CookieBanner />
    );
  }

  return isWrapped ? null : <IntercomWrapper />
}

export default registerComponent('Layout', Layout);


