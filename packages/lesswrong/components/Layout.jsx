import { Components, replaceComponent} from 'meteor/vulcan:core';
// import { InstantSearch} from 'react-instantsearch/dom';
import React, { PropTypes, Component } from 'react';
import Helmet from 'react-helmet';
import Intercom, { IntercomAPI } from 'react-intercom';
import injectTapEventPlugin from 'react-tap-event-plugin';
// import withNewEditor from './editor/withNewEditor.jsx';



injectTapEventPlugin() // Set up Tap Event Plugin for Material-UI

const Layout = ({currentUser, children, currentRoute}) =>

  <div className="wrapper" id="wrapper">
    <div>
      <Helmet>
        <title>LessWrong 2.0</title>
        <link name="material-icons" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
        {/* <link name="react-instantsearch" rel="stylesheet" type="text/css" href="https://unpkg.com/react-instantsearch-theme-algolia@4.0.0/style.min.css"/> */}
        <meta httpEquiv="Accept-CH" content="DPR, Viewport-Width, Width"/>

        {/* <link name="cardo-font" rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Cardo:400,400i,700" />*/}
      </Helmet>

      {currentUser ? <Components.UsersProfileCheck currentUser={currentUser} documentId={currentUser._id} /> : null}

      {/* Sign up user for Intercom, if they do not yet have an account */}

      {/* {currentUser ? <Intercom appID="wtb8z7sj"
          user_id={currentUser._id} email={currentUser.email} name={currentUser.displayName}
      /> : <Intercom appID="wtb8z7sj"/>} */}

      {/* {currentUser ? IntercomAPI('update', { "name" : currentUser.displayName, "email" : currentUser.email, "user_id" : currentUser._id, "createdAt" : currentUser.createdAt }) : null} */}

      <Components.Header {...this.props}/>

      <div className="main">

        <Components.FlashMessages />

        {children}

      </div>

      {/* <Components.Footer />  Deactivated Footer, since we don't use one. Might want to add one later*/ }
    </div>
  </div>

Layout.displayName = "Layout";

// replaceComponent('Layout', Layout, withNewEditor);
replaceComponent('Layout', Layout);
