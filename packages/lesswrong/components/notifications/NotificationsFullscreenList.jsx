import React, { PropTypes, Component } from 'react';
import { ListGroup, ListGroupItem } from 'react-bootstrap';
import { Components, registerComponent, withList, withCurrentUser } from 'meteor/vulcan:core';
import Notifications from '../../lib/collections/notifications/collection.js';

class NotificationsFullscreenList extends Component {

  render() {

    const results = this.props.results;
    const loadMore = this.props.loadMore;
    const totalCount = this.props.totalCount;

    if (results && results.length) {
      return (
        <ListGroup>
          {results.map(notification => {
            return <Components.NotificationsFullscreenItem key={notification._id} notification={notification} />
          })}
          {(results.length < totalCount) ? <ListGroupItem  onClick={() => loadMore()}> Load More </ListGroupItem> : <ListGroupItem>All Notifications loaded</ListGroupItem>}
        </ListGroup>
      )
    } else {
      return <Components.Loading />
    }
  }
}

const options = {
  collection: Notifications,
  queryName: 'notificationsFullScreenQuery',
  fragmentName: 'NotificationsList',
  limit: 30,
  totalResolver: false,
};

registerComponent('NotificationsFullscreenList', NotificationsFullscreenList, [withList, options], withCurrentUser);
