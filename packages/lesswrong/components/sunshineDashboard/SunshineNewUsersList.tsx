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

const styles = (theme: ThemeType) => ({
  loadMore: {
    fontSize: "1rem",
    textAlign: "right",
    paddingRight: 12,
    paddingBottom: 8
  }
})

const SunshineNewUsersList = ({ classes, terms, currentUser }: {
  terms: { view: 'sunshineNewUsers' | 'allUsers', limit: number },
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
}) => {
  const { view, limit, ...selectorTerms } = terms;
  const { data, refetch, loadMoreProps } = useQueryWithLoadMore(SunshineUsersListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: limit ?? 10,
      enableTotal: true,
    },
    itemsPerPage: 60,
  });

  const results = view === 'sunshineNewUsers'
    ? data?.users?.results.filter(user => user.needsReview)
    : data?.users?.results;
  
  const totalCount = data?.users?.totalCount ?? 0;

  if (results && results.length && userCanDo(currentUser, "posts.moderate.all")) {
    return (
      <div>
        <SunshineListTitle>
          <Link to="/admin/moderation">Unreviewed Users</Link>
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
  styles,
  areEqual: {
    terms: "deep",
  },
});



