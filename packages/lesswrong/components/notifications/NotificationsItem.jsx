import { Components, registerComponent } from 'meteor/vulcan:core';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import {ListItem} from 'material-ui/List';
import { Link } from 'react-router';
import AllIcon from '@material-ui/icons/Notifications';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import MessagesIcon from '@material-ui/icons/Forum';

const styles = theme => ({
  root: {
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.02) !important",
    },
    "&.read:hover": {
      backgroundColor: "rgba(0,0,0,0.08) !important",
    }
  },
});

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
    const { classes, notification, lastNotificationsCheck } = this.props;

    return (
      <ListItem
        containerElement={<Link to={notification.link} />}
        className={classNames(classes.root, {read: notification.createdAt < lastNotificationsCheck || this.state.clicked})}
        onClick={() => this.setState({clicked: true})}
        secondaryText={notification.message}
        secondaryTextLines={2}
        leftIcon={this.renderNotificationIcon(notification.type)}
        style={{backgroundColor: (notification.createdAt < lastNotificationsCheck || this.state.clicked) ? 'rgba(0,0,0,0.04)' : 'inherit', fontFamily: "freight-sans-pro, sans-serif", fontSize: "1rem", lineHeight: "1.4rem"}}
      />
    )
  }

}

registerComponent('NotificationsItem', NotificationsItem, withStyles(styles, {name: "NotificationsItem"}));
