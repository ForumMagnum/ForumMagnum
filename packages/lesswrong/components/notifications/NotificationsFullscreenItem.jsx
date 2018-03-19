import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import ListGroupItem from 'react-bootstrap/lib/ListGroupItem';
import { LinkContainer } from 'react-router-bootstrap';



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

registerComponent('NotificationsFullscreenItem', NotificationsFullscreenItem);
