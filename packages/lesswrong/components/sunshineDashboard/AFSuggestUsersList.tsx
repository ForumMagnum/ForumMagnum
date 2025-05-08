import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})

const AFSuggestUsersListInner = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loadMoreProps } = useMulti({
    terms: {view:"alignmentSuggestedUsers", limit: 100},
    collectionName: "Users",
    enableTotal: true, itemsPerPage: 100,
    fragmentName: 'SuggestAlignmentUser',
    fetchPolicy: 'cache-and-network',
  });
  const { SunshineListTitle, OmegaIcon, LoadMore, AFSuggestUsersItem } = Components;
  
  if (results && results.length) {
    return <div>
      <SunshineListTitle>
        <div><OmegaIcon className={classes.icon}/> Suggested Users</div>
      </SunshineListTitle>
      {results.map(user =>
        <div key={user._id} >
          <AFSuggestUsersItem user={user}/>
        </div>
      )}
      <LoadMore {...loadMoreProps}/>
    </div>
  } else {
    return null
  }
}

export const AFSuggestUsersList = registerComponent('AFSuggestUsersList', AFSuggestUsersListInner, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestUsersList: typeof AFSuggestUsersList
  }
}

