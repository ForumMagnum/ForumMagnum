import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import SpotlightItem from "./SpotlightItem";
import LoadMore from "../common/LoadMore";
import { useQuery } from "@apollo/client";
import { useLoadMore } from "@/components/hooks/useLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

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

  const { data, loading, fetchMore } = useQuery(SpotlightDisplayMultiQuery, {
    variables: {
      selector: { mostRecentlyPromotedSpotlights: {} },
      limit: 1,
      enableTotal: false,
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const spotlights = data?.spotlights?.results ?? [];

  const loadMoreProps = useLoadMore({
    data: data?.spotlights,
    loading,
    fetchMore,
    initialLimit: 1,
    itemsPerPage: 50,
    resetTrigger: {
        view: "mostRecentlyPromotedSpotlights",
        limit: 1
      }
  });

  const title = userCanDo(currentUser, 'spotlights.edit.all') ? <Link to={"/spotlights"}>Spotlight Items</Link> : <div>Spotlight Items</div>

  return <SingleColumnSection>
    <SectionTitle title={title}/>
    {spotlights.map(spotlight => <SpotlightItem key={spotlight._id} spotlight={spotlight}/>)}
    <LoadMore {...loadMoreProps}/>
  </SingleColumnSection>;
}

export default registerComponent('SpotlightHistory', SpotlightHistory);



