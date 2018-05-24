import { Components, registerComponent, withCurrentUser, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Drawer from 'material-ui/Drawer';
import Badge from 'material-ui/Badge';
import {Tabs, Tab} from 'material-ui/Tabs';
import AllIcon from 'material-ui/svg-icons/social/notifications';
import ClearIcon from 'material-ui/svg-icons/content/clear';
import PostsIcon from 'material-ui/svg-icons/action/description';
import CommentsIcon from 'material-ui/svg-icons/editor/mode-comment';
import MessagesIcon from 'material-ui/svg-icons/communication/forum';

// import { NavDropdown, MenuItem } from 'react-bootstrap';
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

const cancelStyle = {
  color: "rgba(0,0,0,0.3)",
  margin: "10px",
  cursor: "pointer"
}

class NotificationsMenu extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      notificationTerms: {view: 'userNotifications'},
      lastNotificationsCheck: props.currentUser ? props.currentUser.lastNotificationsCheck : ""
    }
  }

  render() {
      const newMessages = this.props.results && _.filter(this.props.results, (x) => x.createdAt > this.state.lastNotificationsCheck);
      const currentUser = this.props.currentUser;
      if (!currentUser) {
        return null;
      } else {
        const AllNotificationTerms = {view: 'userNotifications'};
        const PostsNotificationTerms = {view: 'userNotifications', type: "newPost"};
        const CommentsNotificationTerms = {view: 'userNotifications', type: "newComment"};
        const MessagesNotificationTerms = {view: 'userNotifications', type: "newMessage"};
        return (
          <div className="notifications-menu">
            <Drawer
              open={this.props.open}
              width={270}
              containerStyle={{height: "100vh", boxShadow: "none", transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1) 0ms"}}
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
                  <ClearIcon onTouchTap={this.props.handleToggle} style={cancelStyle} />
                </Tabs>
                <Components.NotificationsList terms={{...this.state.notificationTerms, userId: currentUser._id}} />
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
