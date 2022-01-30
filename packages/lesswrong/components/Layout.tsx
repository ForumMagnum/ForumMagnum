import { Components, registerComponent } from '../lib/vulcan-lib';
import { withUpdate } from '../lib/crud/withUpdate';
import React, { PureComponent } from 'react';
import { Helmet } from 'react-helmet';
import classNames from 'classnames'
import Intercom from 'react-intercom';
import moment from '../lib/moment-timezone';
import { withCookies } from 'react-cookie'

import { withTheme } from '@material-ui/core/styles';
import { withLocation } from '../lib/routeUtil';
import { AnalyticsContext } from '../lib/analyticsEvents'
import { UserContext } from './common/withUser';
import { TimezoneContext } from './common/withTimezone';
import { DialogManager } from './common/withDialog';
import { CommentBoxManager } from './common/withCommentBox';
import { TableOfContentsContext } from './posts/TableOfContents/TableOfContents';
import { ItemsReadContext } from './common/withRecordPostView';
import { pBodyStyle } from '../themes/stylePiping';
import { DatabasePublicSetting, googleTagManagerIdSetting } from '../lib/publicSettings';
import { forumTypeSetting } from '../lib/instanceSettings';
import { globalStyles } from '../lib/globalStyles';
import type { ToCData, ToCSection } from '../server/tableOfContents';
import { ForumOptions, forumSelect } from '../lib/forumTypeUtils';

const intercomAppIdSetting = new DatabasePublicSetting<string>('intercomAppId', 'wtb8z7sj')
const petrovBeforeTime = new DatabasePublicSetting<number>('petrov.beforeTime', 1631226712000)
const petrovAfterTime = new DatabasePublicSetting<number>('petrov.afterTime', 1641231428737)

// These routes will have the standalone TabNavigationMenu (aka sidebar)
//
// Refer to routes.js for the route names. Or console log in the route you'd
// like to include
const standaloneNavMenuRouteNames: ForumOptions<string[]> = {
  'LessWrong': [
    'home', 'allPosts', 'questions', 'sequencesHome', 'Shortform', 'Codex', 'bestoflesswrong',
    'HPMOR', 'Rationality', 'Sequences', 'collections', 'nominations', 'reviews'
  ],
  'AlignmentForum': ['alignment.home', 'sequencesHome', 'allPosts', 'questions', 'Shortform'],
  'EAForum': ['home', 'allPosts', 'questions', 'Community', 'Shortform', 'eaLibrary'],
  'default': ['home', 'allPosts', 'questions', 'Community', 'Shortform',],
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
      minmax(0, min-content)
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
    ...globalStyles(theme),
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
  currentUser: UsersCurrent | null,
  messages: any,
  children?: React.ReactNode,
}
interface LayoutProps extends ExternalProps, WithLocationProps, WithStylesProps {
  cookies: any,
  theme: ThemeType,
  updateUser: any,
}
interface LayoutState {
  timezone: string,
  toc: {title: string|null, sections?: ToCSection[]}|null,
  postsRead: Record<string,boolean>,
  tagsRead: Record<string,boolean>,
  hideNavigationSidebar: boolean,
}

class Layout extends PureComponent<LayoutProps,LayoutState> {
  searchResultsAreaRef: React.RefObject<HTMLDivElement>
  
  constructor (props: LayoutProps) {
    super(props);
    const { cookies, currentUser } = this.props;
    const savedTimezone = cookies?.get('timezone');

    this.state = {
      timezone: savedTimezone,
      toc: null,
      postsRead: {},
      tagsRead: {},
      hideNavigationSidebar: !!(currentUser?.hideNavigationSidebar),
    };

    this.searchResultsAreaRef = React.createRef<HTMLDivElement>();
  }

  setToC = (title: string|null, sectionData: ToCData|null) => {
    if (title) {
      this.setState({
        toc: {
          title: title,
          sections: sectionData?.sections
        }
      });
    } else {
      this.setState({
        toc: null,
      });
    }
  }

  toggleStandaloneNavigation = () => {
    const { updateUser, currentUser } = this.props
    this.setState(prevState => {
      if (currentUser) {
        void updateUser({
          selector: {_id: currentUser._id},
          data: {
            hideNavigationSidebar: !prevState.hideNavigationSidebar
          }
        })
      }
      return {
        hideNavigationSidebar: !prevState.hideNavigationSidebar
      }
    })
  }

  componentDidMount() {
    const { updateUser, currentUser, cookies } = this.props;
    const newTimezone = moment.tz.guess();
    if(this.state.timezone !== newTimezone || (currentUser?.lastUsedTimezone !== newTimezone)) {
      cookies.set('timezone', newTimezone);
      if (currentUser) {
        void updateUser({
          selector: {_id: currentUser._id},
          data: {
            lastUsedTimezone: newTimezone,
          }
        })
      }
      this.setState({
        timezone: newTimezone
      });
    }
  }

  render () {
    const {currentUser, location, children, classes, theme} = this.props;
    const {hideNavigationSidebar} = this.state
    const { NavigationStandalone, SunshineSidebar, ErrorBoundary, Footer, Header, FlashMessages, AnalyticsClient, AnalyticsPageInitializer, NavigationEventSender, PetrovDayWrapper, NewUserCompleteProfile, BannedNotice } = Components

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
      forumSelect(standaloneNavMenuRouteNames)
        .includes(currentRoute?.name)
        
    const shouldUseGridLayout = standaloneNavigation

    const currentTime = new Date()
    const beforeTime = petrovBeforeTime.get()
    const afterTime = petrovAfterTime.get()

    const renderPetrovDay = 
      currentRoute?.name === "home"
      && ['LessWrong', 'EAForum'].includes(forumTypeSetting.get())
      && beforeTime < currentTime.valueOf() && currentTime.valueOf() < afterTime
      
    return (
      <AnalyticsContext path={location.pathname}>
      <UserContext.Provider value={currentUser}>
      <TimezoneContext.Provider value={this.state.timezone}>
      <ItemsReadContext.Provider value={{
        postsRead: this.state.postsRead,
        setPostRead: (postId: string, isRead: boolean): void => {
          this.setState({
            postsRead: {...this.state.postsRead, [postId]: isRead}
          })
        },
        tagsRead: this.state.tagsRead,
        setTagRead: (tagId: string, isRead: boolean): void => {
          this.setState({
            tagsRead: {...this.state.tagsRead, [tagId]: isRead}
          })
        },
      }}>
      <TableOfContentsContext.Provider value={this.setToC}>
        <div className={classNames("wrapper", {'alignment-forum': forumTypeSetting.get() === 'AlignmentForum'}) } id="wrapper">
          <DialogManager>
            <CommentBoxManager>
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
                toc={this.state.toc}
                searchResultsArea={this.searchResultsAreaRef}
                standaloneNavigationPresent={standaloneNavigation}
                toggleStandaloneNavigation={this.toggleStandaloneNavigation}
              />
              {renderPetrovDay && <PetrovDayWrapper/>}
              <div className={shouldUseGridLayout ? classes.gridActivated : null}>
                {standaloneNavigation && <div className={classes.navSidebar}>
                  <NavigationStandalone sidebarHidden={hideNavigationSidebar}/>
                </div>}
                <div ref={this.searchResultsAreaRef} className={classes.searchResultsArea} />
                <div className={classNames(classes.main, {
                  [classes.whiteBackground]: currentRoute?.background === "white"
                })}>
                  <ErrorBoundary>
                    <FlashMessages />
                  </ErrorBoundary>
                  <ErrorBoundary>
                    {currentUser?.usernameUnset
                      ? <NewUserCompleteProfile />
                      : children
                    }
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
      </TableOfContentsContext.Provider>
      </ItemsReadContext.Provider>
      </TimezoneContext.Provider>
      </UserContext.Provider>
      </AnalyticsContext>
    )
  }
}

const LayoutComponent = registerComponent<ExternalProps>(
  'Layout', Layout, { styles, hocs: [
    withLocation, withCookies,
    withUpdate({
      collectionName: "Users",
      fragmentName: 'UsersCurrent',
    }),
    withTheme()
  ]}
);

declare global {
  interface ComponentTypes {
    Layout: typeof LayoutComponent
  }
}
