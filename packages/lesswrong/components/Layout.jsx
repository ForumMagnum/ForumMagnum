import { Components, replaceComponent, getSetting } from 'meteor/vulcan:core';
// import { InstantSearch} from 'react-instantsearch/dom';
import React, { Component } from 'react';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { withApollo } from 'react-apollo';
import CssBaseline from '@material-ui/core/CssBaseline';
import classNames from 'classnames'
import Intercom from 'react-intercom';

import V0MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { customizeTheme } from '../lib/modules/utils/theme';
import { withStyles, withTheme } from '@material-ui/core/styles';
import getHeaderSubtitleData from '../lib/modules/utils/getHeaderSubtitleData';

const intercomAppId = getSetting('intercomAppId', 'wtb8z7sj');

const styles = theme => ({
  main: {
    margin: '64px auto 15px auto',
    maxWidth: 1200,
    [theme.breakpoints.down('sm')]: {
      marginTop: 20,
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
  }
})

const Layout = ({currentUser, children, currentRoute, location, params, client, classes, theme}, { userAgent }) => {

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
        return<div id="intercome-outer-frame">
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
    const { subtitleText = "" } = getHeaderSubtitleData(routeName, query, params, client) || {}
    const siteName = getSetting('forumSettings.tabTitle', 'LessWrong 2.0');
    const title = subtitleText ? `${subtitleText} - ${siteName}` : siteName;

    return <div className={classNames("wrapper", {'alignment-forum': getSetting('AlignmentForum', false)}) } id="wrapper">
      <V0MuiThemeProvider muiTheme={customizeTheme(currentRoute, userAgent, params, client.store)}>
        <div>
          <CssBaseline />
          <Helmet>
            <title>{title}</title>
            <link name="material-icons" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
            <link name="react-instantsearch" rel="stylesheet" type="text/css" href="https://unpkg.com/react-instantsearch-theme-algolia@4.0.0/style.min.css"/>
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
          <Components.Header {...this.props}/>

          <div className={classes.main}>
            <Components.ErrorBoundary>
              <Components.FlashMessages />
            </Components.ErrorBoundary>
            {children}
            <Components.ErrorBoundary>
              <Components.SunshineSidebar />
            </Components.ErrorBoundary>
          </div>
          {/* <Components.Footer />  Deactivated Footer, since we don't use one. Might want to add one later*/ }
        </div>
      </V0MuiThemeProvider>
    </div>
}

Layout.contextTypes = {
  userAgent: PropTypes.string,
}

Layout.displayName = "Layout";

replaceComponent('Layout', Layout, withRouter, withApollo, withStyles(styles), withTheme());
