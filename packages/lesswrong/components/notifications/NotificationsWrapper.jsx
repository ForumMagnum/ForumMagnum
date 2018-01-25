/*

The Navigation for the Inbox components

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {DropdownButton, MenuItem } from 'react-bootstrap';
import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';

class NotificationsWrapper extends Component {



  constructor(props) {
    super(props);
    this.state = {notificationsFilter: ""};
  }

  render() {

    const views = ["newPost", "newPendingPost", "postApproved", "newComment", "newReply", "newUser"];

    const terms = {view: 'userNotifications', userId: (!!this.props.currentUser ? this.props.currentUser._id : "0"), type: this.state.notificationsFilter};

    return (

      <div className="notification-filters">
        <DropdownButton
          bsStyle="default"
          className="views btn-secondary"
          id="views-dropdown"
          title="Notification Filters"
        >
          <MenuItem onClick={() => this.setState({notificationsFilter: ""})}>All Notifications</MenuItem>
          {views.map(view =>
            <MenuItem key={view} onClick={() => this.setState({notificationsFilter: view})}>{view}</MenuItem>
          )}
        </DropdownButton>
        <Components.NotificationsFullscreenList terms={terms} />
      </div>

    )
  }
}

registerComponent('NotificationsWrapper', NotificationsWrapper, withCurrentUser);
