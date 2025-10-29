'use client';

import React, {useRef, useState, useCallback, FC, ReactNode, createContext} from 'react';
import classNames from 'classnames'
import { useTheme, useThemeColor } from '@/components/themes/useTheme';
import { useLocation } from '@/lib/routeUtil';
import { AnalyticsContext } from '@/lib/analyticsEvents'
import { useCurrentUser } from '@/components/common/withUser';
import { TimezoneWrapper } from '@/components/common/withTimezone';
import { DialogManager } from '@/components/common/withDialog';
import { CommentBoxManager } from '@/components/hooks/useCommentBox';
import { ItemsReadContextWrapper } from '@/components/hooks/useRecordPostView';
import { pBodyStyle } from '../../themes/stylePiping';
import { googleTagManagerIdSetting, isLW, isLWorAF, buttonBurstSetting } from '@/lib/instanceSettings';
import { globalStyles } from '../../themes/globalStyles/globalStyles';
import { userCanDo, userIsAdmin } from '@/lib/vulcan-users/permissions';
import { Helmet } from "@/components/layout/Helmet";
import { AutosaveEditorStateContextProvider, DisableNoKibitzContextProvider } from '@/components/common/sharedContexts';
// enable during ACX Everywhere
// import { HIDE_MAP_COOKIE } from '@/lib/cookies/cookies';
import Header, { getHeaderHeight } from '@/components/layout/Header';
import { useCookiePreferences, useCookiesWithConsent } from '@/components/hooks/useCookiesWithConsent';
import { useHeaderVisible } from '@/components/hooks/useHeaderVisible';
import StickyBox from '@/lib/vendor/react-sticky-box';
import { isFriendlyUI } from '../../themes/forumTheme';
import { UnreadNotificationsContextProvider } from '@/components/hooks/useUnreadNotifications';
import { CurrentAndRecentForumEventsProvider } from '@/components/hooks/useCurrentForumEvent';
import { LoginPopoverContextProvider } from '@/components/hooks/useLoginPopoverContext';
import DeferRender from '@/components/common/DeferRender';
import { userHasLlmChat } from '@/lib/betas';

import GlobalButtonBurst from '@/components/ea-forum/GlobalButtonBurst';
import NavigationStandalone from "@/components/common/TabNavigationMenu/NavigationStandalone";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import FlashMessages from "@/components/layout/FlashMessages";
import AnalyticsClient from "@/components/common/AnalyticsClient";
import AnalyticsPageInitializer from "@/components/common/AnalyticsPageInitializer";
// import EAOnboardingFlow from "./ea-forum/onboarding/EAOnboardingFlow";
// import BasicOnboardingFlow from "./onboarding/BasicOnboardingFlow";
import { CommentOnSelectionPageWrapper } from "@/components/comments/CommentOnSelection";
import SidebarsWrapper from "@/components/layout/SidebarsWrapper";
import AdminToggle from "@/components/admin/AdminToggle";
// import EAHomeRightHandSide from "./ea-forum/EAHomeRightHandSide";
// import ForumEventBanner from "./forumEvents/ForumEventBanner";
import GlobalHotkeys from "@/components/common/GlobalHotkeys";
import LlmChatWrapper from "@/components/languageModels/LlmChatWrapper";
import LWBackgroundImage from "./LWBackgroundImage";
import IntercomWrapper from "@/components/layout/IntercomWrapper";
import CookieBanner from "@/components/common/CookieBanner/CookieBanner";
import NavigationEventSender from '@/components/hooks/useOnNavigate';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useMutationNoCache } from '@/lib/crud/useMutationNoCache';
import { gql } from "@/lib/generated/gql-codegen";
import { DelayedLoading } from '@/components/common/DelayedLoading';
import { SuspenseWrapper } from '@/components/common/SuspenseWrapper';
import { useRouteMetadata } from './ClientRouteMetadataContext';
import { isFullscreenRoute, isHomeRoute, isStandaloneRoute, isStaticHeaderRoute, isSunshineSidebarRoute } from '@/lib/routeChecks';
import { AutoDarkModeWrapper } from '@/components/themes/ThemeContextProvider';
import { EditorCommandsContextProvider } from '@/components/editor/EditorCommandsContext';
import { NO_ADMIN_NEXT_REDIRECT_COOKIE, SHOW_LLM_CHAT_COOKIE } from '@/lib/cookies/cookies';

import dynamic from 'next/dynamic';
import { isBlackBarTitle } from '@/components/seasonal/petrovDay/petrov-day-story/petrovConsts';
import PageBackgroundWrapper from '@/components/layout/PageBackgroundWrapper';

const SunshineSidebar = dynamic(() => import("../sunshineDashboard/SunshineSidebar"), { ssr: false });
const LanguageModelLauncherButton = dynamic(() => import("../languageModels/LanguageModelLauncherButton"), { ssr: false });
const SidebarLanguageModelChat = dynamic(() => import("../languageModels/SidebarLanguageModelChat"), { ssr: false });

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
 * This is a list of route path segments that the user is allowed to view despite having an
 * 'incomplete' account.
 */
const allowedIncompletePaths: string[] = ["termsOfUse"];

const styles = defineStyles("Layout", (theme: ThemeType) => ({
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
        minmax(0, ${isLWorAF() ? 7 : 1}fr)
        minmax(0, min-content)
      `,
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
  topLevelContainer: {
    display: 'flex',
    flexDirection: 'row',
    minHeight: '100vh',
    width: '100%',
  },
  pageContent: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  llmChatColumn: {
    flexShrink: 0,
    flexGrow: 0,
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
    transform: `translateY(${getHeaderHeight() + STICKY_SECTION_TOP_MARGIN}px)`,
  },
}));

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

const Layout = ({children}: {
  children?: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const currentUserId = currentUser?._id;
  const searchResultsAreaRef = useRef<HTMLDivElement|null>(null);
  const hideNavigationSidebarDefault = currentUser ? !!(currentUser?.hideNavigationSidebar) : false
  const [hideNavigationSidebar,setHideNavigationSidebar] = useState(hideNavigationSidebarDefault);
  // TODO: figure out if using usePathname directly is safe or better (concerns about unnecessary rerendering, idk; my guess is that with Next if the pathname changes we're rerendering everything anyways?)
  const { pathname, query } = useLocation();
  // const pathname = usePathname();
  const { metadata: routeMetadata } = useRouteMetadata();

  // enable during ACX Everywhere
  // const [cookies] = useCookiesWithConsent()
  // replace with following line to enable during ACX Everywhere.
  // also uncomment out the dynamic import and render of the HomepageCommunityMap.
  // (they're commented out to reduce the split bundle size.)
  const renderCommunityMap = false
  // (isLW()) && isHomeRoute(pathname) && (!currentUser?.hideFrontpageMap) && !cookies[HIDE_MAP_COOKIE]
  
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

  const isInbox = pathname.startsWith('/inbox');
  const isWrapped = pathname.startsWith('/wrapped');

  let headerBackgroundColor: ColorString;
  // For the EAF Wrapped page, we change the header's background color to a dark blue.
  const wrappedBackgroundColor = useThemeColor(theme => theme.palette.wrapped.background)
  if (isWrapped) {
    headerBackgroundColor = wrappedBackgroundColor;
  } else if (pathname.startsWith("/voting-portal")) {
    headerBackgroundColor = "transparent";
  } else if (isBlackBarTitle) {
    headerBackgroundColor = 'rgba(0, 0, 0, 0.7)';
  }

  const render = () => {
    const renderSunshineSidebar = isSunshineSidebarRoute(pathname) && !!(userCanDo(currentUser, 'posts.moderate.all') || currentUser?.groups?.includes('alignmentForumAdmins')) && !currentUser?.hideSunshineSidebar;
    
    // Check whether the current route is one which should have standalone
    // navigation on the side. If there is no current route (ie, a 404 page),
    // then it should.
    // FIXME: This is using route names, but it would be better if this was
    // a property on routes themselves.
    const standaloneNavigation = !!routeMetadata.hasLeftNavigationColumn;
    const shouldUseGridLayout = !!routeMetadata.hasLeftNavigationColumn;

    // The friendly home page has a unique grid layout, to account for the right hand side column.
    const friendlyHomeLayout = isFriendlyUI() && isHomeRoute(pathname);
    
    const isIncompletePath = allowedIncompletePaths.some(path => pathname.startsWith(`/${path}`));
    
    return (
      <AnalyticsContext path={pathname}>
      <AutoDarkModeWrapper>
      <UnreadNotificationsContextProvider>
      <TimezoneWrapper>
      <ItemsReadContextWrapper>
      <LoginPopoverContextProvider>
      <SidebarsWrapper>
      <EditorCommandsContextProvider>
      <AutosaveEditorStateContextProvider>
      <LlmChatWrapper>
      <DisableNoKibitzContextProvider>
      <CommentOnSelectionPageWrapper>
      <CurrentAndRecentForumEventsProvider>
      <LlmSidebarWrapper>
        <PageBackgroundWrapper>
          {buttonBurstSetting.get() && <GlobalButtonBurst />}
          <DialogManager>
            <CommentBoxManager>
              <ThemeFontDownloads/>
              <AnalyticsClient/>
              <AnalyticsPageInitializer/>
              <GlobalHotkeys/>
              {/* Only show intercom after they have accepted cookies */}
              <DeferRender ssr={false}>
                <MaybeCookieBanner hideIntercomButton={isWrapped || isInbox} />
              </DeferRender>

              <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
              {/* Google Tag Manager i-frame fallback */}
              <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerIdSetting.get()}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>

              {!isStandaloneRoute(pathname) && <SuspenseWrapper name="Header">
                <Header
                  searchResultsArea={searchResultsAreaRef}
                  standaloneNavigationPresent={standaloneNavigation}
                  sidebarHidden={hideNavigationSidebar}
                  toggleStandaloneNavigation={toggleStandaloneNavigation}
                  stayAtTop={isStaticHeaderRoute(pathname)}
                  backgroundColor={headerBackgroundColor}
                />
              </SuspenseWrapper>}
              {/* <SuspenseWrapper name="ForumEventBanner">
                <ForumEventBanner />
              </SuspenseWrapper> */}
              {/* enable during ACX Everywhere */}
              {renderCommunityMap && <span className={classes.hideHomepageMapOnMobile}>
                {/* <SuspenseWrapper name="HomepageCommunityMap">
                  <HomepageCommunityMap dontAskUserLocation={true}/>
                </SuspenseWrapper> */}
              </span>}

              <ErrorBoundary>
                <FlashMessages />
              </ErrorBoundary>
              {isFriendlyUI() && !isWrapped && <AdminToggle />}

              <div className={classNames({
                [classes.spacedGridActivated]: shouldUseGridLayout,
                [classes.eaHomeLayout]: friendlyHomeLayout && !renderSunshineSidebar,
                [classes.fullscreenBodyWrapper]: isFullscreenRoute(pathname),
              }
              )}>
                {standaloneNavigation && <SuspenseWrapper fallback={<span/>} name="NavigationStandalone" >
                  <MaybeStickyWrapper sticky={friendlyHomeLayout}>
                    <DeferRender ssr={true} clientTiming='mobile-aware'>
                      <SuspenseWrapper name="NavigationStandalone">
                        <NavigationStandalone
                          sidebarHidden={hideNavigationSidebar}
                          noTopMargin={friendlyHomeLayout}
                        />
                      </SuspenseWrapper>
                    </DeferRender>
                  </MaybeStickyWrapper>
                </SuspenseWrapper>}
                <div ref={searchResultsAreaRef} className={classes.searchResultsArea} />
                
                {children}
                
                {isLW() && <LWBackgroundImage standaloneNavigation={standaloneNavigation} />}
                {/* {!renderSunshineSidebar &&
                  friendlyHomeLayout &&
                  <MaybeStickyWrapper sticky={friendlyHomeLayout}>
                    <DeferRender ssr={true} clientTiming='mobile-aware'>
                      <SuspenseWrapper name="EAHomeRightHandSide">
                        <EAHomeRightHandSide />
                      </SuspenseWrapper>
                    </DeferRender>
                  </MaybeStickyWrapper>
                } */}
                {renderSunshineSidebar && <div className={classes.sunshine}>
                  <DeferRender ssr={false}>
                    <SuspenseWrapper name="SunshineSidebar">
                      <SunshineSidebar/>
                    </SuspenseWrapper>
                  </DeferRender>
                </div>}
              </div>
            </CommentBoxManager>
          </DialogManager>
          <NavigationEventSender />
        </PageBackgroundWrapper>
      </LlmSidebarWrapper>
      </CurrentAndRecentForumEventsProvider>
      </CommentOnSelectionPageWrapper>
      </DisableNoKibitzContextProvider>
      </LlmChatWrapper>
      </AutosaveEditorStateContextProvider>
      </EditorCommandsContextProvider>
      </SidebarsWrapper>
      </LoginPopoverContextProvider>
      </ItemsReadContextWrapper>
      </TimezoneWrapper>
      </UnreadNotificationsContextProvider>
      </AutoDarkModeWrapper>
      </AnalyticsContext>
    )
  };
  return render();
}

function MaybeCookieBanner({ hideIntercomButton }: { hideIntercomButton: boolean }) {
  const { explicitConsentGiven: cookieConsentGiven, explicitConsentRequired: cookieConsentRequired } = useCookiePreferences();
  const showCookieBanner = cookieConsentRequired === true && !cookieConsentGiven;

  if (showCookieBanner) {
    return (
      <CookieBanner />
    );
  }

  return hideIntercomButton ? null : <IntercomWrapper />
}

function ThemeFontDownloads() {
  const theme = useTheme();

  // ea-forum-look-here: the font downloads probably don't work in NextJS, may need to move them to e.g. SharedScripts
  return <Helmet name="fonts">
    {theme.typography.fontDownloads &&
      theme.typography.fontDownloads.map(
        (url: string)=><link rel="stylesheet" key={`font-${url}`} href={url}/>
      )
    }
    <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
  </Helmet>
}

export const IsLlmChatSidebarOpenContext = createContext(false);

/**
 * Wrapper that splits the layout into a main column and a right-hand sidebar
 * for an LLM chat wrapper, if open. Otherwise may provide a floating button,
 * if the feature is enabled for the current user and route. Provides a context
 * IsLlmChatSidebarOpenContext, which is used by <Header> to adjust its width.
 */
const LlmSidebarWrapper = ({children}: {
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { pathname } = useLocation();
  const isInbox = pathname.startsWith('/inbox');
  const [cookies, setCookie] = useCookiesWithConsent([SHOW_LLM_CHAT_COOKIE]);

  const [showLlmChatSidebar, setShowLlmChatSidebar] = useState(false);
  const closeLlmChatSidebar = useCallback(() => {
    setShowLlmChatSidebar(false);
    setCookie(SHOW_LLM_CHAT_COOKIE, "false", { path: "/" });
  }, [setCookie]);

  const renderLanguageModelChatLauncher = !!currentUser && userHasLlmChat(currentUser) && !isInbox;

  return <div className={classes.topLevelContainer}>
    <div className={classes.pageContent}>
      <IsLlmChatSidebarOpenContext.Provider value={showLlmChatSidebar}>
        {children}
      </IsLlmChatSidebarOpenContext.Provider>
    </div>
    {renderLanguageModelChatLauncher && (
      <div className={classes.llmChatColumn}>
        <DeferRender ssr={false}>
          {showLlmChatSidebar ? (
            <SuspenseWrapper name="SidebarLanguageModelChat">
              <SidebarLanguageModelChat onClose={closeLlmChatSidebar} />
            </SuspenseWrapper>
          ) : (
            <LanguageModelLauncherButton onClick={() => setShowLlmChatSidebar(true)} />
          )}
        </DeferRender>
      </div>
    )}
  </div>
}

export default Layout;


