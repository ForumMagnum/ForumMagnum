import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Notifications from '../../lib/collections/notifications/collection.js';
import Badge from 'material-ui/Badge';
import { Components, withList, withCurrentUser } from 'meteor/vulcan:core';
import IconButton from 'material-ui/IconButton';
import NotificationsIcon from '@material-ui/icons/Notifications';
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import defineComponent from '../../lib/defineComponent';

const badgeContainerStyle = {
  padding: 'none',
}
const badgeStyle = {
  backgroundColor: 'none',
  color: 'rgba(0,0,0,0.6)',
  fontFamily: 'freight-sans-pro, sans-serif',
  pointerEvents: "none",
}

const NotificationsMenuButton = (props) => {
  let filteredResults = [];
  if (props.currentUser) {
    filteredResults = props.results && _.filter(props.results,
      (x) => !props.currentUser.lastNotificationsCheck || x.createdAt > props.currentUser.lastNotificationsCheck
    );
  }


  const notificationButtonStyle = {
    backgroundColor: props.open ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)"
  }
  const notificationIconStyle = {
    color: props.open ? "#FFFFFF" : (props.color || "rgba(0,0,0,0.6)"),
  }

  return (
    <Badge style={badgeContainerStyle} badgeContent={(filteredResults && filteredResults.length) || ""} primary={true} badgeStyle={badgeStyle}>
      <IconButton className="notifications-menu-button" onClick={props.toggle} style={notificationButtonStyle} iconStyle={ notificationIconStyle }>
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

export default defineComponent({
  name: 'NotificationsMenuButton',
  component: NotificationsMenuButton,
  hocs: [ [withList, options], withCurrentUser ]
});
