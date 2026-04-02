import React, { useState } from 'react';
import NotificationsPageItem from "./NotificationsPageItem";
import Loading from "../vulcan-core/Loading";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { NotificationsListMultiQuery } from './NotificationsListMultiQuery';
import { useCurrentUser } from '../common/withUser';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('NotificationsPageList', (theme: ThemeType) => ({
  root: {
    padding: 0,
    margin: 0,
    listStyle: "none",
  },

  empty: {
    ...theme.typography.body2,
    padding: '32px 16px',
    textAlign: 'center',
    color: theme.palette.text.dim55,
    fontSize: 14,
  },

  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: '32px 16px',
  },

  loadMore: {
    display: "flex",
    justifyContent: "center",
    padding: '12px 16px',
    borderTop: theme.palette.border.faint,
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.greyAlpha(0.05),
    },
  },
  loadMoreLabel: {
    ...theme.typography.body2,
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.primary.main,
  },
}));

const NotificationsPageList = ({terms}: {
  terms: NotificationsViewTerms,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
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
          <NotificationsPageItem
            notification={notification}
            lastNotificationsCheck={lastNotificationsCheck}
            key={notification._id}
          />
        )}
        {results.length >= 20 &&
          <li
            className={classes.loadMore}
            onClick={() => loadMore()}
          >
            <span className={classes.loadMoreLabel}>
              Load more
            </span>
          </li>}
      </ul>
    );
  } else if (loading) {
    return (
      <div className={classes.loading}>
        <Loading/>
      </div>
    );
  } else {
    const modifier =
        (terms.type === undefined) ? (<></>)
      : (terms.type === 'newPost') ? (<b>post</b>)
      : (terms.type === 'newComment') ? (<b>comment</b>)
      : (terms.type === 'newMessage') ? (<b>message</b>)
      : "of these";
    return <div className={classes.empty}>No {modifier} notifications yet</div>;
  }
};

export default NotificationsPageList;
