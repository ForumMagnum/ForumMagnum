import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import Badge from '@material-ui/core/Badge';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import AllIcon from '@material-ui/icons/Notifications';
import ClearIcon from '@material-ui/icons/Clear';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import MessagesIcon from '@material-ui/icons/Forum';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import grey from '@material-ui/core/colors/grey';

// import { NavDropdown, MenuItem } from 'react-bootstrap';
import Notifications from '../../lib/collections/notifications/collection.js'

const styles = theme => ({
  root: {
    display: "inline-block",
    verticalAlign: "top",
  },
  drawerPaper: {
    width: 270,
    boxShadow: "rgba(0, 0, 0, 0.16) 0px 3px 10px, rgba(0, 0, 0, 0.23) 0px 3px 10px",
    zIndex: theme.zIndexes.notificationsMenu,
  },
  badgeContainer: {
    padding: "none",
    verticalAlign: "inherit",
  },
  badge: {
    backgroundColor: 'inherit',
    color: 'rgba(0,0,0,0.6)',
    fontSize: "12px",
    fontWeight: 500,
    right: "-15px",
    top: 0,
    pointerEvents: "none",
  },
  icon: {
    color: "rgba(0,0,0,0.8)",
  },
  hideButton: {
    position: "absolute",
    top: 0,
    right: 5,
  },
  cancel: {
    color: "rgba(0,0,0,0.3)",
    margin: "10px",
    cursor: "pointer",
  },
  tabBar: {
    background: grey[100],
  },
  tabLabel: {
    color: "rgba(0,0,0,0.8)",
    minWidth: "auto",
  },
  hiddenTab: {
    pointerEvents: "none",
    minWidth: "auto",
    width: 24,
  },
});

class NotificationsMenu extends Component {
  constructor(props, context) {
    super(props);
    this.state = {
      tab: 0,
      notificationTerms: {view: 'userNotifications'},
      lastNotificationsCheck: (props.currentUser && props.currentUser.lastNotificationsCheck) || ""
    }
  }

  render() {
      const { classes, currentUser, results, open, setIsOpen, hasOpened } = this.props;
      const newMessages = results && _.filter(results, (x) => x.createdAt > this.state.lastNotificationsCheck);
      if (!currentUser) {
        return null;
      } else {
      
        const notificationCategoryTabs = [
          {
            name: "All Notifications",
            icon: () => (<AllIcon classes={{root: classes.icon}}/>),
            terms: {view: "userNotifications"},
          },
          {
            name: "New Posts",
            icon: () => (<PostsIcon classes={{root: classes.icon}}/>),
            terms: {view: 'userNotifications', type: "newPost"},
          },
          {
            name: "New Comments",
            icon: () => (<CommentsIcon classes={{root: classes.icon}}/>),
            terms: {view: 'userNotifications', type: "newComment"},
          },
          {
            name: "New Messages",
            icon: () => (
              <Badge
                classes={{ root: classes.badgeContainer, badge: classes.badge }}
                badgeContent={(newMessages && newMessages.length) || ""}
              >
                <MessagesIcon classes={{root: classes.icon}} />
              </Badge>
            ),
            terms: {view: 'userNotifications', type: "newMessage"},
          }
        ];
      
        return (
          <div className={classes.root}>
            <Components.ErrorBoundary>
              {open && <SwipeableDrawer
                open={open}
                anchor="right"
                onClose={() => setIsOpen(false)}
                onOpen={() => setIsOpen(true)}
                classes={{
                  paper: classes.drawerPaper,
                }}
                variant="persistent"
              >
                { hasOpened && <div className="notifications-menu-content">
                  <Tabs
                    fullWidth={true}
                    value={this.state.tab}
                    className={classes.tabBar}
                    onChange={(event, tabIndex) => {
                      this.setState({
                        tab: tabIndex,
                        notificationTerms: notificationCategoryTabs[tabIndex].terms
                      });
                    }}
                  >
                    {notificationCategoryTabs.map(notificationCategory =>
                      <Tab
                        icon={
                          <span title={notificationCategory.name}>
                            {notificationCategory.icon()}
                          </span>
                        }
                        key={notificationCategory.name}
                        className={classes.tabLabel}
                      />
                    )}
                    
                    {/* Include an extra, hidden tab to reserve space for the
                        close/X button (which hovers over the tabs). */}
                    <Tab className={classes.hiddenTab} />
                  </Tabs>
                  <ClearIcon className={classNames(classes.hideButton, classes.cancel)} onClick={() => setIsOpen(false)} />
                  <Components.NotificationsList terms={{...this.state.notificationTerms, userId: currentUser._id}} />
                </div>}
              </SwipeableDrawer>}
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
  enableTotal: false,
  ssr: true,
};


registerComponent('NotificationsMenu', NotificationsMenu, withErrorBoundary, withUser, [withList, options], withStyles(styles, { name: "NotificationsMenu" }));
