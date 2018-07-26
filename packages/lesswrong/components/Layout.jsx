import { Components, replaceComponent, getSetting } from 'meteor/vulcan:core';
// import { InstantSearch} from 'react-instantsearch/dom';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { withApollo } from 'react-apollo';
import CssBaseline from '@material-ui/core/CssBaseline';
import classNames from 'classnames'
import Intercom from 'react-intercom';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import V0MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { customizeTheme } from '../lib/modules/utils/theme';
import Typekit from 'react-typekit';
import { withStyles } from '@material-ui/core/styles';

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
  }
})

const Layout = ({currentUser, children, currentRoute, params, client, classes}, { userAgent }) => {

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

    return <div className={classNames("wrapper", "tk-warnock-pro", {'alignment-forum': getSetting('AlignmentForum', false)}) } id="wrapper">
      <V0MuiThemeProvider muiTheme={customizeTheme(currentRoute, userAgent, params, client.store)}>
        <div>
          <CssBaseline />
          <Helmet>
            <title>{getSetting('forumSettings.tabTitle', 'LessWrong 2.0')}</title>
            <link name="material-icons" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
            <link name="react-instantsearch" rel="stylesheet" type="text/css" href="https://unpkg.com/react-instantsearch-theme-algolia@4.0.0/style.min.css"/>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500"/>
            <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
          </Helmet>
          <Typekit kitId="jvr1gjm" />
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

replaceComponent('Layout', Layout, withApollo, withStyles(styles));
