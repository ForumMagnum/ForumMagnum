import { Components as C, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    marginRight: 4
  }
})

const AFSuggestUsersList = ({ terms, classes }: {
  terms: UsersViewTerms,
  classes: ClassesType,
}) => {
  const { results } = useMulti({
    terms,
    collectionName: "Users",
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

