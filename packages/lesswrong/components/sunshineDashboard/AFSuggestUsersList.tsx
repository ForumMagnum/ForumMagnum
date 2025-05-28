import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import SunshineListTitle from "./SunshineListTitle";
import OmegaIcon from "../icons/OmegaIcon";
import LoadMore from "../common/LoadMore";
import AFSuggestUsersItem from "./AFSuggestUsersItem";
import { useQuery } from "@apollo/client";
import { useLoadMore } from "@/components/hooks/useLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SuggestAlignmentUserMultiQuery = gql(`
  query multiUserAFSuggestUsersListQuery($selector: UserSelector, $limit: Int, $enableTotal: Boolean) {
    users(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SuggestAlignmentUser
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  icon: {
    marginRight: 4
  }
})

const AFSuggestUsersList = ({ classes }: {
  classes: ClassesType<typeof styles>,
}) => {
  const { data, loading, fetchMore } = useQuery(SuggestAlignmentUserMultiQuery, {
    variables: {
      selector: { alignmentSuggestedUsers: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.users?.results;

  const loadMoreProps = useLoadMore({
    data: data?.users,
    loading,
    fetchMore,
    initialLimit: 100,
    itemsPerPage: 100,
    enableTotal: true,
    resetTrigger: {view:"alignmentSuggestedUsers", limit: 100}
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

export default registerComponent('AFSuggestUsersList', AFSuggestUsersList, {styles});



