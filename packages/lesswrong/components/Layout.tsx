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
  lessOnlineBannerTextLimitedSpace: {
    [theme.breakpoints.down(1400)]: {
      width: 210,
    },
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
                    name: 'The Road to Wisdom',
                    singer: 'The Fooming Shoggoths (ft Piet Hein)',
                    cover: 'https://preview.redd.it/1f132hb4r2g31.png?width=2079&format=png&auto=webp&s=3068f4d0ebcc4e6cff2afd17035957216dc7a0cd',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821413/album/Road_to_Wisdom_tzxw0f.mp3',
                    lyric: `
                    [00:00]  The road to wisdom? Well, it's plain and simple to express.
                    [00:08]  Err and err again, but less and less and less and less.
                    [00:28]  
                    [00:32]  Err again, but less and less and less and less.
                    [00:44]  
                    [01:00]  The road to wisdom? Well, it's plain and simple to express.
                    [01:06]  Err and err again and again, but less and less and less.
                    [01:33]  `
                  },

                  {
                    name: 'Meditations on Moloch',
                    singer: 'The Fooming Shoggoths (ft Allen Ginsberg)',
                    cover: 'https://nickbostrom.com/poetry/poop10.jpg',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711853476/Meditations_on_Moloch_wmug7s.mp3',
                    lyric:  `
                    [00:00]  Moloch! Solitude! Filth! Ugliness! Ashcans and unobtainable dollars!
                    [00:07]  Children screaming under the stairways! Boys sobbing in armies!
                    [00:12]  Old men weeping in the parks! Moloch! Moloch! Nightmare of Moloch!
                    [00:19]  Moloch the loveless! Mental Moloch! Moloch the heavy judger of men!
                    [00:29]  Moloch!`
                  },
                  {
                    name: 'Thought that Faster',
                    singer: 'The Fooming Shoggoths (ft Eliezer Yudkowsky)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821416/album/Thought_That_Faster_uunnbi.mp3',
                    lyric: `
                    [00:11]  if i'd noticed myself doing anything like that
                    [00:15]  i'd go back and figure out which steps of thought were necessary
                    [00:23]  and retrain myself to perform only those steps in 30 seconds
                    [00:31]  do you look back and ask
                    [00:34.50]  how could i have thought that faster?
                    [00:41]  do you look back and ask
                    [00:46]  how could i have thought that faster?
                    [00:53]  every time i'm surprised i look back and think
                    [00:57]  what could i change to predict better?
                    [01:03]  every time a chain of thought takes too long
                    [01:08]  i ask how could i have got there by a shorter route
                    [01:13]  do you look back and ask
                    [01:18]  how could i have thought that faster?
                    [01:23]  do you look back and ask
                    [01:29]  how could i have thought that faster?
                    [01:35]  every time i'm surprised i look back and think
                    [01:40]  what could i change to predict better?
                    [01:45]  every time a chain of thought takes too long
                    [01:49]  i ask how could i have got there by a shorter route
                    [01:57]   `
                  },
                  {
                    name: 'The Litany of Tarrrrrski',
                    singer: 'The Fooming Shoggoths (ft Cap\'n Tarski & E.Y.)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821414/album/The_Litany_of_Tarrrrrrrski_nbapkq.mp3',
                    lyric: `
                    [00:00]  If the sky is blue, me lads
                    [00:02.80] I desire to believe the sky is blue
[00:07]  If the sky is not blue, me hearties
[00:11] I desire to believe the sky is not blue
[00:15]  Beliefs should stem from reality, yo ho!
[00:17.90] From what actually is, me lads
[00:20]  Not from what's convenient, yo ho!
[00:23] Let me not hold on, me hearties
[00:25.30]  To beliefs I may not want, yo ho!
[00:28] Yo ho, me lads, yo ho!
[00:31.50]  If the box contains a diamond
[00:34] I desire to believe the box contains a diamond
[00:38]  If the box does not contain a diamond
[00:41] I desire to believe the box does not contain a diamond
[00:45.80]  Beliefs should stem from reality, yo ho!
[00:48.80] From what actually is, me lads
[00:51.50]  Not from what's convenient,
[00:53] Let me not hold on, me hearties
[00:55] To beliefs I may not want, yo ho!
[00:57.50] Yo ho, me lads, yo ho!
[01:01]  From the depths of the ocean, to the heights of the sky 
[01:04.80] We'll seek the truth, me hearties
[01:07]  And never let it pass us by
[01:09.50] If the iron is hot, me lads
[01:12]  I desire to believe the iron is hot,
[01:14.80] If the iron is cool
[01:16.30] I desire to believe the iron is cool
[01:21.90] Beliefs should stem from reality, yo ho!
[01:24.50] From what actually is, me lads
[01:26.90]  Not from what's convenient,
[01:29] Let me not hold on, me hearties
[01:31.50] To beliefs I may not want, yo ho!
[01:34] Yo ho, me lads, yo ho!
[01:46] Yo ho, me lads, yo ho!`
                  },
                  {
                    name: 'The Litany of Gendlin',
                    singer: 'The Fooming Shoggoths (ft Eugene Gendlin)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821420/album/The_Litany_of_Gendlin-_AudioTrimmer.com_nq4swl.mp3',
                    lyric: `
                    [00:00]  What is true is already so.
[00:04]  Owning up to it doesn’t make it worse.
[00:08]  Not being open about it doesn’t make it go away.
[00:14]  And because it’s true, it is what is there to be interacted with.
[00:21]  Anything untrue isn’t there to be lived.
[00:26.50]  People can stand what is true,
[00:35]  for they are already enduring it.
[00:38]  Ooh, ooh, ooh, ooh, ooh, ooh, ooh.
[00:46]  Ooh, ooh, ooh, ooh, ooh, ooh, ooh.
[00:53]  Owning up to it doesn't make it worse.
[00:56.80]  Not being open about it doesn't make it go away.
[01:03]  And because it's true, it is what is there to be interacted with.
[01:11]  Anything untrue isn't there to be lived.
[01:19.80]  People can stand what is true, for they are already enduring it.
[01:45]  Ooh, ooh, ooh, ooh, ooh, ooh, ooh, ooh.`
                  },
                  {
                    name: 'Dath Ilan\'s Song',
                    singer: 'The Fooming Shoggoths (ft Eliezer Yudkowsky)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821414/album/Dath_Ilan_s_Song_nfmhgy.mp3',
                    lyric: `
                    [00:00]  Even if the stars should die in heaven
                    [00:06] Our sins can never be undone
                    [00:11] No single death will be forgiven
                    [00:18] When fades at last the last lit sun.
[00:23] Then in the cold and silent black
[00:27] As light and matter end
[00:30] We’ll have ourselves a last look back.
[00:39] And toast an absent friend.
[01:00] Even if the stars should die in heaven
[01:05] Our sins can never be undone
[01:11] No single death will be forgiven
[01:17] When fades at last the last lit sun.
[01:22] Then in the cold and silent black
[01:26] As light and matter end
[01:29] We’ll have ourselves a last look back.
[01:36] And toast an absent friend.
[01:50] And toast an absent friend.
[02:20] And toast an absent friend.`
                  },
                  {
                    name: 'Half An Hour Before Dawn In San Francisco',
                    singer: 'The Fooming Shoggoths (ft Scott Alexander)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821420/album/San_Francisco_1_-_AudioTrimmer.com_llfyn7.mp3',
                    lyric: `
                    [00:00]  I try to avoid San Francisco.
                    [00:02.50] When I go, I surround myself with people.
                    [00:06] Otherwise, I have morbid thoughts, but a morning appointment, a miscalculated transit time.
[00:15] Find me alone on the SF streets half an hour before dawn.
[00:19] The skyscrapers get to me.
[00:21] I'm an heir to Art Deco and the cult of progress.
[00:25]  I should idolize skyscrapers as symbols of human accomplishment.
[00:32] I can't. They look no more human than a termite nest, maybe less.
[00:38] They inspire awe, but no kinship.
[00:41] What marvels techno-capital creates as it instantiates itself.
[00:48] Too bad I'm a hairless ape and can take no credit for such things.
[00:53.50] I could have stayed in Michigan.
[00:56.50] There were forests and lakes and homes with little gardens. Instead, I'm here.
[01:05] We pay rents that would bankrupt a medieval principality to get front-row seats for the hinge of history.
[01:14] It will be the best investment we ever make.
[01:18] Imagine living when the first lungfish crawled out of the primordial ooze and missing it because the tide pool down the way had cheaper housing.
[01:31] Imagine living on Earth in 65,000,000 BC and being anywhere except Chicxulub.
[01:43] `
                  },
                  {
                    name: 'AGI and the EMH',
                    singer: 'The Fooming Shoggoths (ft Basil Halperin, J. Zachary Mazlish, Trevor Chow)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821418/album/AGI_and_the_EMH-_AudioTrimmer.com_c1znjn.mp3',
                    lyric: `
                    [00:00] In this post, we point out that short AI timelines would cause real interest rates to be high,
                    [00:08] and would do so under expectations of either unaligned or aligned AI.
                    [00:14] However, 30- to 50-year real interest rates are low.
                    [00:19] We argue that this suggests one of two possibilities.
[00:23]  1. Long(er) timelines.
[00:25.30] Financial markets are often highly effective information aggregators
[00:30.30] (”the efficient market hypothesis")
[00:32.50] and therefore real interest rates accurately reflect that transformative AI is unlikely to be developed in the next 30-50 years.
[00:42] 2. Market inefficiency.
[00:44] Markets are radically underestimating how soon advanced AI technology will be developed, and real interest rates are therefore too low.
[00:52] There is thus an opportunity for philanthropists to borrow while real rates are low
[00:58] to cheaply do good today.
[01:00] And/or an opportunity for anyone to earn excess returns by betting that real rates will rise.
[01:14] So what is it?
[01:16] We point out that short AI timelines would cause real interest rates to be high,
[01:23] and would do so under expectations of either unaligned or aligned AI
[01:29] However, 30- to 50-year real interest rates are low.
[01:34] We argue that this suggests one of two possibilities.
[01:38]  Unlikely to be developed in the next 30-50 years.
[01:43] 2. Market inefficiency.
[01:44.80] Markets are radically underestimating how soon advanced AI technology will be developed, and real interest rates are therefore too low.
[01:53] There is thus an opportunity for philanthropists to borrow while real rates are low to cheaply do good today
[01:59] To cheaply do good today
[02:01] And/or an opportunity for anyone to earn excess returns by betting that real rates will rise.`
                  },
                  {
                    name: 'First they came for the epistemology',
                    singer: 'The Fooming Shoggoths (ft Michael Vassar)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821419/album/First_they_came_for_the_epistemology_su5voi.mp3',
                    lyric: `
                    [00:00] First they came for the epistemology
[00:04] We don't know what happened after that
[00:08] First they came for the epistemology
[00:12] We don't know what happened after that
[00:16] First they came for the epistemology
[00:20] We don't know what happened after that
[00:24] First they came for the epistemology
[00:28] We don't know what happened after that
[00:48] First they came for the epistemology
[00:52] We don't know what happened after that
[00:56] First they came for the epistemology
[01:00] We don't know what happened after that
[01:16] First came the epistemology
[01:20] We know what happened after that
[01:24] Epistemology
[01:26] What happened
[01:30] What
`
                  },
                  {
                    name: 'Prime Factorization',
                    singer: 'The Fooming Shoggoths (ft Scott Alexander)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821419/album/Prime_Factorization_v2-_AudioTrimmer.com_iyqvwz.mp3',
                    lyric: `
                    [00:03]  The sea was made of strontium, the beach was made of rye,
                    [00:07] Above my head a watery sun shone in an oily sky.
[00:14] The sea turned hot and geysers shot up from the floor below,
[00:18] First one of wine, then one of brine, then one more yet of turpentine.
[00:24] And we three stared at the show.
[00:29] Universal love said the cactus person
[00:33.50] Transcendent joy said the big green bat
[00:37] Universal love said the cactus person
[00:41] Transcendent joy said the big green bat
[00:45]  Not splitting numbers but joining mind
[00:47.50] Not facts or factors or factories, but contact with the abstract attractor that brings you back to me
[00:55] Not to seek but to find
[00:59]  Universal love said the cactus person
[01:03] Transcendent joy said the big green bat
[01:07] Universal love said the cactus person
[01:11] Transcendent joy said the big green bat
[01:14.40]  I can′t get out of the car until you factor the number.
[01:21] I won′t factor the number until you get out of the car.
[01:27]  Please, I′m begging you, factor the number.
[01:30.50] Yes, well, I′m begging you, please get out of the car.
[01:33]  For the love of God, just factor the fucking number.
[01:37] For the love of God, just get out of the fucking car.`
                  },
                  {
                    name: 'We Do Not Wish to Advance',
                    singer: 'The Fooming Shoggoths (ft Anthropic)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821418/album/Anthropic_Capabilities_1_-_AudioTrimmer.com_uge0kp.mp3',
                    lyric: `
                    [00:00]  We generally don't publish this kind of work, because we do not wish to advance the rate of AI capabilities progress.
[00:07]  In addition, we aim to be thoughtful about demonstrations of frontier capabilities.
[00:13]  We've subsequently begun deploying Claude
[00:17]  Now that the gap between it and the public state of the art is smaller.
[00:24]  Opus
[00:26]  Our most intelligent model
[00:30]  Outperforms its peers
[00:33]  On most of the common evaluation benchmarks for AI systems
[00:40]  Claude 3 Opus is our most intelligent model
[00:45]  With best in market performance on highly complex tasks
[01:02]  We do not wish to advance the rate of AI capabilities progress
[01:09.70]  These new features will include interactive coding
[01:15]  And more advanced agentic capabilities
[01:30]  Our hypothesis is that being at the frontier of AI development
[01:38]  Is the most effective way to steer
[01:43]  We do not wish to advance the rate of AI
[01:59]  We do not wish to advance the rate of AI capabilities progress
[02:08]  We do not wish to advance the rate of AI
[02:13]  We do not wish to advance the rate of AI`
                  },
                  {
                    name: 'Nihil Supernum',
                    singer: 'The Fooming Shoggoths (ft Godric Gryffindor)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821417/album/Nihil_Supernum-_AudioTrimmer.com_vmj8in.mp3',
                    lyric: `
                    [00:00]  Non est salvatori salvator, neque defensori dominus,
[00:04]  Nec pater nec mater, nihil supernum.
[00:07] No rescuer hath the rescuer. No lord hath the champion.
[00:11] No mother and no father. Only nothingness above.
[00:15] Non est salvatori salvator, neque defensori dominus,
[00:19] Nec pater nec mater, nihil supernum.
[00:22] No rescuer hath the rescuer. No lord hath the champion.
[00:26] No mother and no father. Only nothingness above.
[00:59] Non est salvatori salvator, neque defensori dominus,
[01:04] Nec pater nec mater, nihil supernum
[01:07] No rescuer hath the rescuer. No lord hath the champion.
[01:10] No mother and no father. Only nothingness above.
[01:50] Non est salvatori salvator, neque defensori dominus,
[01:55] Nec pater nec mater, nihil supernum
[01:58] No rescuer hath the rescuer. No lord hath the champion.
[02:01] No mother and no father. Only nothingness above.
[02:05] Non est salvatori salvator, neque defensori dominus,
[02:09.80] Nec pater nec mater, nihil supernum
[02:13] No rescuer hath the rescuer. No lord hath the champion.
[02:17] No mother and no father. Only nothingness above.`
                  },
                  {
                    name: 'More Dakka',
                    singer: 'The Fooming Shoggoths (ft Zvi Mowshowitz)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821416/album/more_dakka_1_iajow3.mp3',
                    lyric: `
                    [00:00]  If you think a problem could be solved
                    [00:04] or a situation improved
                    [00:06] by More Dakka
                    [00:08] there’s a good chance you’re right
                    [00:14] Sometimes a little more, is a little better
                    [00:20] Sometimes a lot more, is a lot better
                    [00:26] If something is a good idea
                    [00:29] you need a reason to not try doing more of it
                    [00:33] No, seriously.
                    [00:34.80] You need a reason
                    [00:41] Sometimes a little more, is a little better
                    [00:47] Sometimes a lot more, is a lot better
                    [00:54] If something is a good idea
                    [00:57] you need a reason to not try doing more of it
                    [01:00] No, seriously.
                    [01:02] You need a reason
                    [01:04] Sometimes each attempt, is unlikely to work
                    [01:07] But improves your chances
                    [01:14] Sometimes each attempt, is unlikely to work
                    [01:17] But improves your chances
                    [01:22] Sometimes a little more, is a little better
                    [01:28] Sometimes a lot more, is a lot better
                    [01:34] If something is a good idea, do more of what is already working
                    [01:41] And see if it works more. It's as basic as it gets
                    [01:45.70] If we can't reliably try that, we can't reliably try anything
                    [01:51] Sometimes a little more, is a little better
                    [01:57] Sometimes a lot more, is a lot better`
                  },
                  {
                    name: 'FHI at Oxford',
                    singer: 'The Fooming Shoggoths (ft Nick Bostrom)',
                    cover: 'https://nickbostrom.com/poetry/poop10.jpg',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821419/album/FHI_at_Oxford_1_-_AudioTrimmer.com_vxhs0x.mp3',
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
                    name: 'Answer to Job',
                    singer: 'The Fooming Shoggoths (ft Scott Alexander)',
                    cover: 'https://putanumonit.files.wordpress.com/2020/02/ex-china-cases.png',
                    musicSrc: 'https://res.cloudinary.com/lesswrong-2-0/video/upload/v1711821413/album/Answer_to_Job_jxfzrh.mp3',
                    lyric: `
                    [00:01] In the most perfectly happy and just universe,
[00:10] There is no space, no time, no change, no decay.
[00:17] The beings who inhabit this universe are without bodies,
[00:24] And do not hunger or thirst or labor or lust.
[00:28] They sit upon lotus thrones,
[00:32] And contemplate the perfection of all things.
[00:37] They sit upon lotus thrones,
[00:41] And contemplate the perfection of all things.
[00:46] If I were to uncreate all worlds save that one.
[00:50] Would it mean making you happier?
[00:56] There is no space, no time, no change, no decay.
[01:04] The beings who inhabit this universe are without bodies,
[01:09] And do not hunger or thirst or labor or lust.
[01:14] They sit upon lotus thrones,
[01:18] And contemplate the perfection of all things.
[01:24] They sit upon lotus thrones,
[01:28] And contemplate the perfection of all things.
[01:33] In the most perfectly happy and just universe,
[01:42] There is no space, no time, no change, no decay.
[01:48] The beings who inhabit this universe are without bodies,
[01:55] And do not hunger or thirst or labor or lust.
[01:59] They sit upon lotus thrones,
[02:03] And contemplate the perfection of all things.
[02:09] I have also created all happier and more virtuous versions of you.
[02:17] It is ethically correct that after creating them,
[02:22] I create you as well.
[02:25] The beings who inhabit this universe are without bodies,
[02:31] And do not hunger or thirst or labor or lust.
[02:36] They sit upon lotus thrones,
[02:40] And contemplate the perfection of all things.
[02:45] In the most perfectly happy and just universe,
[02:54] There is no space, no time, no change, no decay.`
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
                      <div className={classNames(classes.lessOnlineBannerText, {[classes.lessOnlineBannerTextLimitedSpace]: !hideNavigationSidebar})}>
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
