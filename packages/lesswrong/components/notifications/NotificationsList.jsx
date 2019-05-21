import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { Components, registerComponent, withList, withEdit } from 'meteor/vulcan:core';
import Notifications from '../../lib/collections/notifications/collection.js';
import withUser from '../common/withUser';

const styles = theme => ({
  root: {
    width: 270,
    overflowY: "auto",
    padding: 0,
  },
  
  empty: {
    padding: 10
  },
  
  loadMoreButton: {
    fontSize: "14px",
    padding: 0,
  },
  loadMoreLabel: {
    padding: 16,
    textAlign: "center",
    width: "100%",
  },
});

class NotificationsList extends Component {

  constructor(props) {
    super(props)
    this.state = {
      lastNotificationsCheck: ((props.currentUser && props.currentUser.lastNotificationsCheck) || ""),
    }
  }

  render() {
    const { results, loadMore, classes } = this.props;
    if (results && results.length) {
      return (
        <List className={classes.root}>
          {results.map(notification =>
            <Components.NotificationsItem
              notification={notification}
              lastNotificationsCheck={this.state.lastNotificationsCheck}
              key={notification._id}
            />
          )}
          {results.length >= 20 &&
            <ListItem
              button={true}
              className={classes.loadMoreButton}
              onClick={() => loadMore()}
            >
              <div className={classes.loadMoreLabel}>
                Load More
              </div>
            </ListItem>}
        </List>
      )
    } else {
      return <div className={classes.empty}> You don't have any notifications yet!</div>
    }
  }
}

const options = {
  collection: Notifications,
  queryName: 'notificationsListQuery',
  fragmentName: 'NotificationsList',
  limit: 20,
  enableTotal: false
};

const withEditOptions = {
  collection: Notifications,
  fragmentName: 'NotificationsList',
};

registerComponent('NotificationsList', NotificationsList,
  [withList, options], [withEdit, withEditOptions],
  withUser, withStyles(styles, {name: "NotificationsList"}));
