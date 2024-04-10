import React, { useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';

import { isFriendlyUI, preferredHeadingCase } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 270,
    overflowY: "auto",
    padding: 0,
  },

  empty: {
    ...(isFriendlyUI ? theme.typography.body2 : {}),
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
    fontFamily: isFriendlyUI ? theme.palette.fonts.sansSerifStack : undefined,
  },
});

const NotificationsList = ({ terms, currentUser, classes }: {
  terms: NotificationsViewTerms,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { results, loading, loadMore } = useMulti({
    terms,
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    limit: 20,
    enableTotal: false
  });
  const [lastNotificationsCheck] = useState(
    ((currentUser?.lastNotificationsCheck) || ""),
  );

  if (results?.length) {
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
              {preferredHeadingCase("Load More")}
            </div>
          </ListItem>}
      </List>
    )
  } else if (loading) {
    return <Components.Loading/>
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
