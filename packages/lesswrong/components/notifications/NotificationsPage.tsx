import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import Badge from '@material-ui/core/Badge';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import ClearIcon from '@material-ui/icons/Clear';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import MailIcon from '@material-ui/icons/Mail';
import { useMulti } from '../../lib/crud/withMulti';
import { renderMessage } from './NotificationsItem';
import { getNotificationTypeByName } from '../../lib/notificationTypes';


const styles = (theme: ThemeType): JssStyles => ({
  notification: {
    marginBottom: 24,
  },
  message: {
    marginTop: 8,
    marginRight: 24,
    ...theme.typography.commentStyle,
    display: "flex",
    alignItems: "center",
    color: theme.palette.grey[600],
    '& svg': {
      fontSize: 16,
      marginLeft: '4px !important',
      opacity: .5
    }
  },
  notificationPreview: {
    width: 400
  }
});

export const NotificationsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { NotificationsList, NotificationsPreview, ErrorAccessDenied, SingleColumnSection, SectionTitle } = Components
  const currentUser = useCurrentUser();
  const { unreadNotifications, unreadPrivateMessages, notificationsOpened } = useUnreadNotifications();
  const [tab,setTab] = useState(0);
  const [lastNotificationsCheck] = useState(
    ((currentUser?.lastNotificationsCheck) || ""),
  );
  const notificationCategoryTabs: Array<{ name: string, icon: ()=>React.ReactNode, terms: NotificationsViewTerms }> = [
    {
      name: "All Notifications",
      icon: () => (<Components.ForumIcon icon="Bell" className={classes.icon}/>),
      terms: {view: "userNotifications"},
    },
    {
      name: "New Posts",
      icon: () => (<PostsIcon classes={{root: classes.icon}}/>),
      terms: {view: 'userNotifications', type: "newPost"},
    },
    {
      name: "New Comments",
      icon: () => (<CommentsIcon classes={{root: classes.icon}}/>),
      terms: {view: 'userNotifications', type: "newComment"},
    },
    {
      name: "New Messages",
      icon: () => (
        <Badge
          classes={{ root: classes.badgeContainer, badge: classes.badge }}
          badgeContent={unreadPrivateMessages>0 ? `${unreadPrivateMessages}` : ""}
        >
          <MailIcon classes={{root: classes.icon}} />
        </Badge>
      ),
      terms: {view: 'userNotifications', type: "newMessage"},
    }
  ];
  const category = notificationCategoryTabs[tab];
  const notificationTerms = category.terms;

  if (!currentUser) { return <ErrorAccessDenied /> }

  const { results, loading, loadMore } = useMulti({
    terms: {...notificationTerms, userId: currentUser._id},
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    limit: 20,
    enableTotal: false
  });

  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title="Notifications">

      </SectionTitle>
      {results?.map((notification) => <div className={classes.notification} key={notification._id} >
        <div className={classes.message}>
          {getNotificationTypeByName(notification.type).getIcon()}
          {renderMessage(notification)}
        </div>
        <div className={classes.notificationPreview}>
          <NotificationsPreview notification={notification} currentUser={currentUser} lastNotificationsCheck={lastNotificationsCheck}/>
          </div>
        </div>)}
    </SingleColumnSection>
  </div>;
}

const NotificationsPageComponent = registerComponent('NotificationsPage', NotificationsPage, {styles});

declare global {
  interface ComponentTypes {
    NotificationsPage: typeof NotificationsPageComponent
  }
}
