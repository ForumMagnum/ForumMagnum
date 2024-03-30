import React, {useRef, useState, useCallback, useEffect, FC, ReactNode, useMemo} from 'react';
import { Components, registerComponent } from '../lib/vulcan-lib';
import { useUpdate } from '../lib/crud/withUpdate';
import { Helmet } from 'react-helmet';
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
import { isAF, isEAForum, isLW, isLWorAF } from '../lib/instanceSettings';
import { globalStyles } from '../themes/globalStyles/globalStyles';
import { ForumOptions, forumSelect } from '../lib/forumTypeUtils';
import { userCanDo } from '../lib/vulcan-users/permissions';
import NoSSR from 'react-no-ssr';
import { DisableNoKibitzContext } from './users/UsersNameDisplay';
import { LayoutOptions, LayoutOptionsContext } from './hooks/useLayoutOptions';
// enable during ACX Everywhere
// import { HIDE_MAP_COOKIE } from '../lib/cookies/cookies';
import { HEADER_HEIGHT } from './common/Header';
import { useCookiePreferences } from './hooks/useCookiesWithConsent';
import { useHeaderVisible } from './hooks/useHeaderVisible';
import StickyBox from '../lib/vendor/react-sticky-box';
import { isFriendlyUI } from '../themes/forumTheme';
import { requireCssVar } from '../themes/cssVars';
import { UnreadNotificationsContextProvider } from './hooks/useUnreadNotifications';
import { CurrentForumEventProvider } from './hooks/useCurrentForumEvent';
import { isServer } from '../lib/executionEnvironment';
import type ReactJkMusicPlayer from 'react-jinke-music-player';
import { usePrefersDarkMode } from './themes/usePrefersDarkMode';

let MusicPlayer: typeof ReactJkMusicPlayer | undefined = undefined

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
  'EAForum': ['home', 'allPosts', 'questions', 'Shortform', 'eaLibrary', 'tagsSubforum'],
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
        minmax(0, ${isLW ? 7 : 1}fr)
        minmax(0, min-content)
      `,
    },
    [theme.breakpoints.down('md')]: {
      display: 'block'
    }
  },
  imageColumn: {
    gridArea: 'imageGap',
    [theme.breakpoints.down('md')]: {
      display: 'none'
    },
  },
  backgroundImage: {
    position: 'absolute',
    width: '57vw',
    maxWidth: '1000px',
    top: '-30px',
    '-webkit-mask-image': `radial-gradient(ellipse at center top, ${theme.palette.text.alwaysBlack} 55%, transparent 70%)`,
    
    [theme.breakpoints.up(2000)]: {
      right: '0px',
    }
  },
  votingImage: {
    // width: 780px;
    // right: -110px;
    // height: 1190px;
    // /* max-width: 1000px; */
    // /* transform: scaleX(-1); */
    // margin-top: 27px;
    // object-fit: cover;
    // -webkit-mask-image: radial-gradient(ellipse at top right, #000 53%, transparent 68%);
    
    width: '780px',
    right: '-110px',
    marginTop: 27,
    height: '1190px',
    objectFit: 'cover',
    '-webkit-mask-image': `radial-gradient(ellipse at top right, ${theme.palette.text.alwaysBlack} 53%,transparent 70%)`,
  },
  lessOnlineBannerText: {
    ...theme.typography.postStyle,
    position: 'absolute',
    right: 16,
    top: 70,
    color: theme.palette.text.alwaysBlack,
    textAlign: 'right',
    width: 450,
    textWrap: 'balance',
    [theme.breakpoints.down(1400)]: {
      width: 210,
    },
    fontFamily: '"Press Start 2P"',
    '& h2': {
      fontSize: '19px',
      margin: 0,
      marginBottom: 13,
      marginTop: 12,
    // font-size: 19px;
    // margin-bottom: 13px;
    // margin-top: 12px;
    },
    '& h3': {
      // font-size: 9px;
      // line-height: 1.3;
      // margin: 0 0 8px;
      fontSize: '9px',
      margin: '0 0 8px',
      lineHeight: '1.3',
    },
    '& .glitch': {
      // white-space: nowrap;
      // font-family: "Press Start 2P";
      // font-size: 13px;
      // display: inline-block;
      // margin-top: 12px;
      fontFamily: "Press Start 2P",
      fontSize: '13px',
      display: 'inline-block',
      marginTop: 12,
    },
    '& button': {
      ...theme.typography.commentStyle,
      backgroundColor: theme.palette.text.alwaysWhite,
      opacity: 0.8,
      border: 'none',
      color: theme.palette.text.alwaysBlack,
      borderRadius: '3px',
      textAlign: 'center',
      padding: 8,
      fontFamily: '"Press Start 2P"',
      fontSize: '10px',
      letterSpacing: '0px',
    }
  },
  lessOnlineBannerDateAndLocation: {
    ...theme.typography.commentStyle,
    fontSize: '16px !important',
    fontStyle: 'normal',
    marginBottom: '16px !important',
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
  audioPlayer: {
    '&&&': {
      ...theme.typography.commentStyle,
    }
  }
});

const wrappedBackgroundColor = requireCssVar("palette", "wrapped", "background")

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
  const [musicPlayerLoaded, setMusicPlayerLoaded] = useState(false)
  const prefersDarkMode = usePrefersDarkMode();
  const [lyricsToggled, setLyricsToggled] = useState(false)
  useEffect(() => {
    if (!isServer) {
      void import('react-jinke-music-player')
        .then((module) => {
          MusicPlayer = module.default
          setMusicPlayerLoaded(true)
        })
    }
  })
  const hideNavigationSidebarDefault = currentUser ? !!(currentUser?.hideNavigationSidebar) : false
  const [hideNavigationSidebar,setHideNavigationSidebar] = useState(hideNavigationSidebarDefault);
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

  // For the EAF Wrapped page, we change the header's background color to a dark blue.
  const headerBackgroundColor = pathname.startsWith('/wrapped') ? wrappedBackgroundColor : undefined;

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
      EAOnboardingFlow,
      CommentOnSelectionPageWrapper,
      SidebarsWrapper,
      IntercomWrapper,
      HomepageCommunityMap,
      CookieBanner,
      AdminToggle,
      SunshineSidebar,
      EAHomeRightHandSide,
      CloudinaryImage2,
      ForumEventBanner,
    } = Components;

    const baseLayoutOptions: LayoutOptions = {
      // Check whether the current route is one which should have standalone
      // navigation on the side. If there is no current route (ie, a 404 page),
      // then it should.
      // FIXME: This is using route names, but it would be better if this was
      // a property on routes themselves.
      standaloneNavigation: !currentRoute || forumSelect(standaloneNavMenuRouteNames).includes(currentRoute.name),
      renderSunshineSidebar: !!currentRoute?.sunshineSidebar && !!(userCanDo(currentUser, 'posts.moderate.all') || currentUser?.groups?.includes('alignmentForumAdmins')) && !currentUser?.hideSunshineSidebar,
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

    const isIncompletePath = allowedIncompletePaths.includes(currentRoute?.name ?? "404");
    const showNewUserCompleteProfile = currentUser?.usernameUnset && !isIncompletePath;

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
      <UnreadNotificationsContextProvider>
      <TimezoneWrapper>
      <ItemsReadContextWrapper>
      <SidebarsWrapper>
      <DisableNoKibitzContext.Provider value={noKibitzContext}>
      <CommentOnSelectionPageWrapper>
      <CurrentForumEventProvider>
        <div className={classNames(
          "wrapper",
          {'alignment-forum': isAF, [classes.fullscreen]: currentRoute?.fullscreen, [classes.wrapper]: isLWorAF}
        )} id="wrapper">
          <DialogManager>
            <CommentBoxManager>
              <Helmet>
                {theme.typography.fontDownloads &&
                  theme.typography.fontDownloads.map(
                    (url: string)=><link rel="stylesheet" key={`font-${url}`} href={url}/>
                  )
                }
                <link href='https://res.cloudinary.com/lesswrong-2-0/raw/upload/v1711774484/Glitch_xcwejo.css' rel='stylesheet' />
                <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
              </Helmet>

              <AnalyticsClient/>
              <AnalyticsPageInitializer/>
              <NavigationEventSender/>
              {/* Only show intercom after they have accepted cookies */}
              <NoSSR>
                {showCookieBanner ? <CookieBanner /> : <IntercomWrapper/>}
              </NoSSR>

              <NoSSR>
                <Helmet>
                  <link href='https://res.cloudinary.com/lesswrong-2-0/raw/upload/v1711761428/index_wqsiku_gfpa3t.css' rel='stylesheet' />
                  
                  <style>
                    {`
                    .react-jinke-music-player-main.react-jinke-music-player.react-jinke-music-player {
                      top: inherit !important;
                      left: inherit !important;
                      right: 12px !important;
                      bottom: 12px !important;
                      transform: scale(0.6) !important;
                    }
                    .react-jinke-music-player-main .controller-title {
                      color: white !important; 
                    }

                    .react-jinke-music-player-main .music-player-panel {
                      background-color: rgba(255, 255, 255, 0.7) !important;
                      box-shadow: 0 1px 2px 0 rgba(0,34,77,.05) !important;
                      height: 64px !important;
                      color: rgba(0,0,0,0.7) !important;
                      backdrop-filter: blur(2px) !important;
                      font-family: "Press Start 2P" !important;
                    }

                    .react-jinke-music-player-main .progress-bar.progress-bar.progress-bar {
                      margin-top: -2px !important;
                    }

                    .react-jinke-music-player-main .current-time, .react-jinke-music-player-main .duration {
                      font-size: 10px !important;
                    }

                    .react-jinke-music-player-main .music-player-lyric {
                      font-size: 12px;
                      color: black;
                      text-shadow: 0 0 3px white, 0 0 3px white;
                      background-color: rgba(255, 255, 255, 0.6);
                      backdrop-filter: blur(2px);
                      font-family: "Press Start 2P";
                      font-family: "Press Start 2P";
                      line-height: 3;
                      bottom: 64px;
                    }

                    .react-jinke-music-player-main .progress-bar-content .audio-main {
                      margin-top: 9px !important;
                    }

                    .react-jinke-music-player-main .audio-title {
                      font-family: "Press Start 2P" !important;
                      font-size: 11px !important;
                    }
                    
                    `}
                  </style>
                </Helmet>
                {musicPlayerLoaded && MusicPlayer && <MusicPlayer
                  ref={el => {
                    console.log({el})
                    el && !lyricsToggled && (el as any).toggleAudioLyric()
                    setLyricsToggled(true)
                  }}
                  locale={{
                    emptyLyricText: ""
                  } as any}
                  className={classes.audioPlayer}
                  autoPlay={false}
                  showReload={false}
                  showThemeSwitch={false}
                  theme={prefersDarkMode ? "dark" : "light"}
                  audioLists={[
                  {
                    name: 'Curiosity (The First Virtue)',
                    singer: 'General Chaos',
                    cover: 'https://preview.redd.it/1f132hb4r2g31.png?width=2079&format=png&auto=webp&s=3068f4d0ebcc4e6cff2afd17035957216dc7a0cd',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711745635/curiosity_f2xlm5.mp3',
                    lyric: `
                    [00:00]  The first virtue is curiosity
                    [00:05]  A burning itch to know is higher than a solemn vow to pursue truth
                    [00:11]  To feel the burning itch of curiosity
                    [00:15]  Requires both that you be ignorant
                    [00:19]  And that you desire to relinquish your ignorance
                    [00:23]  If in your heart you believe you already know
                    [00:28]  Or if in your heart you do not wish to know
                    [00:32]  Then your quest to know, then your questioning
                    [00:36]  Will be purposeless
                    [00:39]  And your skills without direction
                    [00:44]  Curiosity seeks to annihilate itself
                    [00:49]  There is no curiosity that does not want an answer
                    [00:55]  The glory of glorious mystery is to be solved`
                  },

                  {
                    name: 'FHI at Oxford',
                    singer: 'The Boss Storm',
                    cover: 'https://nickbostrom.com/poetry/poop10.jpg',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711587998/FHI_at_Oxford_hvqzu7.mp3',
                    lyric:  `
                    [00:07] the big creaky wheel
                    [00:09] a thousand years to turn

                    [00:12] thousand meetings, thousand emails, thousand rules
                    [00:16] to keep things from changing
                    [00:18] and heaven forbid
                    [00:19] the setting of a precedent

                    [00:23] yet in this magisterial inefficiency
                    [00:26] there are spaces and hiding places
                    [00:29] for fragile weeds to bloom
                    [00:31] and maybe bear some singular fruit

                    [00:35] like the FHI, a misfit prodigy
                    [00:38] daytime a tweedy don
                    [00:40] at dark a superhero
                    [00:42] flying off into the night
                    [00:44] cape a-fluttering
                    [00:45] to intercept villains and stop catastrophes

                    [00:50] and why not base it here?
                    [00:52] our spandex costumes
                    [00:54] blend in with the scholarly gowns
                    [00:56] our unusual proclivities
                    [00:58] are shielded from ridicule
                    [01:01] where mortar boards are still in vogue

                    [01:13] thousand meetings, thousand emails, thousand rules
                    [01:18] to keep things from changing
                    [01:20] and heaven forbid
                    [01:22] the setting of a precedent`
                  },
                  {
                    name: 'Seeing the Smoke',
                    singer: 'Yashkaf in the Valley',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711743328/seeing_the_smoke_jmhbi5.mp3',
                    lyric: `
                    [00:00]  I'm not an expert on viral diseases, global supply chains, or prepping.
                    [00:12]  I don't have special information or connections.
                    [00:17]  My only differentiation is that I care a bit less than others about appearing weird or foolish.
                    [00:28]  And I trust a bit more in my own judgment.
                    [00:33]  Seeing the smoke and reacting is a learnable skill,
                    [00:38]  and I'm going to give credit to rationality for teaching it.
                    [00:46]  COVID-19 is the best exam for rationalists
                    [00:52]  doing much better than common sense since Bitcoin.
                    [00:57]  So instead of waiting two months, I'm submitting my answer for reality to grade.
                    [01:06]  I think I'm seeing smoke, I'm submitting my answer for reality to grade.
                    [01:17]  I think I'm seeing smoke, I'm not an expert.
                    [01:24]  I think I'm seeing smoke.
                    [01:30]  I think I'm seeing smoke.
                    [01:36]  I'm not an expert.
                    [01:41]  I think I'm seeing smoke.`
                  },
                ]}
                showLyric={true}
                mode="full"
                />}
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
                backgroundColor={headerBackgroundColor}
              />}
              <ForumEventBanner />
              {/* enable during ACX Everywhere */}
              {renderCommunityMap && <span className={classes.hideHomepageMapOnMobile}><HomepageCommunityMap dontAskUserLocation={true}/></span>}
              {renderPetrovDay() && <PetrovDayWrapper/>}

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
                    {showNewUserCompleteProfile && !isEAForum
                      ? <NewUserCompleteProfile currentUser={currentUser}/>
                      : children
                    }
                    {!isIncompletePath && isEAForum && <EAOnboardingFlow />}
                  </ErrorBoundary>
                  {!currentRoute?.fullscreen && !currentRoute?.noFooter && <Footer />}
                </div>
                { isLW && <>
                  {
                    currentRoute?.name === 'home' ? 
                    <div className={classes.imageColumn}>
                      <CloudinaryImage2 className={classNames(classes.backgroundImage, classes.votingImage)} publicId="ohabryka_Solarpunk_band_poster_fade_to_yellow_eb4a63fd-03ea-472f-a656-d6d152a2f268_fdu41f.png" darkPublicId={"ohabryka_Solarpunk_band_poster_fade_to_yellow_eb4a63fd-03ea-472f-a656-d6d152a2f268_fdu41f.png"}/>
                      <div className={classes.lessOnlineBannerText}>
                        <h2><a href="http://less.online">The Fooming Shoggoths</a></h2>
                        <h3>Releasing their debut album: <br/> <span {...{'data-text': '"I Help Been A Good Help"'}} className="glitch">"I Have Been A Good Bing"</span></h3>
                        <button><a href="http://less.online/#tickets-section">Listen Now</a></button>
                      </div>
                    </div> 
                    : 
                      (standaloneNavigation && <div className={classes.imageColumn}>
                        <CloudinaryImage2 className={classes.backgroundImage} publicId="ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413" darkPublicId={"ohabryka_Topographic_aquarelle_book_cover_by_Thomas_W._Schaller_f9c9dbbe-4880-4f12-8ebb-b8f0b900abc1_m4k6dy_734413_copy_lnopmw"}/>
                      </div>)
                  }
                  </>
                }
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
      </CurrentForumEventProvider>
      </CommentOnSelectionPageWrapper>
      </DisableNoKibitzContext.Provider>
      </SidebarsWrapper>
      </ItemsReadContextWrapper>
      </TimezoneWrapper>
      </UnreadNotificationsContextProvider>
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
