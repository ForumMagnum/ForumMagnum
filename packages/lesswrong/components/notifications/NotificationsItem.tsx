import { registerComponent, Components } from '../../lib/vulcan-lib/components';
import { getSiteUrl } from '../../lib/vulcan-lib/utils';
import classNames from 'classnames';
import React, { FC, ReactNode, useCallback, useState } from 'react';
import Card from '@/lib/vendor/@material-ui/core/src/Card';
import { getNotificationTypeByName } from '../../lib/notificationTypes';
import withErrorBoundary from '../common/withErrorBoundary';
import { parseRouteWithErrors } from '../linkPreview/HoverPreviewLink';
import { useTracking } from '../../lib/analyticsEvents';
import { useNavigate } from '../../lib/routeUtil';
import {checkUserRouteAccess} from '../../lib/vulcan-core/appContext'
import { getUrlClass } from '@/server/utils/getUrlClass';

const styles = (theme: ThemeType) => ({
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

const tooltipProps = {
  placement: "left-start",
  pageElementContext: "linkPreview",
  pageElementSubContext: "notificationItem",
  clickable: true,
} as const;

const TooltipWrapper: FC<{
  title: ReactNode,
  children: ReactNode,
  classes: ClassesType<typeof styles>,
}> = ({title, children, classes}) => {
  const {LWTooltip} = Components;
  return (
    <LWTooltip
      {...tooltipProps}
      tooltip={false}
      title={
        <span className={classes.preview}>
          <Card>
            {title}
          </Card>
        </span>
      }
    >
      {children}
    </LWTooltip>
  );
}

const NotificationsItem = ({notification, lastNotificationsCheck, currentUser, classes}: {
  notification: NotificationsList,
  lastNotificationsCheck: any,
  currentUser: UsersCurrent, // *Not* from an HoC, this must be passed (to enforce this component being shown only when logged in)
  classes: ClassesType<typeof styles>,
}) => {
  const [clicked,setClicked] = useState(false);
  const { captureEvent } = useTracking();
  const navigate = useNavigate();
  const notificationType = getNotificationTypeByName(notification.type);

  const notificationLink = (notificationType.getLink
    ? notificationType.getLink({
      documentType: notification.documentType,
      documentId: notification.documentId,
      extraData: notification.extraData,
    })
    : notification.link
  );

  const PreviewTooltip: FC<{children: ReactNode}> = useCallback(({children}) => {
    const {
      PostsTooltip, ConversationPreview, PostNominatedNotification,
    } = Components;

    if (notificationType.onsiteHoverView) {
      return (
        <TooltipWrapper
          title={notificationType.onsiteHoverView({notification})}
          classes={classes}
        >
          {children}
        </TooltipWrapper>
      );
    }

    if (notification.type === "postNominated") {
      return (
        <TooltipWrapper
          title={<PostNominatedNotification postId={notification.documentId}/>}
          classes={classes}
        >
          {children}
        </TooltipWrapper>
      );
    }

    if (notification.type === "newDialogueMessages") {
      const dialogueMessageInfo = notification.extraData?.dialogueMessageInfo
      const postId = notification.documentId
      return (
        <PostsTooltip postId={postId} dialogueMessageInfo={dialogueMessageInfo} {...tooltipProps}>
          {children}
        </PostsTooltip>
      )
    }

    const parsedPath = checkUserRouteAccess(currentUser, parseRouteWithErrors(notificationLink));
    switch (notification.documentType) {
      case "tagRel":
        return (
          <PostsTooltip tagRelId={notification.documentId} {...tooltipProps}>
            {children}
          </PostsTooltip>
        );
      case "post":
        return (
          <PostsTooltip postId={notification.documentId} {...tooltipProps}>
            {children}
          </PostsTooltip>
        );
      case "comment":
        const postId = parsedPath?.params?._id;
        return postId
          ? (
            <PostsTooltip
              postId={postId}
              commentId={notification.documentId}
              {...tooltipProps}
            >
              {children}
            </PostsTooltip>
          )
          : <>
            {children}
          </>
      case "message":
        return (
          <TooltipWrapper
            title={
              <ConversationPreview
                conversationId={parsedPath?.params?._id}
                currentUser={currentUser}
              />
            }
            classes={classes}
          >
            {children}
          </TooltipWrapper>
        );
      default:
        break;
    }

    return (
      <>{children}</>
    );
  }, [classes, currentUser, notification, notificationLink, notificationType]);

  const renderMessage = () => {
    const { TagRelNotificationItem } = Components
    switch (notification.documentType) {
      // TODO: add case for tagRel
      case 'tagRel': 
        return <TagRelNotificationItem tagRelId={notification.documentId}/>
      default:
        return notification.message
    }
  }
  
  return (
    <PreviewTooltip>
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
          navigate(notificationLink)

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
          {renderMessage()}
        </div>
      </a>
    </PreviewTooltip>
  );
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
