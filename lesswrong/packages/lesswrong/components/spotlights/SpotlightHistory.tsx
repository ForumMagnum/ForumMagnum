import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';

export const SpotlightHistory = () => {
  const { SingleColumnSection, SectionTitle, SpotlightItem, LoadMore } = Components

  const currentUser = useCurrentUser()

  const { results: spotlights = [], loadMoreProps } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: "mostRecentlyPromotedSpotlights",
      limit: 1
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    itemsPerPage: 50
  });

  const title = userCanDo(currentUser, 'spotlights.edit.all') ? <Link to={"/spotlights"}>Spotlight Items</Link> : <div>Spotlight Items</div>

  return <SingleColumnSection>
    <SectionTitle title={title}/>
    {spotlights.map(spotlight => <SpotlightItem key={spotlight._id} spotlight={spotlight}/>)}
    <LoadMore {...loadMoreProps}/>
  </SingleColumnSection>;
}

const SpotlightHistoryComponent = registerComponent('SpotlightHistory', SpotlightHistory);

declare global {
  interface ComponentTypes {
    SpotlightHistory: typeof SpotlightHistoryComponent
  }
}

