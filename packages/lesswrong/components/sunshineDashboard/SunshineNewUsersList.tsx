import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  loadMore: {
    fontSize: "1rem",
    textAlign: "right",
    paddingRight: 12,
    paddingBottom: 8
  }
})

const SunshineNewUsersList = ({ classes, terms, allowContentPreview }: {
  terms: UsersViewTerms,
  classes: ClassesType,
  allowContentPreview?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const { results, loadMore, count, totalCount, showLoadMore } = useMulti({
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
          <span>New Users</span>
          <SunshineListCount count={totalCount}/>
        </SunshineListTitle>
        {results.map(user =>
          <div key={user._id} >
            <SunshineNewUsersItem user={user} allowContentPreview={allowContentPreview}/>
          </div>
        )}
        <div className={classes.loadMore}>
          {showLoadMore && <LoadMore
            loadMore={() => {
              loadMore();
            }}
            count={count}
            totalCount={totalCount}
          />}
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

