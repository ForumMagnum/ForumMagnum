import { registerComponent } from 'meteor/vulcan:core';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import ListItem from '@material-ui/core/ListItem';
import { Link } from '../../lib/reactRouterWrapper.js';
import { getNotificationTypeByName } from '../../lib/notificationTypes.jsx';
import { getUrlClass } from '../../lib/routeUtil';

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

class NotificationsItem extends Component {
  constructor(props) {
    super(props)
    this.state = {
      clicked: false,
    }
  }

  render() {
    const { classes, notification, lastNotificationsCheck } = this.props;
    const UrlClass = getUrlClass()

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
        onClick={() => {
          this.setState({clicked: true})
          // we also check whether it's a relative link, and if so, scroll to the item
          const url = new UrlClass(notification.link)
          const hash = url.hash
          if (hash) {
            const element = document.getElementById(hash.substr(1))
            if (element) element.scrollIntoView({behavior: "smooth"});
          }
        }}
      >
        {getNotificationTypeByName(notification.type).getIcon()}
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
