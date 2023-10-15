import React, { useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';
import { isEAForum } from '../../lib/instanceSettings';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    overflowY: "auto",
    padding: 0,
  },

  empty: {
    ...(isEAForum ? theme.typography.body2 : {}),
    padding: 10
  },

  loadMoreButton: {
    fontSize: "14px",
    padding: 0,
    width: "100%",
    display: "flex",
    justifyContent: "center",
  },
  seeAllLabel: {
    padding: 16,
    textAlign: "center",
    fontFamily: theme.palette.fonts.sansSerifStack
  },
});

const NotificationsList = ({ terms, currentUser, classes }: {
  terms: NotificationsViewTerms,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { NotificationsItem, Row, Loading, LoadMore } = Components;

  const { results, loading, loadMoreProps } = useMulti({
    terms,
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    limit: 20,
    itemsPerPage: 100,
    enableTotal: false
  });
  const [lastNotificationsCheck] = useState(
    ((currentUser?.lastNotificationsCheck) || ""),
  );

  if (results?.length) {
    return (
      <List className={classes.root}>
        {results.map(notification =>
          <NotificationsItem
            notification={notification}
            lastNotificationsCheck={lastNotificationsCheck}
            currentUser={currentUser}
            key={notification._id}
          />
        )}
        {results.length >= 20 &&
          <ListItem
            className={classes.loadMoreButton}
          >
            <LoadMore {...loadMoreProps}/>
            <Link to={"/notifications"} className={classes.seeAllLabel}>
              {preferredHeadingCase("View All")}
            </Link>
          </ListItem>}
      </List>
    )
  } else if (loading) {
    return <Loading/>
  } else {
    const modifier =
        (terms.type === undefined) ? (<></>)
      : (terms.type === 'newPost') ? (<b>new post</b>)
      : (terms.type === 'newComment') ? (<b>new comment</b>)
      : (terms.type === 'newMessage') ? (<b>new message</b>)
      : "of these";
    return <div className={classes.empty}> You don't have any {modifier} notifications yet</div>
  }
}

const NotificationsListComponent = registerComponent('NotificationsList', NotificationsList, {styles});

declare global {
  interface ComponentTypes {
    NotificationsList: typeof NotificationsListComponent
  }
}

