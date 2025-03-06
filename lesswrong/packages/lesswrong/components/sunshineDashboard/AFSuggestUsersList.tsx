import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import React from 'react';
import SunshineListTitle from "@/components/sunshineDashboard/SunshineListTitle";
import OmegaIcon from "@/components/icons/OmegaIcon";
import LoadMore from "@/components/common/LoadMore";
import AFSuggestUsersItem from "@/components/sunshineDashboard/AFSuggestUsersItem";

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})

const AFSuggestUsersList = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { results, loadMoreProps } = useMulti({
    terms: {view:"alignmentSuggestedUsers", limit: 100},
    collectionName: "Users",
    enableTotal: true, itemsPerPage: 100,
    fragmentName: 'SuggestAlignmentUser',
    fetchPolicy: 'cache-and-network',
  });
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

const AFSuggestUsersListComponent = registerComponent('AFSuggestUsersList', AFSuggestUsersList, {styles});

declare global {
  interface ComponentTypes {
    AFSuggestUsersList: typeof AFSuggestUsersListComponent
  }
}

export default AFSuggestUsersListComponent;

