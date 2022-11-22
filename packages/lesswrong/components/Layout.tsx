import React, {useRef, useState, useCallback} from 'react';
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
import { CommentBoxManager } from './common/withCommentBox';
import { ItemsReadContextWrapper } from './hooks/useRecordPostView';
import { pBodyStyle } from '../themes/stylePiping';
import { DatabasePublicSetting, googleTagManagerIdSetting } from '../lib/publicSettings';
import { forumTypeSetting } from '../lib/instanceSettings';
import { globalStyles } from '../themes/globalStyles/globalStyles';
import type { ToCData, ToCSection } from '../server/tableOfContents';
import { ForumOptions, forumSelect } from '../lib/forumTypeUtils';
import { userCanDo } from '../lib/vulcan-users/permissions';
import { getUserEmail } from "../lib/collections/users/helpers";
import { DisableNoKibitzContext } from './users/UsersNameDisplay';

export const petrovBeforeTime = new DatabasePublicSetting<number>('petrov.beforeTime', 0)
const petrovAfterTime = new DatabasePublicSetting<number>('petrov.afterTime', 0)

// These routes will have the standalone TabNavigationMenu (aka sidebar)
//
// Refer to routes.js for the route names. Or console log in the route you'd
// like to include
const standaloneNavMenuRouteNames: ForumOptions<string[]> = {
  'LessWrong': [
    'home', 'allPosts', 'questions', 'library', 'Shortform', 'Codex', 'bestoflesswrong',
    'HPMOR', 'Rationality', 'Sequences', 'collections', 'nominations', 'reviews', 'highlights'
  ],
  'AlignmentForum': ['alignment.home', 'library', 'allPosts', 'questions', 'Shortform'],
  'EAForum': ['home', 'allPosts', 'questions', 'Shortform', 'eaLibrary', 'handbook', 'advice', 'advisorRequest', 'tagsSubforum'],
  'default': ['home', 'allPosts', 'questions', 'Community', 'Shortform',],
}

const styles = (theme: ThemeType): JssStyles => ({
  main: {
    paddingTop: 50,
    paddingBottom: 15,
    marginLeft: "auto",
    marginRight: "auto",
    background: theme.palette.background.default,
    // Make sure the background extends to the bottom of the page, I'm sure there is a better way to do this
    // but almost all pages are bigger than this anyway so it's not that important
    minHeight: `calc(100vh - ${forumTypeSetting.get() === "EAForum" ? 90 : 64}px)`,
    gridArea: 'main',
    [theme.breakpoints.down('sm')]: {
      paddingTop: 0,
      paddingLeft: 8,
      paddingRight: 8,
    },
  },
  mainFullscreen: {
    height: "100%",
    padding: 0,
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
    },
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
})

const Layout = ({currentUser, children, classes}: {
  currentUser: UsersCurrent|null,
  children?: React.ReactNode,
  classes: ClassesType,
}) => {
  const searchResultsAreaRef = useRef<HTMLDivElement|null>(null);
  const [sideCommentsActive,setSideCommentsActive] = useState(false);
  const [disableNoKibitz, setDisableNoKibitz] = useState(false);
  const [hideNavigationSidebar,setHideNavigationSidebar] = useState(!!(currentUser?.hideNavigationSidebar));
  const theme = useTheme();
  const location = useLocation();
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
  
  
  const render = () => {
    const { NavigationStandalone, ErrorBoundary, Footer, Header, FlashMessages, AnalyticsClient, AnalyticsPageInitializer, NavigationEventSender, PetrovDayWrapper, NewUserCompleteProfile, CommentOnSelectionPageWrapper, SidebarsWrapper, IntercomWrapper } = Components

    // Check whether the current route is one which should have standalone
    // navigation on the side. If there is no current route (ie, a 404 page),
    // then it should.
    // FIXME: This is using route names, but it would be better if this was
    // a property on routes themselves.

    const currentRoute = location.currentRoute
    const standaloneNavigation = !currentRoute ||
      forumSelect(standaloneNavMenuRouteNames)
        .includes(currentRoute?.name)
    
    const renderSunshineSidebar = currentRoute?.sunshineSidebar && (userCanDo(currentUser, 'posts.moderate.all') || currentUser?.groups?.includes('alignmentForumAdmins'))
    
    const shouldUseGridLayout = standaloneNavigation
    const unspacedGridLayout = currentRoute?.unspacedGrid

    const renderPetrovDay = () => {
      const currentTime = (new Date()).valueOf()
      const beforeTime = petrovBeforeTime.get()
      const afterTime = petrovAfterTime.get()
    
      return currentRoute?.name === "home"
        && ('LessWrong' === forumTypeSetting.get())
        && beforeTime < currentTime 
        && currentTime < afterTime
    }
    
    return (
      <AnalyticsContext path={location.pathname}>
      <UserContext.Provider value={currentUser}>
      <TimezoneWrapper>
      <ItemsReadContextWrapper>
      <SidebarsWrapper>
      <DisableNoKibitzContext.Provider value={{ disableNoKibitz, setDisableNoKibitz }}>
      <CommentOnSelectionPageWrapper>
        <div className={classNames("wrapper", {'alignment-forum': forumTypeSetting.get() === 'AlignmentForum', [classes.fullscreen]: currentRoute?.fullscreen}) } id="wrapper">
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
              <IntercomWrapper/>

              <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
              {/* Google Tag Manager i-frame fallback */}
              <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerIdSetting.get()}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>
              
              {!currentRoute?.standalone && <Header
                searchResultsArea={searchResultsAreaRef}
                standaloneNavigationPresent={standaloneNavigation}
                toggleStandaloneNavigation={toggleStandaloneNavigation}
                stayAtTop={Boolean(currentRoute?.fullscreen)}
              />}
              
              {renderPetrovDay() && <PetrovDayWrapper/>}
              
              <div className={classNames(classes.standaloneNavFlex, {
                [classes.spacedGridActivated]: shouldUseGridLayout && !unspacedGridLayout,
                [classes.unspacedGridActivated]: shouldUseGridLayout && unspacedGridLayout,
                [classes.fullscreenBodyWrapper]: currentRoute?.fullscreen}
              )}>
                {standaloneNavigation && <NavigationStandalone
                  sidebarHidden={hideNavigationSidebar}
                  unspacedGridLayout={unspacedGridLayout}
                  className={classes.standaloneNav}
                />}
                <div ref={searchResultsAreaRef} className={classes.searchResultsArea} />
                <div className={classNames(classes.main, {
                  [classes.whiteBackground]: currentRoute?.background === "white",
                  [classes.mainFullscreen]: currentRoute?.fullscreen,
                })}>
                  <ErrorBoundary>
                    <FlashMessages />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    {currentUser?.usernameUnset
                      ? <NewUserCompleteProfile currentUser={currentUser}/>
                      : children
                    }
                  </ErrorBoundary>
                  {!currentRoute?.fullscreen && <Footer />}
                </div>
                {renderSunshineSidebar && <div className={classes.sunshine}>
                  <Components.SunshineSidebar/>
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
