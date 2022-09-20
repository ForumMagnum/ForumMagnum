import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { SpotlightItem } from './SpotlightItem';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const CurrentSpotlightItem = ({classes}: {
  classes: ClassesType,
}) => {
  const { SpotlightItem } = Components
  const { results: spotlights = [], loading } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      limit: 1
    }
  });
  return <div className={classes.root}>
    {spotlights.map(spotlight => <SpotlightItem key={spotlight._id} spotlight={spotlight}/>)}
  </div>;
}

const CurrentSpotlightItemComponent = registerComponent('CurrentSpotlightItem', CurrentSpotlightItem, {styles});

declare global {
  interface ComponentTypes {
    CurrentSpotlightItem: typeof CurrentSpotlightItemComponent
  }
}

