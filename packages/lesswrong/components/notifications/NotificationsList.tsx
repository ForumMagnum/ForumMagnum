import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { preferredHeadingCase } from '../../themes/forumTheme';
import NotificationsItem from "./NotificationsItem";
import Loading from "../vulcan-core/Loading";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const NotificationsListMultiQuery = gql(`
  query multiNotificationNotificationsListQuery($selector: NotificationSelector, $limit: Int, $enableTotal: Boolean) {
    notifications(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...NotificationsList
      }
      totalCount
    }
  }
`);

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

const NotificationsList = ({ terms, currentUser, classes }: {
  terms: NotificationsViewTerms,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data, loading, loadMoreProps } = useQueryWithLoadMore(NotificationsListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 20,
      enableTotal: false,
    },
    itemsPerPage: 10,
  });

  const results = data?.notifications?.results;
  const { loadMore } = loadMoreProps;

  const [lastNotificationsCheck] = useState(
    ((currentUser?.lastNotificationsCheck) || ""),
  );

  if (results?.length) {
    return (
      <ul className={classes.root}>
        {results.map(notification =>
          <NotificationsItem
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

export default registerComponent('NotificationsList', NotificationsList, {styles});


