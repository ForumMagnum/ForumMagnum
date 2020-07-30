import { registerComponent, Components, Utils } from '../../lib/vulcan-lib';
import classNames from 'classnames';
import React, { Component } from 'react';
import Card from '@material-ui/core/Card';
import { getNotificationTypeByName } from '../../lib/notificationTypes';
import { getUrlClass, withNavigation } from '../../lib/routeUtil';
import withHover from '../common/withHover';
import withErrorBoundary from '../common/withErrorBoundary';
import { parseRouteWithErrors } from '../linkPreview/HoverPreviewLink';

const styles = (theme: ThemeType): JssStyles => ({
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
  preview: {
    [theme.breakpoints.down('xs')]: {
      display:"none"
    }
  },
  notificationLabel: {
    ...theme.typography.commentStyles,
    ...theme.typography.body2,
    fontSize: "14px",
    lineHeight: "18px",
    paddingRight: theme.spacing.unit*2,
    color: "rgba(0,0,0, 0.66)",
    
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

interface ExternalProps {
  notification: any,
  lastNotificationsCheck: any,
  currentUser: UsersCurrent, // *Not* from an HoC, this must be passed (to enforce this component being shown only when logged in)
}
interface NotificationsItemProps extends ExternalProps, WithHoverProps, WithNavigationProps, WithStylesProps {
}
interface NotificationsItemState {
  clicked: boolean,
}

class NotificationsItem extends Component<NotificationsItemProps,NotificationsItemState> {
  constructor(props: NotificationsItemProps) {
    super(props)
    this.state = {
      clicked: false,
    }
  }

  renderPreview = () => {
    const { notification, currentUser } = this.props
    const { PostsPreviewTooltipSingle, TaggedPostTooltipSingle, PostsPreviewTooltipSingleWithComment, ConversationPreview } = Components
    const parsedPath = parseRouteWithErrors(notification.link)

    switch (notification.documentType) {
      case 'tagRel':
        return  <Card><TaggedPostTooltipSingle tagRelId={notification.documentId} /></Card>
      case 'post':
        return <Card><PostsPreviewTooltipSingle postId={notification.documentId} /></Card>
      case 'comment':
        return <Card><PostsPreviewTooltipSingleWithComment postId={parsedPath?.params?._id} commentId={notification.documentId} /></Card>
      case 'message':
        return <Card>
          <ConversationPreview conversationId={parsedPath?.params?._id} currentUser={currentUser} />
        </Card>
      default:
        return null
    }
  }

  renderMessage = () => {
    const { notification } = this.props
    const { TagRelNotificationItem } = Components
    switch (notification.documentType) {
      // TODO: add case for tagRel
      case 'tagRel': 
        return <TagRelNotificationItem tagRelId={notification.documentId}/>
      default:
        return notification.message
    }
  }

  render() {
    const { classes, notification, lastNotificationsCheck, hover, anchorEl, history } = this.props;
    const { LWPopper } = Components
    const UrlClass = getUrlClass()
    return (
      <a
        href={notification.link}
        className={classNames(
          classes.root,
          {
            [classes.read]:     notification.createdAt < lastNotificationsCheck || this.state.clicked,
            [classes.unread]: !(notification.createdAt < lastNotificationsCheck || this.state.clicked)
          }
        )}
        onClick={(e) => {
          // Do manual navigation since we also want to do a bunch of other stuff
          e.preventDefault()
          history.push(notification.link)

          this.setState({clicked: true})
          
          // we also check whether it's a relative link, and if so, scroll to the item
          const url = new UrlClass(notification.link, Utils.getSiteUrl())
          const hash = url.hash
          if (hash) {
            const element = document.getElementById(hash.substr(1))
            if (element) element.scrollIntoView({behavior: "smooth"});
          }
        }}
      >
        <LWPopper 
          open={hover} 
          anchorEl={anchorEl} 
          placement="left-start"
          modifiers={{
            flip: {
              behavior: ["left-start"],
              boundariesElement: 'viewport'
            } 
          }}
        >
          <span className={classes.preview}>{this.renderPreview()}</span>
        </LWPopper>
        {getNotificationTypeByName(notification.type).getIcon()}
        <div className={classes.notificationLabel}>
          {this.renderMessage()}
        </div>
      </a>
    )
  }

}

const NotificationsItemComponent = registerComponent<ExternalProps>('NotificationsItem', NotificationsItem, {
  styles,
  hocs: [
    withHover({pageElementContext: "linkPreview", pageElementSubContext: "notificationItem"}),
    withErrorBoundary, withNavigation
  ]
});

declare global {
  interface ComponentTypes {
    NotificationsItem: typeof NotificationsItemComponent
  }
}

