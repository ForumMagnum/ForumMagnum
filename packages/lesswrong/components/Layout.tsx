import React, { useCallback, useState, useRef, useMemo, useEffect } from 'react';
import { Components, registerComponent } from '../lib/vulcan-lib';
import { useUpdate } from '../lib/crud/withUpdate';
import { HistoryPersistentState, HistoryPersistentStateContext } from './hooks/useHistoryPersistentState';
import Users from '../lib/collections/users/collection';
import { Helmet } from 'react-helmet';
import CssBaseline from '@material-ui/core/CssBaseline';
import classNames from 'classnames'
import Intercom from 'react-intercom';
import moment from '../lib/moment-timezone';
import { useCookies } from 'react-cookie'
import LogRocket from 'logrocket'
import { randomId } from '../lib/random';

import { withTheme } from '@material-ui/core/styles';
import { useLocation } from '../lib/routeUtil';
import { AnalyticsContext } from '../lib/analyticsEvents'
import { UserContext } from './common/withUser';
import { TimezoneContext } from './common/withTimezone';
import { DialogManager } from './common/withDialog';
import { CommentBoxManager } from './common/withCommentBox';
import { TableOfContentsContext } from './posts/TableOfContents/TableOfContents';
import { ItemsReadContext } from './common/withRecordPostView';
import { pBodyStyle } from '../themes/stylePiping';
import { DatabasePublicSetting, googleTagManagerIdSetting, logRocketApiKeySetting } from '../lib/publicSettings';
import { forumTypeSetting } from '../lib/instanceSettings';

const intercomAppIdSetting = new DatabasePublicSetting<string>('intercomAppId', 'wtb8z7sj')
const logRocketSampleDensitySetting = new DatabasePublicSetting<number>('logRocket.sampleDensity', 5)
const petrovBeforeTime = new DatabasePublicSetting<number>('petrov.beforeTime', 1601103600000)
const petrovAfterTime = new DatabasePublicSetting<number>('petrov.afterTime', 1601190000000)

// From https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
// Simple hash for randomly sampling users. NOT CRYPTOGRAPHIC.
const hashCode = function(str: string): number {
  var hash = 0, i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// These routes will have the standalone TabNavigationMenu (aka sidebar)
//
// Refer to routes.js for the route names. Or console log in the route you'd
// like to include
const standaloneNavMenuRouteNames: Record<string,string[]> = {
  'LessWrong': [
    'home', 'allPosts', 'questions', 'sequencesHome', 'Shortform', 'Codex',
    'HPMOR', 'Rationality', 'Sequences', 'collections', 'nominations', 'reviews'
  ],
  'AlignmentForum': ['alignment.home', 'sequencesHome', 'allPosts', 'questions', 'Shortform'],
  'EAForum': ['home', 'allPosts', 'questions', 'Community', 'Shortform'],
}

const styles = (theme: ThemeType): JssStyles => ({
  main: {
    paddingTop: 50,
    paddingBottom: 15,
    marginLeft: "auto",
    marginRight: "auto",
    background: theme.palette.background.default,
    minHeight: `calc(100vh - 64px)`, //64px is approximately the height of the header
    gridArea: 'main', 
    [theme.breakpoints.down('sm')]: {
      paddingTop: 0,
      paddingLeft: theme.spacing.unit/2,
      paddingRight: theme.spacing.unit/2,
    },
  },
  gridActivated: {
    '@supports (grid-template-areas: "title")': {
      display: 'grid',
      gridTemplateAreas: `
        "navSidebar ... main ... sunshine"
      `,
      gridTemplateColumns: `
      minmax(0, min-content)
      minmax(0, 1fr)
      minmax(0, 765px)
      minmax(0, 1.4fr)
      minmax(0, min-content)
    `,
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
    background: "white",
  },
  '@global': {
    p: pBodyStyle,
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
    zIndex: theme.zIndexes.layout,
    top: 0,
    width: "100%",
  },
})

interface ExternalProps {
  currentUser: UsersCurrent|null,
  children: React.ReactNode,
}

const Layout = ({currentUser, children, theme, classes}: {
  currentUser: UsersCurrent|null,
  children: React.ReactNode,
  theme: ThemeType,
  classes: ClassesType
}) => {
  const [cookies,setCookie] = useCookies(['clientId', 'timezone']);
  const savedTimezone = cookies.timezone;
  const [timezone,setTimezone] = useState(savedTimezone);
  const [toc,setToc] = useState<any>(null);
  const [postsRead,setPostsRead] = useState<Record<string,boolean>>({});
  const [tagsRead,setTagsRead] = useState<Record<string,boolean>>({});
  const [hideNavigationSidebar,setHideNavigationSidebar] = useState(!!(currentUser?.hideNavigationSidebar));
  const historyPersistentState = useRef({});
  const searchResultsAreaRef = useRef<HTMLDivElement|null>(null);
  const location = useLocation();
  const {mutate: updateUser} = useUpdate({
    collection: Users,
    fragmentName: 'UsersCurrent',
  });

  const updateToC = (document, sectionData) => {
    if (document) {
      setToc({
        document: document,
        sections: sectionData && sectionData.sections
      });
    } else {
      setToc(null);
    }
  }

  const toggleStandaloneNavigation = () => {
    if (currentUser) {
      void updateUser({
        selector: { _id: currentUser._id},
        data: {
          hideNavigationSidebar: !hideNavigationSidebar
        },
      })
    }
    setHideNavigationSidebar(!hideNavigationSidebar);
  }

  const getUniqueClientId = useCallback(() => {
    if (currentUser) return currentUser._id

    const cookieId = cookies.clientId;
    if (cookieId) return cookieId

    const newId = randomId()
    setCookie('clientId', newId)
    return newId
  }, [currentUser, cookies.clientId, setCookie]);

  useEffect(function initializeLogRocket() {
    const logRocketKey = logRocketApiKeySetting.get()
    if (logRocketKey) {
      // If the user is logged in, always log their sessions
      if (currentUser) {
        LogRocket.init(logRocketKey)
        return
      }

      // If the user is not logged in, only track 1/5 of the sessions
      const clientId = getUniqueClientId()
      const hash = hashCode(clientId)
      if (hash % logRocketSampleDensitySetting.get() === 0) {
        LogRocket.init(logRocketKey)
      }
    }
  }, [currentUser, getUniqueClientId]);

  const momentTimezone = useMemo(() => moment.tz.guess(), []);
  useEffect(() => {
    if(timezone !== momentTimezone) {
      setCookie('timezome', momentTimezone);
      setTimezone(momentTimezone);
    }
  }, [momentTimezone, setCookie, timezone]);

  const render = () => {
    const { NavigationStandalone, SunshineSidebar, ErrorBoundary, Footer, Header, FlashMessages, AnalyticsClient, AnalyticsPageInitializer, NavigationEventSender, PetrovDayWrapper } = Components

    const showIntercom = (currentUser: UsersCurrent|null) => {
      if (currentUser && !currentUser.hideIntercom) {
        return <div id="intercome-outer-frame">
          <ErrorBoundary>
            <Intercom
              appID={intercomAppIdSetting.get()}
              user_id={currentUser._id}
              email={currentUser.email}
              name={currentUser.displayName}/>
          </ErrorBoundary>
        </div>
      } else if (!currentUser) {
        return <div id="intercome-outer-frame">
            <ErrorBoundary>
              <Intercom appID={intercomAppIdSetting.get()}/>
            </ErrorBoundary>
          </div>
      } else {
        return null
      }
    }

    // Check whether the current route is one which should have standalone
    // navigation on the side. If there is no current route (ie, a 404 page),
    // then it should.
    // FIXME: This is using route names, but it would be better if this was
    // a property on routes themselves.

    const currentRoute = location.currentRoute
    const standaloneNavigation = !currentRoute ||
      standaloneNavMenuRouteNames[forumTypeSetting.get()]
        .includes(currentRoute?.name)
        
    const shouldUseGridLayout = standaloneNavigation

    const currentTime = new Date()
    const beforeTime = petrovBeforeTime.get()
    const afterTime = petrovAfterTime.get()

    const renderPetrovDay = 
      currentRoute?.name == "home"
      && forumTypeSetting.get() === "LessWrong"
      && beforeTime < currentTime.valueOf() && currentTime.valueOf() < afterTime

    return (
      <AnalyticsContext path={location.pathname}>
      <UserContext.Provider value={currentUser}>
      <TimezoneContext.Provider value={timezone}>
      <ItemsReadContext.Provider value={{
        postsRead: postsRead,
        setPostRead: (postId: string, isRead: boolean): void => {
          setPostsRead(
            {...postsRead, [postId]: isRead}
          )
        },
        tagsRead: tagsRead,
        setTagRead: (tagId: string, isRead: boolean): void => {
          setTagsRead(
            {...tagsRead, [tagId]: isRead}
          )
        },
      }}>
      <TableOfContentsContext.Provider value={updateToC}>
      <HistoryPersistentStateContext.Provider value={historyPersistentState.current}>
        <div className={classNames("wrapper", {'alignment-forum': forumTypeSetting.get() === 'AlignmentForum'}) } id="wrapper">
          <DialogManager>
            <CommentBoxManager>
              <CssBaseline />
              <Helmet>
                <link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7.0.0/themes/reset-min.css"/>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"/>
                { theme.typography.fontDownloads &&
                    theme.typography.fontDownloads.map(
                      (url: string)=><link rel="stylesheet" key={`font-${url}`} href={url}/>
                    )
                }
                <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
                <link rel="stylesheet" href="https://use.typekit.net/jvr1gjm.css"/>
              </Helmet>

              <AnalyticsClient/>
              <AnalyticsPageInitializer/>
              <NavigationEventSender/>

              {/* Sign up user for Intercom, if they do not yet have an account */}
              {showIntercom(currentUser)}
              <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
              {/* Google Tag Manager i-frame fallback */}
              <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerIdSetting.get()}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>
              <Header
                toc={toc}
                searchResultsArea={searchResultsAreaRef}
                standaloneNavigationPresent={standaloneNavigation}
                toggleStandaloneNavigation={toggleStandaloneNavigation}
              />
              {renderPetrovDay && <PetrovDayWrapper/>}
              <div className={shouldUseGridLayout ? classes.gridActivated : null}>
                {standaloneNavigation && <div className={classes.navSidebar}>
                  <NavigationStandalone sidebarHidden={hideNavigationSidebar}/>
                </div>}
                <div ref={searchResultsAreaRef} className={classes.searchResultsArea} />
                <div className={classNames(classes.main, {
                  [classes.whiteBackground]: currentRoute?.background === "white"
                })}>
                  <ErrorBoundary>
                    <FlashMessages />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    {children}
                  </ErrorBoundary>
                  <Footer />
                </div>
                {currentRoute?.sunshineSidebar && <div className={classes.sunshine}>
                    <SunshineSidebar/>
                  </div>
                  }
              </div>
            </CommentBoxManager>
          </DialogManager>
        </div>
      </HistoryPersistentStateContext.Provider>
      </TableOfContentsContext.Provider>
      </ItemsReadContext.Provider>
      </TimezoneContext.Provider>
      </UserContext.Provider>
      </AnalyticsContext>
    )
  }
  
  return render();
}

const LayoutComponent = registerComponent<ExternalProps>(
  'Layout', Layout, { styles, hocs: [
    withTheme()
  ]}
);

declare global {
  interface ComponentTypes {
    Layout: typeof LayoutComponent
  }
}
