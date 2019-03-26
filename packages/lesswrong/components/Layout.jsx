import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
// import { InstantSearch} from 'react-instantsearch-dom';
import React, { PureComponent } from 'react';
import { withRouter } from 'react-router';
import Helmet from 'react-helmet';
import { withApollo } from 'react-apollo';
import CssBaseline from '@material-ui/core/CssBaseline';
import classNames from 'classnames'
import Intercom from 'react-intercom';
import moment from 'moment-timezone';

import { withStyles, withTheme } from '@material-ui/core/styles';
import getHeaderSubtitleData from '../lib/modules/utils/getHeaderSubtitleData';
import { UserContext } from './common/withUser';
import { TimezoneContext } from './common/withTimezone';
import { DialogManager } from './common/withDialog';
import { TableOfContentsContext } from './posts/TableOfContents/TableOfContents';

import Users from 'meteor/vulcan:users';
import { SplitComponent } from 'meteor/vulcan:routing';

const intercomAppId = getSetting('intercomAppId', 'wtb8z7sj');

const styles = theme => ({
  main: {
    margin: '50px auto 15px auto',
    maxWidth: 1200,
    [theme.breakpoints.down('sm')]: {
      marginTop: 0,
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
  state = {
    timezone: null,
    toc: null,
  };
  
  searchResultsAreaRef = React.createRef();

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

  componentDidMount() {
    const newTimezone = moment.tz.guess();
    if(this.state.timezone !== newTimezone) {
      this.setState({
        timezone: newTimezone
      });
    }
  }

  shouldRenderSidebar = () => {
    const { currentUser } = this.props
    return Users.canDo(currentUser, 'posts.moderate.all') ||
      Users.canDo(currentUser, 'alignment.sidebar')
  }

  render () {
    const {currentUser, children, currentRoute, location, params, client, classes, theme} = this.props;

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

    const routeName = currentRoute.name
    const query = location && location.query
    const { subtitleText = currentRoute.title || "" } = getHeaderSubtitleData(routeName, query, params, client) || {}
    const siteName = getSetting('forumSettings.tabTitle', 'LessWrong 2.0');
    const title = subtitleText ? `${subtitleText} - ${siteName}` : siteName;

    return (
      <UserContext.Provider value={currentUser}>
      <TimezoneContext.Provider value={this.state.timezone}>
      <TableOfContentsContext.Provider value={this.setToC}>
        <div className={classNames("wrapper", {'alignment-forum': getSetting('AlignmentForum', false)}) } id="wrapper">
          <DialogManager>
          <div>
            <CssBaseline />
            <Helmet>
              <title>{title}</title>
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
            <Components.Header toc={this.state.toc} searchResultsArea={this.searchResultsAreaRef} />
            <div ref={this.searchResultsAreaRef} className={classes.searchResultsArea} />
            <div className={classes.main}>
              <Components.ErrorBoundary>
                <Components.FlashMessages />
              </Components.ErrorBoundary>
              {children}
              {this.shouldRenderSidebar() && <SplitComponent name="SunshineSidebar" />}
            </div>
            <Components.Footer />
          </div>
          </DialogManager>
        </div>
      </TableOfContentsContext.Provider>
      </TimezoneContext.Provider>
      </UserContext.Provider>
    )
  }
}

Layout.displayName = "Layout";

registerComponent('Layout', Layout, withRouter, withApollo, withStyles(styles, { name: "Layout" }), withTheme());
