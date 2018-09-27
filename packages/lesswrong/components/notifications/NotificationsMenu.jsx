import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Drawer from 'material-ui/Drawer';
import Badge from '@material-ui/core/Badge';
import {Tabs, Tab} from 'material-ui/Tabs';
import AllIcon from '@material-ui/icons/Notifications';
import ClearIcon from '@material-ui/icons/Clear';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import MessagesIcon from '@material-ui/icons/Forum';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import classNames from 'classnames';

// import { NavDropdown, MenuItem } from 'react-bootstrap';
import Notifications from '../../lib/collections/notifications/collection.js'

const tabLabelStyle = {
  color: "rgba(0,0,0,0.8)",
  fontFamily: "freight-sans-pro, sans-serif"
}

const styles = theme => ({
  badgeContainer: {
    padding: "none",
    fontFamily: 'freight-sans-pro, sans-serif',
    verticalAlign: "inherit",
  },
  badge: {
    backgroundColor: 'inherit',
    color: 'rgba(0,0,0,0.6)',
    fontFamily: 'freight-sans-pro, sans-serif',
    fontSize: "12px",
    fontWeight: 500,
    right: "-15px",
    top: 0,
    pointerEvents: "none",
  },
  menuContainer: {
    height: "100vh",
    boxShadow: "none",
    transition: "transform 200ms cubic-bezier(0.23, 1, 0.32, 1) 0ms",
    
    // !important because material-UI defines an (incorrect)
    // overflow
    overflowX: "hidden !important"
  },
  icon: {
    color: "rgba(0,0,0,0.8)",
  },
  cancel: {
    color: "rgba(0,0,0,0.3)",
    margin: "10px",
    cursor: "pointer"
  }
});

class NotificationsMenu extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      notificationTerms: {view: 'userNotifications'},
      lastNotificationsCheck: (props.currentUser && props.currentUser.lastNotificationsCheck) || ""
    }
  }

  render() {
      const { classes, currentUser, results, open, handleToggle, hasOpened } = this.props;
      const newMessages = results && _.filter(results, (x) => x.createdAt > this.state.lastNotificationsCheck);
      if (!currentUser) {
        return null;
      } else {
        const AllNotificationTerms = {view: 'userNotifications'};
        const PostsNotificationTerms = {view: 'userNotifications', type: "newPost"};
        const CommentsNotificationTerms = {view: 'userNotifications', type: "newComment"};
        const MessagesNotificationTerms = {view: 'userNotifications', type: "newMessage"};
        return (
          <div className="notifications-menu">
            <Components.ErrorBoundary>
              <Drawer
                open={open}
                width={270}
                containerClassName={classNames("notifications-menu-container", classes.menuContainer)}
                openSecondary={true}
                onRequestChange={handleToggle}
              >
                { hasOpened && <div className="notifications-menu-content">
                  <Tabs>
                    <Tab
                      icon={<span title="All Notifications"><AllIcon classes={{root: classes.icon}}/></span>}
                      style={tabLabelStyle}
                      onActive={() => this.setState({notificationTerms: AllNotificationTerms})}
                    />
                    <Tab
                      icon={<span title="New Posts"><PostsIcon classes={{root: classes.icon}}/></span>}
                      style={tabLabelStyle}
                      onActive={() => this.setState({notificationTerms: PostsNotificationTerms})}
                    />
                    <Tab
                      icon={<span title="New Comments"><CommentsIcon classes={{root: classes.icon}} /></span>}
                      style={tabLabelStyle}
                      onActive={() => this.setState({notificationTerms: CommentsNotificationTerms})}
                    />
                    <Tab
                      icon={<span title="New Messages">
                        <Badge
                          classes={{ root: classes.badgeContainer, badge: classes.badge }}
                          badgeContent={(newMessages && newMessages.length) || ""}
                        >
                          <MessagesIcon classes={{root: classes.icon}} />
                        </Badge>
                      </span>}
                      style={tabLabelStyle}
                      onActive={() => this.setState({notificationTerms: MessagesNotificationTerms})}
                    />
                    <Tab className="notifications-menu-hidden-tab"/>
                  </Tabs>
                  <ClearIcon className={classNames("notifications-hide-button", classes.cancel)} onClick={handleToggle} />
                  <Components.NotificationsList terms={{...this.state.notificationTerms, userId: currentUser._id}} />
                </div>}
              </Drawer>
            </Components.ErrorBoundary>
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


registerComponent('NotificationsMenu', NotificationsMenu, withUser, [withList, options], withStyles(styles, { name: "NotificationsMenu" }));
