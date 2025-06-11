import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import SpotlightItem from "./SpotlightItem";
import LoadMore from "../common/LoadMore";
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";

const SpotlightDisplayMultiQuery = gql(`
  query multiSpotlightSpotlightHistoryQuery($selector: SpotlightSelector, $limit: Int, $enableTotal: Boolean) {
    spotlights(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SpotlightDisplay
      }
      totalCount
    }
  }
`);

export const SpotlightHistory = () => {
  const currentUser = useCurrentUser()

  const { data, loadMoreProps } = useQueryWithLoadMore(SpotlightDisplayMultiQuery, {
    variables: {
      selector: { mostRecentlyPromotedSpotlights: {} },
      limit: 1,
      enableTotal: false,
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    itemsPerPage: 50,
  });

  const spotlights = data?.spotlights?.results ?? [];

  const title = userCanDo(currentUser, 'spotlights.edit.all') ? <Link to={"/spotlights"}>Spotlight Items</Link> : <div>Spotlight Items</div>

  return <SingleColumnSection>
    <SectionTitle title={title}/>
    {spotlights.map(spotlight => <SpotlightItem key={spotlight._id} spotlight={spotlight}/>)}
    <LoadMore {...loadMoreProps}/>
  </SingleColumnSection>;
}

export default registerComponent('SpotlightHistory', SpotlightHistory);



