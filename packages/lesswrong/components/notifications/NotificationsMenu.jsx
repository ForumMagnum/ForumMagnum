import { Components, registerComponent, withCurrentUser, withList, withEdit } from 'meteor/vulcan:core';
import Users from "meteor/vulcan:users";
import React, { Component } from 'react';

import Popover from 'material-ui/Popover';
import {List, ListItem} from 'material-ui/List';
import PropTypes from 'prop-types';
import Drawer from 'material-ui/Drawer';
import Badge from 'material-ui/Badge';
import {Tabs, Tab} from 'material-ui/Tabs';
import AllIcon from 'material-ui/svg-icons/social/notifications';
import UnreadIcon from 'material-ui/svg-icons/action/visibility-off';
import PostsIcon from 'material-ui/svg-icons/action/description';
import CommentsIcon from 'material-ui/svg-icons/editor/mode-comment';
import MessagesIcon from 'material-ui/svg-icons/communication/forum';

// import { NavDropdown, MenuItem } from 'react-bootstrap';
import { Link } from 'react-router';
import Notifications from '../../lib/collections/notifications/collection.js'


const badgeContainerStyle = {
  padding: 'none',
}
const badgeStyle = {
  backgroundColor: 'none',
  color: 'rgba(0,0,0,0.6)',
  fontFamily: 'freight-sans-pro, sans-serif',
  right: "-16px"
}

const tabLabelStyle = {
  color: "rgba(0,0,0,0.8)",
  fontFamily: "freight-sans-pro, sans-serif"
}

const iconStyle = {
  color: "rgba(0,0,0,0.8)",
}

class NotificationsMenu extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      notificationTerms: {view: 'userNotifications', userId: props.currentUser ? props.currentUser._id : ""},
      lastNotificationsCheck: props.currentUser ? props.currentUser.lastNotificationsCheck : ""
    }
  }
  render() {
      const newMessages = this.props.results && _.filter(this.props.results, (x) => x.createdAt > this.state.lastNotificationsCheck);
      const currentUser = this.props.currentUser;
      if (!currentUser) {
        return null;
      } else {
        const AllNotificationTerms = {view: 'userNotifications', userId: currentUser._id};
        const PostsNotificationTerms = {view: 'userNotifications', userId: currentUser._id, type: "newPost"};
        const CommentsNotificationTerms = {view: 'userNotifications', userId: currentUser._id, type: "newComment"};
        const MessagesNotificationTerms = {view: 'userNotifications', userId: currentUser._id, type: "newMessage"};
        return (
          <div className="notifications-menu">
            <Drawer
              open={this.props.open}
              width={300}
              containerStyle={{top: "64px", zIndex: "1000", height: "100vh", boxShadow: "none", transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1) 0ms", borderLeft: "1px solid rgba(0,0,0,0.05)"}}
              containerClassName="notifications-menu-container"
              openSecondary={true}
              onRequestChange={this.props.handleToggle}
            >
              <div className="notifications-menu-content">
                <Tabs>
                  <Tab
                    icon={<span title="All Notifications"><AllIcon style={iconStyle}/></span>}
                    style={tabLabelStyle}
                    onActive={() => this.setState({notificationTerms: AllNotificationTerms})}
                  />
                  <Tab
                    icon={<span title="New Posts"><PostsIcon style={iconStyle}/></span>}
                    style={tabLabelStyle}
                    onActive={() => this.setState({notificationTerms: PostsNotificationTerms})}
                  />
                  <Tab
                    icon={<span title="New Comments"><CommentsIcon style={iconStyle} /></span>}
                    style={tabLabelStyle}
                    onActive={() => this.setState({notificationTerms: CommentsNotificationTerms})}
                  />
                  <Tab
                    icon={<span title="New Messages">
                      <Badge style={badgeContainerStyle} badgeContent={(newMessages && newMessages.length) || ""} primary={true} badgeStyle={badgeStyle}>
                        <MessagesIcon style={iconStyle} />
                      </Badge>
                    </span>}
                    style={tabLabelStyle}
                    onActive={() => this.setState({notificationTerms: MessagesNotificationTerms})}
                  />
                </Tabs>
                <Components.NotificationsList terms={this.state.notificationTerms} />
              </div>
            </Drawer>
          </div>
        )
      }
  }
}

NotificationsMenu.propTypes = {
  color: PropTypes.string,
};

NotificationsMenu.defaultProps = {
  color: "rgba(0, 0, 0, 0.6)"
}

const options = {
  collection: Notifications,
  queryName: 'notificationsListQuery',
  fragmentName: 'NotificationsList',
  pollInterval: 0,
  limit: 20,
  totalResolver: false,
};


registerComponent('NotificationsMenu', NotificationsMenu, withCurrentUser, [withList, options]);
