import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import { Link } from 'react-router';
import NoSSR from 'react-no-ssr';
import Headroom from 'react-headroom'

import muiThemeable from 'material-ui/styles/muiThemeable';
import AppBar from 'material-ui/AppBar';

import { withApollo } from 'react-apollo';
import { Posts } from 'meteor/example-forum';
import Sequences from '../../lib/collections/sequences/collection'
import Users from 'meteor/vulcan:users';

const appBarStyle = {
  boxShadow: "0 1px 1px rgba(0, 0, 0, 0.05), 0 1px 1px rgba(0, 0, 0, 0.05)",
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
    return <div className="appbar-elements-right">
      <NoSSR><Components.SearchBar /></NoSSR>
      {this.props.currentUser ? <Components.UsersMenu /> : <Components.UsersAccountMenu />}
      {this.props.currentUser && <Components.NotificationsMenuButton toggle={this.handleNotificationToggle} terms={{view: 'userNotifications', userId: this.props.currentUser._id}} open={this.state.notificationOpen}/>}
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
    if (post && post.af) {
      return this.alignmentSubtitle()
    } else if (post && post.frontpageDate) {
      return null
    } else if (post && post.meta) {
      return this.metaSubtitle()
    } else if (post && post.userId) {
      const user = Users.findOneInStore(this.props.client.store, post.userId)
      if (user) {
        return <Link className="header-site-subtitle" to={ Users.getProfileUrl(user) }>{ user.displayName }</Link>
      }
    }
  }

  rationalitySubtitle = () => {
    return <Link className="header-site-subtitle" to="/rationality">
              Rationality: A-Z
           </Link>
  }

  hpmorSubtitle = () => {
    return <Link className="header-site-subtitle" to="/hpmor">
              HPMoR
           </Link>
  }

  codexSubtitle = () => {
    return <Link className="header-site-subtitle" to="/codex">
      SlateStarCodex
           </Link>
  }

  metaSubtitle = () => {
    return <Link className="header-site-subtitle" to="/meta">
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

  communitySubtitle = () => {
    return <Link className="header-site-subtitle" to="/community">
              Community
           </Link>
  }

  alignmentSubtitle = () => {
    return <Link className="header-site-subtitle" to="/alignment">
              AGI Alignment
           </Link>
  }

  getSubtitle = () => {
    const routeName = this.props.routes[1].name

    const query = this.props.location &&
                  this.props.location.query

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
    } else if (routeName == "CommunityHome") {
      return this.communitySubtitle()
    } else if (routeName == "Localgroups.single") {
      return this.communitySubtitle()
    } else if (routeName == "events.single") {
      return this.communitySubtitle()
    } else if (routeName == "groups.post") {
      return this.communitySubtitle()
    } else if ((routeName == "alignment.forum") || (query && query.af)) {
      return this.alignmentSubtitle()
    }
  }

  render() {
    const siteSection = this.getSubtitle()
    const currentUser = this.props.currentUser;
    const notificationTerms = {view: 'userNotifications', userId: currentUser ? currentUser._id : "", type: "newMessage"};
    const header = this.props.muiTheme.palette.header

    appBarStyle.backgroundColor = header ? header : "#fff"

    return (
      <div>
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
            </header>
          </div>
        </Headroom>
        <Components.NotificationsMenu open={this.state.notificationOpen} terms={notificationTerms} handleToggle={this.handleNotificationToggle} />
      </div>

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

registerComponent('Header', Header, withRouter, withApollo, [withEdit, withEditOptions], withCurrentUser, muiThemeable());
