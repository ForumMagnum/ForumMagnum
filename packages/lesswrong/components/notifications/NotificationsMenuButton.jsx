import React from 'react';
import Notifications from '../../lib/collections/notifications/collection.js';
import Badge from '@material-ui/core/Badge';
import { registerComponent, withList } from 'meteor/vulcan:core';
import IconButton from '@material-ui/core/IconButton';
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
  },
  buttonOpen: {
    backgroundColor: "rgba(0,0,0,0.4)"
  },
  buttonClosed: {
    backgroundColor: "rgba(0,0,0,0)"
  },
});

const NotificationsMenuButton = (props) => {
  let { classes, currentUser, results, open, color, toggle } = props;
  let filteredResults = [];
  if (currentUser) {
    filteredResults = results && _.filter(results,
      (x) => !currentUser.lastNotificationsCheck || x.createdAt > currentUser.lastNotificationsCheck
    );
  }


  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;
  const notificationIconStyle = {
    color: open ? "#FFFFFF" : (color || "rgba(0,0,0,0.6)"),
  }

  return (
    <Badge
      classes={{ root: classes.badgeContainer, badge: classes.badge }}
      badgeContent={(filteredResults && filteredResults.length) || ""}
    >
      <IconButton
          classes={{ root: buttonClass }}
          onClick={toggle}
          style={ notificationIconStyle }
      >
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
  enableTotal: false,
  fetchPolicy: 'cache-and-network',
  ssr: true,
};

registerComponent('NotificationsMenuButton', NotificationsMenuButton, [withList, options], withUser, withStyles(styles, { name: "NotificationsMenuButton" }))
