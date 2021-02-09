import React, { useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 270,
    overflowY: "auto",
    padding: 0,
  },
  
  empty: {
    padding: 10
  },
  
  loadMoreButton: {
    fontSize: "14px",
    padding: 0,
  },
  loadMoreLabel: {
    padding: 16,
    textAlign: "center",
    width: "100%",
  },
});

const NotificationsList = ({ terms, currentUser, classes }: {
  terms: NotificationsViewTerms,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { results, loadMore } = useMulti({
    terms,
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    limit: 20,
    enableTotal: false
  });
  const [lastNotificationsCheck, setLastNotificationsCheck] = useState(
    ((currentUser?.lastNotificationsCheck) || ""),
  );

  if (results && results.length) {
    return (
      <List className={classes.root}>
        {results.map(notification =>
          <Components.NotificationsItem
            notification={notification}
            lastNotificationsCheck={lastNotificationsCheck}
            currentUser={currentUser}
            key={notification._id}
          />
        )}
        {results.length >= 20 &&
          <ListItem
            button={true}
            className={classes.loadMoreButton}
            onClick={() => loadMore()}
          >
            <div className={classes.loadMoreLabel}>
              Load More
            </div>
          </ListItem>}
      </List>
    )
  } else {
    return <div className={classes.empty}> You don't have any notifications yet!</div>
  }
}

const NotificationsListComponent = registerComponent('NotificationsList', NotificationsList, {styles});

declare global {
  interface ComponentTypes {
    NotificationsList: typeof NotificationsListComponent
  }
}

