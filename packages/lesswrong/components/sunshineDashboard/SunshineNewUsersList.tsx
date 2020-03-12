import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import Users from '../../lib/collections/users/collection';
import { useCurrentUser } from '../common/withUser';

const SunshineNewUsersList = ({ terms, allowContentPreview }: {
  terms: any,
  allowContentPreview?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const { results, loadMore, count, totalCount, showLoadMore } = useMulti({
    terms,
    collection: Users,
    fragmentName: 'SunshineUsersList',
    enableTotal: true,
    ssr: true,
    itemsPerPage: 60
  });
  const { SunshineListCount, SunshineListTitle, SunshineNewUsersItem, LoadMore } = Components

  if (results && results.length && Users.canDo(currentUser, "posts.moderate.all")) {
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
        {showLoadMore && <LoadMore
          loadMore={() => {
            loadMore();
          }}
          count={count}
          totalCount={totalCount}
        />}
      </div>
    )
  } else {
    return null
  }
}

const SunshineNewUsersListComponent = registerComponent('SunshineNewUsersList', SunshineNewUsersList);

declare global {
  interface ComponentTypes {
    SunshineNewUsersList: typeof SunshineNewUsersListComponent
  }
}

