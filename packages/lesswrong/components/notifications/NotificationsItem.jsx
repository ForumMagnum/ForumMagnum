import { registerComponent } from 'meteor/vulcan:core';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import ListItem from '@material-ui/core/ListItem';
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
    
    fontFamily: "freight-sans-pro, sans-serif",
    
    display: "block",
    padding: 0,
    
    // Disable MUI's hover-highlight-color animation that conflicts with having
    // a non-default background color and looks glitchy.
    transition: "none",
  },
  read: {
    backgroundColor: "rgba(0,0,0,0.04) !important",
    
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.08) !important",
    },
  },
  unread: {
    backgroundColor: "inherit !important",
  },
  
  notificationLabelWrapper: {
    marginLeft: 0,
    padding: "16px 16px 16px 72px",
    position: "relative",
  },
  notificationLabel: {
    fontSize: "14px",
    lineHeight: "18px",
    color: "rgba(0,0,0, 0.54)",
    
    height: 36,
    margin: "4px 0px 0px",
    
    // Two-line ellipsis hack. Webkit-specific (doesn't work in Firefox),
    // inherited from old-Material-UI (where it also doesn't work in Firefox,
    // the symptom being that the ellipses are missing but the layout is
    // otherwise fine).
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-line-clamp": 2,
    "-webkit-box-orient": "vertical",
  },
});

const iconStyles = {
  position: "absolute",
  marginTop: '24px',
  marginLeft: '21px'
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
        button={true}
        component={Link}
        to={notification.link}
        className={classNames(
          classes.root,
          {
            [classes.read]:     notification.createdAt < lastNotificationsCheck || this.state.clicked,
            [classes.unread]: !(notification.createdAt < lastNotificationsCheck || this.state.clicked)
          }
        )}
        onClick={() => this.setState({clicked: true})}
      >
        {this.renderNotificationIcon(notification.type)}
        <div className={classes.notificationLabelWrapper}>
          <div className={classes.notificationLabel}>
            {notification.message}
          </div>
        </div>
      </ListItem>
    )
  }

}

registerComponent('NotificationsItem', NotificationsItem, withStyles(styles, {name: "NotificationsItem"}));
