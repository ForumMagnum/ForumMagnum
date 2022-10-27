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
import { globalStyles } from '../themes/globalStyles/globalStyles';
import type { ToCData, ToCSection } from '../server/tableOfContents';
import { ForumOptions, forumSelect } from '../lib/forumTypeUtils';
import { userCanDo } from '../lib/vulcan-users/permissions';
import { getUserEmail } from "../lib/collections/users/helpers";
import NoSSR from 'react-no-ssr';

const intercomAppIdSetting = new DatabasePublicSetting<string>('intercomAppId', 'wtb8z7sj')
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
  'EAForum': ['home', 'allPosts', 'questions', 'Shortform', 'eaLibrary', 'handbook', 'advice', 'advisorRequest'],
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
  mainNoPadding: {
    padding: 0,
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
    ...(theme.palette.intercom ? {
      '.intercom-launcher': {
        backgroundColor: theme.palette.intercom.buttonBackground
      }
    } : null),
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
    const { NavigationStandalone, ErrorBoundary, Footer, Header, FlashMessages, AnalyticsClient, AnalyticsPageInitializer, NavigationEventSender, PetrovDayWrapper, NewUserCompleteProfile, CommentOnSelectionPageWrapper } = Components

    const showIntercom = (currentUser: UsersCurrent|null) => {
      if (currentUser && !currentUser.hideIntercom) {
        return <div id="intercome-outer-frame">
          <ErrorBoundary>
            <Intercom
              appID={intercomAppIdSetting.get()}
              user_id={currentUser._id}
              email={getUserEmail(currentUser)}
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
    
    const renderSunshineSidebar = currentRoute?.sunshineSidebar && (userCanDo(currentUser, 'posts.moderate.all') || currentUser?.groups?.includes('alignmentForumAdmins'))
        
    const shouldUseGridLayout = standaloneNavigation

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
      <CommentOnSelectionPageWrapper>
        <div className={classNames("wrapper", classes.wrapper, {'alignment-forum': forumTypeSetting.get() === 'AlignmentForum'}) } id="wrapper">
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

              {/* Sign up user for Intercom, if they do not yet have an account */}
              {!currentRoute?.standalone && showIntercom(currentUser)}
              <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
              {/* Google Tag Manager i-frame fallback */}
              <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerIdSetting.get()}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>
              {!currentRoute?.standalone && <Header
                toc={this.state.toc}
                searchResultsArea={this.searchResultsAreaRef}
                standaloneNavigationPresent={standaloneNavigation}
                toggleStandaloneNavigation={this.toggleStandaloneNavigation}
              />}
              {renderPetrovDay() && <PetrovDayWrapper/>}
              <div className={shouldUseGridLayout ? classes.gridActivated : null}>
                {standaloneNavigation && <div className={classes.navSidebar}>
                  <NavigationStandalone sidebarHidden={hideNavigationSidebar}/>
                </div>}
                <div ref={this.searchResultsAreaRef} className={classes.searchResultsArea} />
                <div className={classNames(classes.main, {
                  [classes.whiteBackground]: currentRoute?.background === "white",
                  [classes.mainNoPadding]: currentRoute?.noPadding,
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
                  {!currentRoute?.hideFooter && <Footer />}
                </div>
                {renderSunshineSidebar && <div className={classes.sunshine}>
                  <NoSSR>
                    <Components.SunshineSidebar/>
                  </NoSSR>
                </div>}
              </div>
            </CommentBoxManager>
          </DialogManager>
        </div>
      </CommentOnSelectionPageWrapper>
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
