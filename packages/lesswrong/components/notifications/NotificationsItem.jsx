import { Components, registerComponent } from 'meteor/vulcan:core';
import classNames from 'classnames';
import React, { Component } from 'react';
import {ListItem} from 'material-ui/List';
import { Link } from 'react-router';
import AllIcon from 'material-ui/svg-icons/social/notifications';
import PostsIcon from 'material-ui/svg-icons/action/description';
import CommentsIcon from 'material-ui/svg-icons/editor/mode-comment';
import MessagesIcon from 'material-ui/svg-icons/communication/forum';

const iconStyles = {
  marginTop: '24px',
  marginLeft: '17px'
}

class NotificationsItem extends Component {
  constructor(props) {
    super(props)
    this.state = {
      clicked: false,
    }
  }

  renderNotificationIcon = (notificationType) => {
    switch (notificationType) {
      case 'newPost':
        return <PostsIcon style={iconStyles}/>
      case 'newComment':
      case 'newReply':
      case 'newReplyToYou':
        return <CommentsIcon style={iconStyles}/>
      case 'newMessage':
        return <MessagesIcon style={iconStyles}/>
      default:
        return <AllIcon style={iconStyles} />
    }
  }

  render() {
    const notification = this.props.notification;
    const lastNotificationsCheck = this.props.lastNotificationsCheck;

    return (
      <ListItem
        containerElement={<Link to={notification.link} />}
        className={classNames('notifications-item', {read: notification.createdAt < lastNotificationsCheck || this.state.clicked})}
        onTouchTap={() => this.setState({clicked: true})}
        secondaryText={notification.message}
        secondaryTextLines={2}
        leftIcon={this.renderNotificationIcon(notification.type)}
        style={{backgroundColor: (notification.createdAt < lastNotificationsCheck || this.state.clicked) ? 'rgba(0,0,0,0.04)' : 'inherit', fontFamily: "freight-sans-pro, sans-serif", fontSize: "1rem", lineHeight: "1.4rem"}}
      />
    )
  }

}

registerComponent('NotificationsItem', NotificationsItem);
