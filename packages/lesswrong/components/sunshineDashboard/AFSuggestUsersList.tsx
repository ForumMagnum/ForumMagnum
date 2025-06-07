import { registerComponent } from '../../lib/vulcan-lib/components';
import React from 'react';
import SunshineListTitle from "./SunshineListTitle";
import OmegaIcon from "../icons/OmegaIcon";
import LoadMore from "../common/LoadMore";
import AFSuggestUsersItem from "./AFSuggestUsersItem";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/crud/wrapGql";

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
  const { data, loadMoreProps } = useQueryWithLoadMore(SuggestAlignmentUserMultiQuery, {
    variables: {
      selector: { alignmentSuggestedUsers: {} },
      limit: 100,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    itemsPerPage: 100,
  });

  const results = data?.users?.results;

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



