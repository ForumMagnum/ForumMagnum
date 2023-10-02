import React, { useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import Badge from '@material-ui/core/Badge';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import MailIcon from '@material-ui/icons/Mail';
import { useMulti } from '../../lib/crud/withMulti';


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 450,
    marginLeft: "auto",
    marginRight: "auto"
  }
});

export const NotificationsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  const { NotificationsPageItem, ErrorAccessDenied, SingleColumnSection, SectionTitle, SectionFooterCheckbox } = Components
  const currentUser = useCurrentUser();
  const { unreadPrivateMessages } = useUnreadNotifications();
  const [tab,setTab] = useState(0);
  const [expanded, setExpanded] = useState(true);
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

  const { results, loading, loadMore } = useMulti({
    terms: {...notificationTerms, userId: currentUser?._id},
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    limit: 50,
    itemsPerPage: 100,
    enableTotal: false,
    skip: !currentUser
  });

  if (!currentUser) { return <ErrorAccessDenied /> }

  return <div className={classes.root}>
    <SectionTitle title="Notifications"/>
    {results?.map((notification) => <NotificationsPageItem 
      key={notification._id} 
      notification={notification} 
      currentUser={currentUser} 
    />)}
  </div>;
}

const NotificationsPageComponent = registerComponent('NotificationsPage', NotificationsPage, {styles});

declare global {
  interface ComponentTypes {
    NotificationsPage: typeof NotificationsPageComponent
  }
}
