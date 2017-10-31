import { Components, replaceComponent} from 'meteor/vulcan:core';
// import { InstantSearch} from 'react-instantsearch/dom';
import React, { PropTypes, Component } from 'react';
import Helmet from 'react-helmet';
import { withApollo } from 'react-apollo';

import Intercom, { IntercomAPI } from 'react-intercom';

import injectTapEventPlugin from 'react-tap-event-plugin';
injectTapEventPlugin();

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { customizeTheme } from '../lib/modules/utils/theme';
import Typekit from 'react-typekit';


const Layout = ({currentUser, children, currentRoute, params, client}, { userAgent }) => {

    const showIntercom = currentUser => {
      if (currentUser && !currentUser.hideIntercom) {
        return <div id="intercome-outer-frame"><Intercom appID="wtb8z7sj"
          user_id={currentUser._id}
          email={currentUser.email}
          name={currentUser.displayName}/></div>
      } else if (!currentUser) {
        return<div id="intercome-outer-frame"><Intercom appID="wtb8z7sj"/></div>
      } else {
        return null
      }
    }

    return <div className="wrapper tk-warnock-pro" id="wrapper">
      <MuiThemeProvider muiTheme={customizeTheme(currentRoute, userAgent, params, client.store)}>
        <div>
          <Helmet>
            <title>LessWrong 2.0</title>
            {/* <link name="bootstrap" rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.5/css/bootstrap.min.css"/> */}
            {/* <link name="font-awesome" rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"/> */}
            <link name="material-icons" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
            <link name="react-instantsearch" rel="stylesheet" type="text/css" href="https://unpkg.com/react-instantsearch-theme-algolia@4.0.0/style.min.css"/>
            <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>
            {/* <link name="cardo-font" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Cardo:400,400i,700" />*/}
          </Helmet>
          <Typekit kitId="gus4xlc" />
          {/* Deactivating this component for now, since it's been causing a good amount of bugs. TODO: Fix this properly */}
          {/* {currentUser ? <Components.UsersProfileCheck currentUser={currentUser} documentId={currentUser._id} /> : null} */}

          {/* Sign up user for Intercom, if they do not yet have an account */}
          {showIntercom(currentUser)}

          <Components.Header {...this.props}/>

          <div className="main">
            <Components.FlashMessages />
            {children}
          </div>

          {/* <Components.Footer />  Deactivated Footer, since we don't use one. Might want to add one later*/ }
        </div>
      </MuiThemeProvider>
    </div>
}

Layout.contextTypes = {
  userAgent: PropTypes.string,
}

Layout.displayName = "Layout";

replaceComponent('Layout', Layout, withApollo);
