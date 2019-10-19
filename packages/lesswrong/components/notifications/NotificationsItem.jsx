import { registerComponent, Components, parseRoute } from 'meteor/vulcan:core';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import { Link } from '../../lib/reactRouterWrapper.js';
import Card from '@material-ui/core/Card';
import AllIcon from '@material-ui/icons/Notifications';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import MailIcon from '@material-ui/icons/Mail';
import { getUrlClass } from '../../lib/routeUtil';
import withHover from '../common/withHover';
import withErrorBoundary from '../common/withErrorBoundary';
import Sentry from '@sentry/node';
import { parsePath } from '../linkPreview/HoverPreviewLink';

const styles = theme => ({
  root: {
    "&:hover": {
      backgroundColor: "rgba(0,0,0,0.02) !important",
    },
    display: "flex",
    alignItems: "center",
    padding: 0,
    borderBottom: "solid 1px rgba(0,0,0,.1)",

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
  notificationLabel: {
    ...theme.typography.commentStyles,
    ...theme.typography.body2,
    fontSize: "14px",
    lineHeight: "18px",
    paddingRight: theme.spacing.unit*2,
    color: "rgba(0,0,0, 0.54)",
    
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
  margin: 16,
  fontSize: 20,
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
        return <MailIcon style={iconStyles}/>
      default:
        return <AllIcon style={iconStyles} />
    }
  }

  renderPreview = () => {
    const { notification } = this.props
    const { PostsPreviewTooltipSingle, PostsPreviewTooltipSingleWithComment, ConversationPreview } = Components
    switch (notification.documentType) {
      case 'post':
        return <Card><PostsPreviewTooltipSingle postId={notification.documentId} /></Card>
      case 'comment':
        const parsedPostPath = parseRoute({
          location: parsePath(notification.link),
          onError: (pathname) => {
            if (Meteor.isClient) {
              Sentry.captureException(new Error(`Broken link from ${location.pathname} to ${pathname}`));
            }
          }
        });
        return <Card><PostsPreviewTooltipSingleWithComment postId={parsedPostPath?.params?._id} commentId={notification.documentId} /></Card>
      case 'message':
        const parsedConversationPath = parseRoute({
          location: parsePath(notification.link),
          onError: (pathname) => {
            if (Meteor.isClient) {
              Sentry.captureException(new Error(`Broken link from ${location.pathname} to ${pathname}`));
            }
          }
        });
        return <Card>
          <ConversationPreview conversationId={parsedConversationPath?.params?._id} />
        </Card>
      default:
        return null
      // case 'newMessage':
      //   return <MailIcon style={iconStyles}/>
      // default:
      //   return <AllIcon style={iconStyles} />
    }
  }

  render() {
    const { classes, notification, lastNotificationsCheck, hover, anchorEl } = this.props;
    const { LWPopper } = Components
    const UrlClass = getUrlClass()

    return (
      <Link
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
        <LWPopper open={hover} anchorEl={anchorEl} placement="left-start">
          {this.renderPreview()}
        </LWPopper>
        {this.renderNotificationIcon(notification.type)}
        <div className={classes.notificationLabel}>
          {notification.message}
        </div>
      </Link>
    )
  }

}

registerComponent('NotificationsItem', NotificationsItem, withStyles(styles, {name: "NotificationsItem"}), withHover, withErrorBoundary);
