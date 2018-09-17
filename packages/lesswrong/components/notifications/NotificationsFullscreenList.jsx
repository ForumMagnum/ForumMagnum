import React, { Component } from 'react';
import PropTypes from 'prop-types'
import ListGroup from 'react-bootstrap/lib/ListGroup';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem';
import { Components, withList, withCurrentUser } from 'meteor/vulcan:core';
import Notifications from '../../lib/collections/notifications/collection.js';
import defineComponent from '../../lib/defineComponent';

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

export default defineComponent({
  name: 'NotificationsFullscreenList',
  component: NotificationsFullscreenList,
  hocs: [ [withList, options], withCurrentUser ]
});
