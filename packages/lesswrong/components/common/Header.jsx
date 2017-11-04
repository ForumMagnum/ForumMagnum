import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Components, replaceComponent } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import { Link } from 'react-router';
import NoSSR from 'react-no-ssr';

import muiThemeable from 'material-ui/styles/muiThemeable';
import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';

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
      open: false,
    };
  }

  handleToggle = () => this.setState({open: !this.state.open});

  handleClose = () => this.setState({open: false});

  renderAppBarElementRight = () => {
  const notificationTerms = {view: 'userNotifications', userId: (!!this.props.currentUser ? this.props.currentUser._id : "0")};
  return <div>
    <NoSSR><Components.SearchBar /></NoSSR>
    {this.props.currentUser ? <Components.NotificationsMenu title="Notifications" terms={notificationTerms}/> : null}
    {this.props.currentUser ? <Components.UsersMenu /> : <Components.UsersAccountMenu />}
  </div>}

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
    const header = this.props.muiTheme.palette.header

    appBarStyle.backgroundColor = header ? header : "#F0F4F7"

    return (
      <div className="header-wrapper">
        <header className="header">
          <AppBar
            onLeftIconButtonTouchTap={this.handleToggle}
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
          <Drawer docked={false}
            width={200}
            open={this.state.open}
            onRequestChange={(open) => this.setState({open})}
          containerClassName="menu-drawer" >

            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/"}/>}> HOME </MenuItem>
            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/rationality"}/>}> RATIONALITY: A-Z </MenuItem>
            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/codex"}/>}> THE CODEX </MenuItem>
            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/hpmor"}/>}> HPMOR </MenuItem>
            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/daily"}/>}> ALL POSTS </MenuItem>
            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/meta"}/>}> META </MenuItem>
            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/posts/ANDbEKqbdDuBCQAnM/about-lesswrong-2-0"}/>}> ABOUT </MenuItem>

          {/*<MenuItem containerElement={<Link to={"/library"}/>}> THE LIBRARY </MenuItem>*/}
        </Drawer>

        </header>
      </div>
    )
  }

}

Header.displayName = "Header";

Header.propTypes = {
  currentUser: PropTypes.object,
};

replaceComponent('Header', Header, withRouter, withApollo, muiThemeable());
