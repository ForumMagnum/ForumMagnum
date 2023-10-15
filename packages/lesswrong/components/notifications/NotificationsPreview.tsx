// TODO: Import component in components.ts
import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import Card from '@material-ui/core/Card';
import { parseRouteWithErrors } from '../linkPreview/HoverPreviewLink';
import { getNotificationTypeByName } from '../../lib/notificationTypes';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const NotificationsPreview = ({classes, currentUser, notification, lastNotificationsCheck}: {
  classes: ClassesType,
  currentUser: UsersCurrent,
  notification: NotificationsList,
  lastNotificationsCheck: any,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { PostsPreviewTooltipSingle, TaggedPostTooltipSingle, PostsPreviewTooltipSingleWithComment, ConversationPreview, PostNominatedNotification } = Components

  const notificationType = getNotificationTypeByName(notification.type);

  const notificationLink = (notificationType.getLink
    ? notificationType.getLink({
      documentType: notification.documentType,
      documentId: notification.documentId,
      extraData: notification.extraData,
    })
    : notification.link
  );

  const parsedPath = parseRouteWithErrors(notificationLink)

  if (!currentUser) return null

  if (notificationType.onsiteHoverView) {
    return <Card>
      {notificationType.onsiteHoverView({notification})}
    </Card>
  } else if (notification.type == "postNominated") {
    return <Card><PostNominatedNotification postId={notification.documentId}/></Card>
  } else {
    switch (notification.documentType) {
      case 'tagRel':
        return  <Card><TaggedPostTooltipSingle tagRelId={notification.documentId} /></Card>
      case 'post':
        return <Card><PostsPreviewTooltipSingle postId={notification.documentId} /></Card>
      case 'comment':
        const postId = parsedPath?.params?._id
        if (!postId) return null
        return <Card><PostsPreviewTooltipSingleWithComment postId={parsedPath?.params?._id} commentId={notification.documentId} /></Card>
      case 'message':
        return <Card>
          <ConversationPreview conversationId={parsedPath?.params?._id} currentUser={currentUser} />
        </Card>
      default:
        return null
    }
  }
}

const NotificationsPreviewComponent = registerComponent('NotificationsPreview', NotificationsPreview, {styles});

declare global {
  interface ComponentTypes {
    NotificationsPreview: typeof NotificationsPreviewComponent
  }
}
