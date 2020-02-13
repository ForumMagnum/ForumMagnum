import React, { useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import Notifications from '../../lib/collections/notifications/collection';
import { useCurrentUser } from '../common/withUser';

const styles = theme => ({
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

const NotificationsList = ({ terms, classes }) => {
  const currentUser = useCurrentUser();
  const { results, loadMore } = useMulti({
    terms,
    collection: Notifications,
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

