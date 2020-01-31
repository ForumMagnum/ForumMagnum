import { Components, registerComponent } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import Users from 'meteor/vulcan:users';
import { useCurrentUser } from '../common/withUser';

const SunshineNewUsersList = ({ terms, allowContentPreview }: {
  terms: any,
  allowContentPreview?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const { results, totalCount } = useMulti({
    terms,
    collection: Users,
    fragmentName: 'SunshineUsersList',
    enableTotal: true,
    ssr: true
  });
  const { SunshineListCount, SunshineListTitle, SunshineNewUsersItem } = Components
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

