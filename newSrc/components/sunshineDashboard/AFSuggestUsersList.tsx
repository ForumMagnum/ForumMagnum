import { Components as C, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import Users from "../../lib/collections/users/collection";

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    marginRight: 4
  }
})

const AFSuggestUsersList = ({ terms, classes }) => {
  const { results } = useMulti({
    terms,
    collection: Users,
    fragmentName: 'SuggestAlignmentUser',
    fetchPolicy: 'cache-and-network',
  });
  if (results && results.length) {
    return (
      <div>
        <C.SunshineListTitle>
          <div><C.OmegaIcon className={classes.icon}/> Suggested Users</div>
        </C.SunshineListTitle>
        {results.map(user =>
          <div key={user._id} >
            <C.AFSuggestUsersItem user={user}/>
          </div>
        )}
      </div>
    )
  } else {
    return null
  }
}

const AFSuggestUsersListComponent = registerComponent('AFSuggestUsersList', AFSuggestUsersList, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestUsersList: typeof AFSuggestUsersListComponent
  }
}

