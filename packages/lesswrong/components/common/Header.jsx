import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, replaceComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import { Link } from 'react-router';
import NoSSR from 'react-no-ssr';
import Headroom from 'react-headroom'

import muiThemeable from 'material-ui/styles/muiThemeable';
import AppBar from 'material-ui/AppBar';
import IconButton from 'material-ui/IconButton';
import NotificationsIcon from 'material-ui/svg-icons/social/notifications-none';

import { withApollo } from 'react-apollo';
import { Posts } from 'meteor/example-forum';
import Sequences from '../../lib/collections/sequences/collection'
import Users from 'meteor/vulcan:users';

const appBarStyle = {
  boxShadow: "0 1px 1px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.05)",
  paddingRight: "0px",
}

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      navigationOpen: false,
      notificationOpen: false,
    };
  }

  handleNavigationToggle = (state) => this.setState({navigationOpen: !this.state.navigationOpen});
  handleNavigationClose = () => this.setState({navigationOpen: false});

  handleNotificationToggle = (state) => {
    this.props.editMutation({
      documentId: this.props.currentUser._id,
      set: {lastNotificationsCheck: new Date()},
      unset: {}
    }) // TODO: Check whether this is being opened or closed to work nicely with material-ui toggle calls
    this.setState({notificationOpen: !this.state.notificationOpen});
  }
  handleNotificationClose = () => this.setState({notificationOpen: false});

  renderAppBarElementRight = () => {
    const notificationButtonStyle = {
      backgroundColor: this.state.notificationOpen ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)"
    }
    const notificationIconStyle = {
      color: this.state.notificationOpen ? "#FFFFFF" : "rgba(0,0,0,0.8)",
    }

    return <div className="appbar-elements-right">
      <NoSSR><Components.SearchBar /></NoSSR>
      {this.props.currentUser ? <Components.UsersMenu /> : <Components.UsersAccountMenu />}
      {this.props.currentUser &&
        <IconButton className="notifications-menu-button" onTouchTap={this.handleNotificationToggle} style={notificationButtonStyle} iconStyle={ notificationIconStyle }>
          <NotificationsIcon />
        </IconButton>}
    </div>
  }

  profileSubtitle = (userSlug) => {
    const user = Users.findInStore(this.props.client.store, {slug:userSlug}).fetch()[0]
    if (user && (user.displayName || user.slug)) {
      return (
        <Link className="header-site-subtitle" to={ Users.getProfileUrl(user) }>
          { user.displayName || user.slug }
        </Link>
      )
    }
  }

  userPostSubtitle = (postId) => {
    const post = Posts.findOneInStore(this.props.client.store, postId)
    if (post && (post.frontpage || post.meta)) {
      return null
    } else if (post && post.userId) {
      const user = Users.findOneInStore(this.props.client.store, post.userId)
      if (user) {
        return <Link className="header-site-subtitle" to={ Users.getProfileUrl(user) }>{ user.displayName }</Link>
      }
    }
  }

  rationalitySubtitle = () => {
    return <Link className="header-site-subtitle" to={ "/rationality" }>
              Rationality: A-Z
           </Link>
  }

  hpmorSubtitle = () => {
    return <Link className="header-site-subtitle" to={ "/hpmor" }>
              HPMoR
           </Link>
  }

  codexSubtitle = () => {
    return <Link className="header-site-subtitle" to={ "/codex" }>
      SlateStarCodex
           </Link>
  }

  metaSubtitle = () => {
    return <Link className="header-site-subtitle" to={ "/meta" }>
              Meta
           </Link>
  }

  sequenceSubtitle = (sequenceId) => {
    if (this.props.client.store && sequenceId) {
      const sequence = Sequences.findOneInStore(this.props.client.store, sequenceId)
      if (sequence && sequence.canonicalCollectionSlug == "rationality") {
        return this.rationalitySubtitle()
      } else if (sequence && sequence.canonicalCollectionSlug == "hpmor") {
        return this.hpmorSubtitle()
      } else if (sequence && sequence.canonicalCollectionSlug == "codex") {
        return this.codexSubtitle()
      }
    }
  }

  getSubtitle = () => {
    const routeName = this.props.routes[1].name
    if (routeName == "users.single") {
      return this.profileSubtitle(this.props.params.slug)
    } else if (routeName == "posts.single") {
      return this.userPostSubtitle(this.props.params._id)
    } else if (routeName == "sequences.single") {
      return this.sequenceSubtitle(this.props.params._id)
    } else if (routeName == "Rationality.posts.single" || routeName == "Rationality") {
      return this.rationalitySubtitle()
    } else if (routeName == "HPMOR.posts.single" || routeName == "HPMOR") {
      return this.hpmorSubtitle()
    } else if (routeName == "Codex.posts.single" || routeName == "Codex") {
      return this.codexSubtitle()
    } else if (routeName == "Meta") {
      return this.metaSubtitle()
    }
  }

  render() {
    //TODO: Improve the aesthetics of the menu bar. Add something at the top to have some reasonable spacing.
    const siteSection = this.getSubtitle()
    const notificationTerms = {view: 'userNotifications', userId: (!!this.props.currentUser ? this.props.currentUser._id : "0")};
    const header = this.props.muiTheme.palette.header

    appBarStyle.backgroundColor = header ? header : "#F0F4F7"

    return (
      <Headroom disableInlineStyles downTolerance={10} upTolerance={10} >
        <div className="header-wrapper" style={{height: "64px"}}>
          <header className="header">
            <AppBar
              onLeftIconButtonTouchTap={this.handleNavigationToggle}
              iconElementRight = {this.renderAppBarElementRight()}
              style={appBarStyle}
            >
              <div className="header-title">
                <Link to="/">
                  <span className="min-small">LESSWRONG</span>
                  <span className="max-small">LW</span>
                </Link>
                <span className="min-small">{ siteSection}</span>
              </div>
            </AppBar>
            <Components.NavigationMenu open={this.state.navigationOpen} handleClose={this.handleNavigationClose} handleToggle={this.handleNavigationToggle}/>
            <Components.NotificationsMenu open={this.state.notificationOpen} terms={notificationTerms} handleToggle={this.handleNotificationToggle} />
          </header>
        </div>
      </Headroom>
    )
  }

}

Header.displayName = "Header";

Header.propTypes = {
  currentUser: PropTypes.object,
};

const withEditOptions = {
  collection: Users,
  fragmentName: 'UsersCurrent',
};

replaceComponent('Header', Header, withRouter, withApollo, [withEdit, withEditOptions], withCurrentUser, muiThemeable());
