import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { List, ListItem } from 'material-ui/List';
import { Components, withList, withEdit } from 'meteor/vulcan:core';
import Notifications from '../../lib/collections/notifications/collection.js';
import defineComponent from '../../lib/defineComponent';
import withUser from '../common/withUser';

class NotificationsList extends Component {

  constructor(props) {
    super(props)
    this.state = {
      lastNotificationsCheck: ((props.currentUser && props.currentUser.lastNotificationsCheck) || ""),
    }
  }

  render() {
    const results = this.props.results;
    const loadMore = this.props.loadMore;
    if (results && results.length) {
      return (
        <List style={{width: '270px', overflowY: 'auto', padding: '0px'}}>
          {results.map(notification => <Components.NotificationsItem notification={notification} lastNotificationsCheck={this.state.lastNotificationsCheck} key={notification._id} />)}
          {results.length >= 20 && <ListItem className="notifications-list-item" onClick={() => loadMore()} primaryText="Load More" style={{textAlign: 'center', fontSize: '14px'}} />}
        </List>
      )
    } else {
      return <div className="notifications-list-empty"> You don{"'"}t have any notifications yet!</div>
    }
  }
}

const options = {
  collection: Notifications,
  queryName: 'notificationsListQuery',
  fragmentName: 'NotificationsList',
  limit: 20,
  totalResolver: false
};

const withEditOptions = {
  collection: Notifications,
  fragmentName: 'NotificationsList',
};

export default defineComponent({
  name: 'NotificationsList',
  component: NotificationsList,
  hocs: [ [withList, options], [withEdit, withEditOptions], withUser ]
});
