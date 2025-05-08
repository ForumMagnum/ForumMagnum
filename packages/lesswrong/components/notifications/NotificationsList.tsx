import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { preferredHeadingCase } from '../../themes/forumTheme';

const styles = (theme: ThemeType) => ({
  root: {
    overflowY: "auto",
    padding: 0,
    margin: 0,
  },

  empty: {
    ...theme.typography.body2,
    padding: 10
  },

  loadMoreButton: {
    fontSize: "14px",
    padding: 0,
    cursor: "pointer",
    margin: 0,
    "&:hover": {
      background: theme.palette.greyAlpha(0.1),
    },
  },
  loadMoreLabel: {
    padding: 16,
    textAlign: "center",
    width: "100%",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
});

const NotificationsListInner = ({ terms, currentUser, classes }: {
  terms: NotificationsViewTerms,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
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
      <ul className={classes.root}>
        {results.map(notification =>
          <Components.NotificationsItem
            notification={notification}
            lastNotificationsCheck={lastNotificationsCheck}
            currentUser={currentUser}
            key={notification._id}
          />
        )}
        {results.length >= 20 &&
          <div
            className={classes.loadMoreButton}
            onClick={() => loadMore()}
          >
            <div className={classes.loadMoreLabel}>
              {preferredHeadingCase("Load More")}
            </div>
          </div>}
      </ul>
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

export const NotificationsList = registerComponent('NotificationsList', NotificationsListInner, {styles});

declare global {
  interface ComponentTypes {
    NotificationsList: typeof NotificationsList
  }
}
