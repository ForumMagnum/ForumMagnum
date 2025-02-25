import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType) => ({
  loadMore: {
    fontSize: "1rem",
    textAlign: "right",
    paddingRight: 12,
    paddingBottom: 8
  }
})

const SunshineNewUsersList = ({ classes, terms, currentUser }: {
  terms: UsersViewTerms,
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
}) => {
  const { results, totalCount, loadMoreProps, refetch } = useMulti({
    terms,
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
    enableTotal: true,
    itemsPerPage: 60
  });
  const { SunshineListCount, SunshineListTitle, SunshineNewUsersItem, LoadMore } = Components

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

const SunshineNewUsersListComponent = registerComponent('SunshineNewUsersList', SunshineNewUsersList, {styles});

declare global {
  interface ComponentTypes {
    SunshineNewUsersList: typeof SunshineNewUsersListComponent
  }
}

