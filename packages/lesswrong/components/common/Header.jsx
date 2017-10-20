import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withCurrentUser, Components, replaceComponent } from 'meteor/vulcan:core';
import { withRouter } from 'react-router';
import { Link } from 'react-router';
import NoSSR from 'react-no-ssr';

import AppBar from 'material-ui/AppBar';
import Drawer from 'material-ui/Drawer';
import MenuItem from 'material-ui/MenuItem';

import { withApollo } from 'react-apollo';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';

const appBarStyle = {
  boxShadow: "none",
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

  renderHeaderSection_UserProfile = (userSlug) => {
    const user = Users.findInStore(this.props.client.store, {slug:userSlug}).fetch()[0]
    console.log(user)
    if (user && (user.displayName || user.slug)) {
      return (
        <Link className="header-site-section user" to={ Users.getProfileUrl(user) }>
          { user.displayName || user.slug }
        </Link>
      )
    }
  }

  renderHeaderSection_UserPost = (postId) => {
    const post = Posts.findOneInStore(this.props.client.store, postId)
    if (post && post.frontpage) {
    } else if (post && post.userId) {
      const user = Users.findOneInStore(this.props.client.store, post.userId)
      if (user) {
        return <Link className="header-site-section user" to={ Users.getProfileUrl(user) }>{ user.displayName }</Link>
      }
    }
  }

  getSiteSection = () => {
    const routeName = this.props.routes[1].name
    if (routeName == "users.single") {
      return this.renderHeaderSection_UserProfile(this.props.params.slug)
    } else if (routeName == "posts.single") {
      return this.renderHeaderSection_UserPost(this.props.params._id)
    }
  }

  getHeaderBackgroundColor = (section) => section ? "#D5DFE5" : "#eee"

  render() {
    //TODO: Improve the aesthetics of the menu bar. Add something at the top to have some reasonable spacing.
    const siteSection = this.getSiteSection()

    appBarStyle.backgroundColor = this.getHeaderBackgroundColor(siteSection)

    return (
      <div className="header-wrapper">
        <header className="header">
          <AppBar
            onLeftIconButtonTouchTap={this.handleToggle}
            iconElementRight = {this.renderAppBarElementRight()}
            style={appBarStyle}
          >
            <div className="header-title">
              <Link to="/">LESSWRONG</Link>
              { siteSection}
            </div>
          </AppBar>
          <Drawer docked={false}
            width={200}
            open={this.state.open}
            onRequestChange={(open) => this.setState({open})}
          containerClassName="menu-drawer" >

            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/"}/>}> HOME </MenuItem>
            <MenuItem onTouchTap={this.handleClose} containerElement={<Link to={"/sequences"}/>}> RATIONALITY: A-Z </MenuItem>
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

replaceComponent('Header', Header, withRouter, withApollo);
