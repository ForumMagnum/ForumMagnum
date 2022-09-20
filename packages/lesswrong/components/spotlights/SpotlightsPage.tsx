import React from 'react';
import Spotlights from '../../lib/collections/spotlights/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const SpotlightsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { Loading, SectionTitle, SingleColumnSection, SpotlightItem, WrappedSmartForm } = Components;

  const { results: spotlights = [], loading } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {}
  });

  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title={'Spotlights'} />
      <WrappedSmartForm
        collection={Spotlights}
        mutationFragment={getFragment('SpotlightsDefaultFragment')}
      />
      {loading
        ? <Loading />
        : spotlights.map(spotlight => {
          return <SpotlightItem spotlight={spotlight}/>
        })
      }
    </SingleColumnSection>
  </div>;
}

const SpotlightsPageComponent = registerComponent('SpotlightsPage', SpotlightsPage, {styles});

declare global {
  interface ComponentTypes {
    SpotlightsPage: typeof SpotlightsPageComponent
  }
}

