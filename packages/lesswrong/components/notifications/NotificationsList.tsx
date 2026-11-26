import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import NotificationsItem, { CommentNotificationFilterSuggestionItem } from "./NotificationsItem";
import Loading from "../vulcan-core/Loading";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { NotificationsListMultiQuery } from './NotificationsListMultiQuery';
import { useCurrentUser } from '../common/withUser';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('NotificationsList', (theme: ThemeType) => ({
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
}));

const MANY_UNREAD_NOTIFICATIONS = 10;

const NotificationsList = ({terms, closeMenu}: {
  terms: NotificationsViewTerms,
  closeMenu: () => void,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
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

  const { latestUnreadCount } = useUnreadNotifications();
  const [unreadCountWhenOpened] = useState(latestUnreadCount ?? 0);
  const showFilterSuggestion = terms.type === undefined
    && unreadCountWhenOpened >= MANY_UNREAD_NOTIFICATIONS
    && !currentUser?.hideCommentNotificationFilterSuggestion;

  const onClickFilterSuggestion = () => {
    void updateCurrentUser({ hideCommentNotificationFilterSuggestion: true });
    closeMenu();
  };

  if (results?.length) {
    return (
      <ul className={classes.root}>
        {showFilterSuggestion && <CommentNotificationFilterSuggestionItem onClick={onClickFilterSuggestion}/>}
        {results.map(notification =>
          <NotificationsItem
            notification={notification}
            lastNotificationsCheck={lastNotificationsCheck}
            key={notification._id}
          />
        )}
        {results.length >= 20 &&
          <div
            className={classes.loadMoreButton}
            onClick={() => loadMore()}
          >
            <div className={classes.loadMoreLabel}>
              Load More
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

export default registerComponent('NotificationsList', NotificationsList, {
  areEqual: {
    terms: "shallow",
  }
});


