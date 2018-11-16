import { Components, registerComponent, getSetting } from 'meteor/vulcan:core';
// import { InstantSearch} from 'react-instantsearch-dom';
import React, { PureComponent } from 'react';
import { withRouter } from 'react-router';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { withApollo } from 'react-apollo';
import CssBaseline from '@material-ui/core/CssBaseline';
import classNames from 'classnames'
import Intercom from 'react-intercom';
import moment from 'moment-timezone';

import V0MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { customizeTheme } from '../lib/modules/utils/theme';
import { withStyles, withTheme } from '@material-ui/core/styles';
import getHeaderSubtitleData from '../lib/modules/utils/getHeaderSubtitleData';
import { UserContext } from './common/withUser';
import { TimezoneContext } from './common/withTimezone';
import { DialogManager } from './common/withDialog';

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
  }
})

class Layout extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      timezone: null
    };
  }

  componentDidMount() {
    const newTimezone = moment.tz.guess();
    if(this.state.timezone !== newTimezone) {
      this.setState({
        timezone: newTimezone
      });
    }
  }

  render () {
    const {currentUser, children, currentRoute, location, params, client, classes, theme} = this.props;
    const {userAgent} = this.context;

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
      <div className={classNames("wrapper", {'alignment-forum': getSetting('AlignmentForum', false)}) } id="wrapper">
        <V0MuiThemeProvider muiTheme={customizeTheme(currentRoute, userAgent, params, client.store)}>
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
          </DialogManager>
        </V0MuiThemeProvider>
      </div>
      </TimezoneContext.Provider>
      </UserContext.Provider>
    )
  }
}

Layout.contextTypes = {
  userAgent: PropTypes.string,
}

Layout.displayName = "Layout";

registerComponent('Layout', Layout, withRouter, withApollo, withStyles(styles, { name: "Layout" }), withTheme());
