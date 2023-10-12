import React, { useMemo } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
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
  const { Loading, SectionTitle, SingleColumnSection, SpotlightItem, WrappedSmartForm, ErrorAccessDenied, SpotlightEditorStyles, ToCColumn, TableOfContents } = Components;

  const currentUser = useCurrentUser();

  const { results: spotlights = [], loading, refetch } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: "spotlightsPage",
      limit: 100
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only'
  });

  const spotlightsInDisplayOrder = useMemo(() => {
    if (!spotlights.length) return spotlights;
    const [currentSpotlight] = spotlights;
    const upcomingSpotlights = spotlights.filter(spotlight => spotlight.position > currentSpotlight.position);
    const recycledSpotlights = spotlights.filter(spotlight => spotlight.position < currentSpotlight.position);
    return [currentSpotlight, ...upcomingSpotlights, ...recycledSpotlights];
  }, [spotlights]);

  const upcomingSpotlights = spotlightsInDisplayOrder.filter(spotlight => !spotlight.draft)
  const draftSpotlights = spotlightsInDisplayOrder.filter(spotlight => spotlight.draft)

  if (!userCanDo(currentUser, 'spotlights.edit.all')) {
    return <Components.Error404 />
  }

  const totalUpcomingDuration = upcomingSpotlights.reduce((total, spotlight) => total + spotlight.duration, 0);

  const totalDraftDuration = draftSpotlights.reduce((total, spotlight) => total + spotlight.duration, 0);

  const sectionData = {
    html: "",
    sections: [
      {
        title: "Upcoming Spotlights",
        anchor: "upcoming-spotlights",
        level: 1
      },
      ...upcomingSpotlights.map(spotlight => ({
        title: spotlight.document.title,
        anchor: spotlight._id,
        level: 2
      })),
      {
        title: "Draft Spotlights",
        anchor: "draft-spotlights",
        level: 1
      },
      ...draftSpotlights.map(spotlight => ({
        title: spotlight.document.title,
        anchor: spotlight._id,
        level: 2
      })),
    ],
    headingsCount: 2
  }

  return <ToCColumn tableOfContents={<TableOfContents
    sectionData={sectionData}
    title={"Spotlights"}
  />}>
    <SingleColumnSection>
      <SectionTitle title={'New Spotlight'} />
      <div className={classes.form}>
        <SpotlightEditorStyles>
          <WrappedSmartForm
            collectionName="Spotlights"
            mutationFragment={getFragment('SpotlightEditQueryFragment')}
          />
        </SpotlightEditorStyles>
      </div>
      {loading && <Loading/>}
      <SectionTitle title="Upcoming Spotlights">
        <div>Total: {totalUpcomingDuration} days</div>
      </SectionTitle>
      {upcomingSpotlights.map(spotlight => <SpotlightItem key={`spotlightpage${spotlight._id}`} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
      <SectionTitle title="Draft Spotlights">
        <div>Total: {totalDraftDuration} days</div>
      </SectionTitle>
      {draftSpotlights.map(spotlight => <SpotlightItem key={`spotlightpage${spotlight._id}`} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
    </SingleColumnSection>
  </ToCColumn>
}

const SpotlightsPageComponent = registerComponent('SpotlightsPage', SpotlightsPage, {styles});

declare global {
  interface ComponentTypes {
    SpotlightsPage: typeof SpotlightsPageComponent
  }
}

