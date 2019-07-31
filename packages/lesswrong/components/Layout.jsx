import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
// import { InstantSearch} from 'react-instantsearch-dom';
import React, { PureComponent } from 'react';
import Helmet from 'react-helmet';
import CssBaseline from '@material-ui/core/CssBaseline';
import classNames from 'classnames'
import Intercom from 'react-intercom';
import moment from 'moment-timezone';
import { withCookies } from 'react-cookie'
import LogRocket from 'logrocket'

import { withStyles, withTheme } from '@material-ui/core/styles';
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
    const { cookies } = this.props;
    const savedTimezone = cookies?.get('timezone');
    
    this.state = {
      timezone: savedTimezone,
      toc: null,
      postsRead: {}
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

  componentWillUnmount() {
  }

  render () {
    const {currentUser, children, classes, theme} = this.props;

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
            />
            <div ref={this.searchResultsAreaRef} className={classes.searchResultsArea} />
            <div className={classes.main}>
              <Components.ErrorBoundary>
                <Components.FlashMessages />
              </Components.ErrorBoundary>
              {children}
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

Layout.displayName = "Layout";

registerComponent('Layout', Layout, withStyles(styles, { name: "Layout" }), withTheme(), withCookies);
