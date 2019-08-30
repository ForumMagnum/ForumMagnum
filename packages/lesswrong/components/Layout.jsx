import { Components, registerComponent, getSetting, withUpdate } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import Users from 'meteor/vulcan:users';
import { Helmet } from 'react-helmet';
import CssBaseline from '@material-ui/core/CssBaseline';
import classNames from 'classnames'
import Intercom from 'react-intercom';
import moment from 'moment-timezone';
import { withCookies } from 'react-cookie'
import LogRocket from 'logrocket'

import { withStyles, withTheme } from '@material-ui/core/styles';
import { withLocation } from '../lib/routeUtil';
import { UserContext } from './common/withUser';
import { TimezoneContext } from './common/withTimezone';
import { DialogManager } from './common/withDialog';
import { TableOfContentsContext } from './posts/TableOfContents/TableOfContents';
import { PostsReadContext } from './common/withRecordPostView';

const intercomAppId = getSetting('intercomAppId', 'wtb8z7sj');
const googleTagManagerId = getSetting('googleTagManager.apiKey')

// From https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
// Simple hash for randomly sampling users. NOT CRYPTOGRAPHIC.
const hashCode = function(str) {
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
const standaloneNavMenuRouteNames = {
  'LessWrong': [
    'home', 'allPosts', 'questions', 'sequencesHome', 'CommunityHome', 'Shortform', 'Codex',
    'HPMOR', 'Rationality', 'Sequences', 'collections'
  ],
  // TODO-PR-Q: I left this mimicking current behavior, it's possible you'd
  // rather just have an empty list
  'AlignmentForum': ['alignment.home', 'sequencesHome', 'allPosts', 'questions', 'Shortform'],
  'EAForum': ['home', 'allPosts', 'questions', 'Community', 'Shortform'],
}

const styles = theme => ({
  main: {
    margin: '50px auto 15px auto',
    [theme.breakpoints.down('sm')]: {
      marginTop: -16,
      paddingLeft: theme.spacing.unit,
      paddingRight: theme.spacing.unit,
    },
  },
  '@global': {
    p: {
      marginTop: "1em",
      marginBottom: "1em",
      '&:first-of-type': {
        marginTop: 0,
      },
      '&:last-of-type': {
        marginBottom: 0,
      }
    },
  },
  searchResultsArea: {
    position: "absolute",
    zIndex: theme.zIndexes.layout,
    top: 0,
    width: "100%",
  },
})

class Layout extends PureComponent {
  constructor (props) {
    super(props);
    const { cookies, currentUser } = this.props;
    const savedTimezone = cookies?.get('timezone');

    this.state = {
      timezone: savedTimezone,
      toc: null,
      postsRead: {},
      hideNavigationSidebar: !!(currentUser?.hideNavigationSidebar),
    };

    this.searchResultsAreaRef = React.createRef();
  }

  setToC = (document, sectionData) => {
    if (document) {
      this.setState({
        toc: {
          document: document,
          sections: sectionData && sectionData.sections
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
        updateUser({
          selector: { _id: currentUser._id},
          data: {
            hideNavigationSidebar: !prevState.hideNavigationSidebar
          },
        })
      }
      return {
        hideNavigationSidebar: !prevState.hideNavigationSidebar
      }
    })
  }

  getUniqueClientId = () => {
    const { currentUser, cookies } = this.props

    if (currentUser) return currentUser._id

    const cookieId = cookies.get('clientId')
    if (cookieId) return cookieId

    const newId = Random.id()
    cookies.set('clientId', newId)
    return newId
  }

  initializeLogRocket = () => {
    const { currentUser } = this.props
    const logRocketKey = getSetting('logRocket.apiKey')
    if (logRocketKey) {
      // If the user is logged in, always log their sessions
      if (currentUser) {
        LogRocket.init()
        return
      }

      // If the user is not logged in, only track 1/5 of the sessions
      const clientId = this.getUniqueClientId()
      const hash = hashCode(clientId)
      if (hash % getSetting('logRocket.sampleDensity') === 0) {
        LogRocket.init(getSetting('logRocket.apiKey'))
      }
    }
  }

  componentDidMount() {
    const { cookies } = this.props;
    const newTimezone = moment.tz.guess();
    if(this.state.timezone !== newTimezone) {
      cookies.set('timezone', newTimezone);
      this.setState({
        timezone: newTimezone
      });
    }
    this.initializeLogRocket()
  }

  render () {
    const {currentUser, location, children, classes, theme, messages} = this.props;
    const {hideNavigationSidebar} = this.state

    const showIntercom = currentUser => {
      if (currentUser && !currentUser.hideIntercom) {
        return <div id="intercome-outer-frame">
          <Components.ErrorBoundary>
            <Intercom
              appID={intercomAppId}
              user_id={currentUser._id}
              email={currentUser.email}
              name={currentUser.displayName}/>
          </Components.ErrorBoundary>
        </div>
      } else if (!currentUser) {
        return <div id="intercome-outer-frame">
            <Components.ErrorBoundary>
              <Intercom appID={intercomAppId}/>
            </Components.ErrorBoundary>
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
    const standaloneNavigation = !location.currentRoute ||
      standaloneNavMenuRouteNames[getSetting('forumType')]
        .includes(location.currentRoute.name)
    
    return (
      <UserContext.Provider value={currentUser}>
      <TimezoneContext.Provider value={this.state.timezone}>
      <PostsReadContext.Provider value={{
        postsRead: this.state.postsRead,
        setPostRead: (postId, isRead) => this.setState({
          postsRead: {...this.state.postsRead, [postId]: isRead}
        })
      }}>
      <TableOfContentsContext.Provider value={this.setToC}>
        <div className={classNames("wrapper", {'alignment-forum': getSetting('forumType') === 'AlignmentForum'}) } id="wrapper">
          <DialogManager>
          <div>
            <CssBaseline />
            <Helmet>
              <link name="material-icons" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@7.0.0/themes/reset-min.css"/>
              <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"/>
              { theme.typography.fontDownloads &&
                  theme.typography.fontDownloads.map(
                    (url)=><link rel="stylesheet" key={`font-${url}`} href={url}/>
                  )
              }
              <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
              <link rel="stylesheet" href="https://use.typekit.net/jvr1gjm.css"/>
            </Helmet>
            {/* Deactivating this component for now, since it's been causing a good amount of bugs. TODO: Fix this properly */}
            {/* {currentUser ? <Components.UsersProfileCheck currentUser={currentUser} documentId={currentUser._id} /> : null} */}

            {/* Sign up user for Intercom, if they do not yet have an account */}
            {showIntercom(currentUser)}
            <noscript className="noscript-warning"> This website requires javascript to properly function. Consider activating javascript to get access to all site functionality. </noscript>
            {/* Google Tag Manager i-frame fallback */}
            <noscript><iframe src={`https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`} height="0" width="0" style={{display:"none", visibility:"hidden"}}/></noscript>
            <Components.Header
              toc={this.state.toc}
              searchResultsArea={this.searchResultsAreaRef}
              standaloneNavigationPresent={standaloneNavigation}
              toggleStandaloneNavigation={this.toggleStandaloneNavigation}
            />
            {standaloneNavigation && <Components.NavigationStandalone
              sidebarHidden={hideNavigationSidebar}
            />}
            <div ref={this.searchResultsAreaRef} className={classes.searchResultsArea} />
            <div className={classes.main}>
              <Components.ErrorBoundary>
                <Components.FlashMessages messages={messages} />
              </Components.ErrorBoundary>
              <Components.ErrorBoundary>
                {children}
              </Components.ErrorBoundary>
            </div>
            <Components.Footer />
          </div>
          </DialogManager>
        </div>
      </TableOfContentsContext.Provider>
      </PostsReadContext.Provider>
      </TimezoneContext.Provider>
      </UserContext.Provider>
    )
  }
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
}

registerComponent(
  'Layout', Layout, withLocation, withCookies, [withUpdate, withUpdateOptions],
  withStyles(styles, { name: "Layout" }), withTheme
);
