import React from 'react';
import Spotlights from '../../lib/collections/spotlights/collection';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  },
  form: {
    padding: 16,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.featuredResourcesCard,
    marginBottom: 16
  }
});

export const SpotlightsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { Loading, SectionTitle, SingleColumnSection, SpotlightItem, WrappedSmartForm, Typography, SpotlightEditorStyles } = Components;

  const { results: spotlights = [], loading } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {}
  });

  return <div className={classes.root}>
    <SingleColumnSection>
      <SectionTitle title={'Spotlights'} />
      <div className={classes.form}>
        <Typography variant="body2">New Spotlight</Typography>
        <SpotlightEditorStyles>
          <WrappedSmartForm
            collection={Spotlights}
            mutationFragment={getFragment('SpotlightsDefaultFragment')}
          />
        </SpotlightEditorStyles>
      </div>
      {loading
        ? <Loading />
        : spotlights.map(spotlight => {
          return <SpotlightItem key={spotlight._id} spotlight={spotlight}/>
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

