import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Notifications from '../../lib/collections/notifications/collection.js';
import Badge from '@material-ui/core/Badge';
import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import IconButton from 'material-ui/IconButton';
import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';

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
    right: "1px",
    top: "1px",
    pointerEvents: "none",
  }
});

const NotificationsMenuButton = (props) => {
  let { classes, currentUser, results, open, color, toggle } = props;
  let filteredResults = [];
  if (currentUser) {
    filteredResults = results && _.filter(results,
      (x) => !currentUser.lastNotificationsCheck || x.createdAt > currentUser.lastNotificationsCheck
    );
  }


  const notificationButtonStyle = {
    backgroundColor: open ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)"
  }
  const notificationIconStyle = {
    color: open ? "#FFFFFF" : (color || "rgba(0,0,0,0.6)"),
  }

  return (
    <Badge
      classes={{ root: classes.badgeContainer, badge: classes.badge }}
      badgeContent={(filteredResults && filteredResults.length) || ""}
    >
      <IconButton className="notifications-menu-button" onClick={toggle} style={notificationButtonStyle} iconStyle={ notificationIconStyle }>
        {filteredResults && filteredResults.length ? <NotificationsIcon /> : <NotificationsNoneIcon />}
      </IconButton>
    </Badge>
  )
}

const options = {
  collection: Notifications,
  queryName: 'notificationsListQuery',
  fragmentName: 'NotificationsList',
  pollInterval: 0,
  limit: 20,
  totalResolver: false,
  fetchPolicy: 'cache-and-network'
};

registerComponent('NotificationsMenuButton', NotificationsMenuButton, [withList, options], withUser, withStyles(styles, { name: "NotificationsMenuButton" }))
