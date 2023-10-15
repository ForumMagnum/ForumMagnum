import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import classNames from 'classnames';
import React, { useState } from 'react';
import { getNotificationTypeByName } from '../../lib/notificationTypes';
import { getUrlClass, useNavigation } from '../../lib/routeUtil';
import { useHover } from '../common/withHover';
import withErrorBoundary from '../common/withErrorBoundary';
import { parseRouteWithErrors } from '../linkPreview/HoverPreviewLink';
import { useTracking } from '../../lib/analyticsEvents';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    "&:hover": {
      backgroundColor: `${theme.palette.panelBackground.darken02} !important`,
    },
    display: "flex",
    alignItems: "center",
    padding: 0,
    borderBottom: theme.palette.border.faint,

    // Disable MUI's hover-highlight-color animation that conflicts with having
    // a non-default background color and looks glitchy.
    transition: "none",
  },
  read: {
    backgroundColor: `${theme.palette.panelBackground.darken04} !important`,
    
    "&:hover": {
      backgroundColor: `${theme.palette.panelBackground.darken08} !important`,
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
    ...theme.typography.body2,
    fontSize: "14px",
    lineHeight: "18px",
    paddingRight: theme.spacing.unit*2,
    color: theme.palette.text.notificationLabel,
    
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

export const renderMessage = (notification: NotificationsList) => {
  const { TagRelNotificationItem } = Components
  switch (notification.documentType) {
    // TODO: add case for tagRel
    case 'tagRel': 
      return <TagRelNotificationItem tagRelId={notification.documentId}/>
    default:
      return notification.message
  }
}

const NotificationsItem = ({notification, lastNotificationsCheck, currentUser, classes}: {
  notification: NotificationsList,
  lastNotificationsCheck: any,
  currentUser: UsersCurrent, // *Not* from an HoC, this must be passed (to enforce this component being shown only when logged in)
  classes: ClassesType,
}) => {
  const [clicked,setClicked] = useState(false);
  const {eventHandlers, hover, anchorEl} = useHover({
    pageElementContext: "linkPreview",
    pageElementSubContext: "notificationItem",
  });
  const { captureEvent } = useTracking();
  const { history } = useNavigation();
  const { LWPopper, NotificationsPreview} = Components
  const notificationType = getNotificationTypeByName(notification.type);

  const notificationLink = (notificationType.getLink
    ? notificationType.getLink({
      documentType: notification.documentType,
      documentId: notification.documentId,
      extraData: notification.extraData,
    })
    : notification.link
  );
  
  return (
    <span {...eventHandlers}>
      <LWPopper
        open={hover}
        anchorEl={anchorEl}
        placement="left-start"
        allowOverflow
      >
        <span className={classes.preview}>{<NotificationsPreview notification={notification} currentUser={currentUser} lastNotificationsCheck={lastNotificationsCheck}/>}</span>
      </LWPopper>
      <a
        href={notificationLink}
        className={classNames(
          classes.root,
          {
            [classes.read]:     notification.createdAt < lastNotificationsCheck || clicked,
            [classes.unread]: !(notification.createdAt < lastNotificationsCheck || clicked)
          }
        )}
        onClick={(ev) => {
          if (ev.button>0 || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey)
            return;
            
          captureEvent("notificationItemClick", {
            notification: {
              _id: notification._id,
              type: notification.type,
              documentId: notification.documentId,
              documentType: notification.documentType,
              link: notification.link,
            }
          });
          
          // Do manual navigation since we also want to do a bunch of other stuff
          ev.preventDefault()
          history.push(notificationLink)

          setClicked(true);
          
          // we also check whether it's a relative link, and if so, scroll to the item
          const UrlClass = getUrlClass()
          const url = new UrlClass(notificationLink, getSiteUrl())
          const hash = url.hash
          if (hash) {
            const element = document.getElementById(hash.substr(1))
            if (element) element.scrollIntoView({behavior: "smooth"});
          }
        }}
      >
      {notificationType.getIcon()}
      <div className={classes.notificationLabel}>
        {renderMessage(notification)}
      </div>
    </a>
    </span>
  )
}

const NotificationsItemComponent = registerComponent('NotificationsItem', NotificationsItem, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    NotificationsItem: typeof NotificationsItemComponent
  }
}

