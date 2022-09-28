import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const SpotlightHistory = ({classes}: {
  classes: ClassesType,
}) => {
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

  const title = userCanDo(currentUser, 'spotlights.edit.all') ? <Link to={"/spotlights"}>Spotlights</Link> : <div>Spotlights</div>

  return <SingleColumnSection className={classes.root}>
    <SectionTitle title={title}/>
    {spotlights.map(spotlight => <SpotlightItem key={spotlight._id} spotlight={spotlight}/>)}
    <LoadMore {...loadMoreProps}/>
  </SingleColumnSection>;
}

const SpotlightHistoryComponent = registerComponent('SpotlightHistory', SpotlightHistory, {styles});

declare global {
  interface ComponentTypes {
    SpotlightHistory: typeof SpotlightHistoryComponent
  }
}

