import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { Link } from '../../lib/reactRouterWrapper';
import SunshineListCount from "./SunshineListCount";
import SunshineListTitle from "./SunshineListTitle";
import SunshineNewUsersItem from "./SunshineNewUsersItem";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const SunshineUsersListMultiQuery = gql(`
  query multiUserSunshineNewUsersListQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshineUsersList
      }
      totalCount
    }
  }
`);

const SunshineNewUsersQueueQuery = gql(`
  query SunshineNewUsersQueueQuery($limit: Int, $enableTotal: Boolean) {
    moderationNewUsers(limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SunshineUsersList
      }
      totalCount
    }
  }
`);

const styles = defineStyles('SunshineNewUsersList', (theme: ThemeType) => ({
  loadMore: {
    fontSize: "1rem",
    textAlign: "right",
    paddingRight: 12,
    paddingBottom: 8
  }
}))

const SunshineNewUsersList = ({terms, currentUser}: {
  terms: { view: 'sunshineNewUsers' | 'allUsers', limit: number },
  currentUser: UsersCurrent,
}) => {
  const classes = useStyles(styles);
  const { view, limit } = terms;
  const isReviewQueue = view === 'sunshineNewUsers';
  // The review queue is ordered by how long users have waited, which needs the
  // custom resolver; the "all users" underbelly list is a plain view.
  const queue = useQueryWithLoadMore(SunshineNewUsersQueueQuery, {
    variables: { limit: limit ?? 10, enableTotal: true },
    itemsPerPage: 60,
    skip: !isReviewQueue,
  });
  const allUsers = useQueryWithLoadMore(SunshineUsersListMultiQuery, {
    variables: { selector: { allUsers: {} }, limit: limit ?? 10, enableTotal: true },
    itemsPerPage: 60,
    skip: isReviewQueue,
  });
  const { refetch, loadMoreProps } = isReviewQueue ? queue : allUsers;

  const results = isReviewQueue
    ? queue.data?.moderationNewUsers?.results.filter(user => user.needsReview)
    : allUsers.data?.users?.results;

  const totalCount = (isReviewQueue ? queue.data?.moderationNewUsers?.totalCount : allUsers.data?.users?.totalCount) ?? 0;

  if (results && results.length && userCanDo(currentUser, "posts.moderate.all")) {
    return (
      <div>
        <SunshineListTitle>
          <Link to="/admin/supermod">Unreviewed Users</Link>
          <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(user =>
          <div key={user._id} >
            <SunshineNewUsersItem user={user} refetch={refetch} currentUser={currentUser}/>
          </div>
        )}
        <div className={classes.loadMore}>
          <LoadMore {...loadMoreProps}/>
        </div>
      </div>
    )
  } else {
    return null
  }
}

export default registerComponent('SunshineNewUsersList', SunshineNewUsersList, {
  areEqual: {
    terms: "deep",
  },
});
