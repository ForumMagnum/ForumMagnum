import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import Notifications from '../../lib/collections/notifications/collection.js';

class NotificationsList extends Component {

  constructor(props) {
    super(props)
    this.state = {
      lastNotificationsCheck: props.currentUser.lastNotificationsCheck,
    }
  }

  render() {
    const results = this.props.results;
    const loadMore = this.props.loadMore;
    if (results && results.length) {
      return (
        <List style={{width: '300px', overflowY: 'auto', padding: '0px'}}>
          {results.map(notification => <Components.NotificationsItem notification={notification} lastNotificationsCheck={this.state.lastNotificationsCheck} />)}
          {results.length >= 20 && <ListItem className="notifications-list-item" onClick={() => loadMore()} primaryText="Load More" style={{textAlign: 'center', fontSize: '14px'}} />}
        </List>
      )
    } else {
      return <div className="notifications-list-empty"> You don't have any notifications yet!</div>
    }
  }
}

const options = {
  collection: Notifications,
  queryName: 'notificationsListQuery',
  fragmentName: 'notificationsNavFragment',
  limit: 20,
  totalResolver: false,
};

const withEditOptions = {
  collection: Notifications,
  fragmentName: 'notificationsNavFragment',
};

registerComponent('NotificationsList', NotificationsList, [withList, options], [withEdit, withEditOptions], withCurrentUser);
