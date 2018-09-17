import { Components } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem';
import { LinkContainer } from 'react-router-bootstrap';
import defineComponent from '../../lib/defineComponent';


class NotificationsFullscreenItem extends Component {
  render() {
    const notification = this.props.notification;
    // className = "notification-FS-item " + (notification.viewed ? "viewed" : "unviewed");
    return (
      <LinkContainer to={notification.link ? notification.link : "/"}>
        <ListGroupItem>
            {notification.message + ": (" + notification.type + ")"}
        </ListGroupItem>
      </LinkContainer>
    )
  }

}

export default defineComponent({
  name: 'NotificationsFullscreenItem',
  component: NotificationsFullscreenItem
});
