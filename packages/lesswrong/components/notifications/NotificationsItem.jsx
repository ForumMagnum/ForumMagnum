import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import {ListItem} from 'material-ui/List';
import { Link } from 'react-router';



class NotificationsItem extends Component {
  constructor(props) {
    super(props)
    this.state = {
      clicked: false,
    }
  }
  render() {
    const notification = this.props.notification;
    const lastNotificationsCheck = this.props.lastNotificationsCheck;

    return (
      <ListItem
        containerElement={<Link to={notification.link} />}
        onTouchTap={() => this.setState({clicked: true})}
        key={notification._id}
        primaryText={notification.message}
        currentUser={this.props.currentUser}
        style={{backgroundColor: (notification.createdAt < lastNotificationsCheck || this.state.clicked) ? 'rgba(0,0,0,0.04)' : 'inherit', fontFamily: "freight-sans-pro, sans-serif", fontSize: "1.1rem", lineHeight: "1.5rem"}}
      />
    )
  }

}

registerComponent('NotificationsItem', NotificationsItem);
