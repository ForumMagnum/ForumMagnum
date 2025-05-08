import React, { useMemo } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { getSpotlightDisplayTitle } from './SpotlightItem';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { SpotlightForm } from './SpotlightForm';

const styles = (theme: ThemeType) => ({
  form: {
    padding: 16,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.featuredResourcesCard,
    marginBottom: 16
  }
});

export const SpotlightsPageInner = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { Loading, SectionTitle, SingleColumnSection, SpotlightItem, ErrorAccessDenied, SpotlightEditorStyles, ToCColumn, TableOfContents, LoadMore } = Components;

  const currentUser = useCurrentUser();

  const { query } = useLocation();
  const onlyDrafts = query.drafts === 'true';
  const noDrafts = query.drafts === 'false';

  const { results: spotlights = [], loading, refetch, loadMoreProps } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: onlyDrafts ? "spotlightsPageDraft" : "spotlightsPage",
      limit: 500
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    enableTotal:  true
  });

  const spotlightsInDisplayOrder = useMemo(() => {
    if (!spotlights.length) return spotlights;
    const [currentSpotlight] = spotlights;
    const upcomingSpotlights = spotlights.filter(spotlight => spotlight.position > currentSpotlight.position);
    const recycledSpotlights = spotlights.filter(spotlight => spotlight.position < currentSpotlight.position);
    return [currentSpotlight, ...upcomingSpotlights, ...recycledSpotlights];
  }, [spotlights]);

  const upcomingSpotlights = spotlightsInDisplayOrder.filter(spotlight => !spotlight.draft)
  const draftSpotlights = spotlights.filter(spotlight => spotlight.draft)
  const uniqueDocumentIds = [...new Set(draftSpotlights.map(spotlight => spotlight.documentId))];

  if (!userCanDo(currentUser, 'spotlights.edit.all')) {
    return <SingleColumnSection>
      <ErrorAccessDenied/>
    </SingleColumnSection>;
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
        title: getSpotlightDisplayTitle(spotlight),
        anchor: spotlight._id,
        level: 2
      })),
      ...(noDrafts ? [] : [
        {
          title: "Draft Spotlights",
          anchor: "draft-spotlights",
          level: 1
        },
        ...draftSpotlights.map(spotlight => ({
          title: getSpotlightDisplayTitle(spotlight),
          anchor: spotlight._id,
          level: 2
        }))
      ]),
    ],
  }

  return <ToCColumn tableOfContents={<TableOfContents
    sectionData={sectionData}
    title={"Spotlights"}
  />}>
    <SingleColumnSection>
      <SectionTitle title={'New Spotlight'} />
      <div className={classes.form}>
        <SpotlightEditorStyles>
          <SpotlightForm
            onSuccess={() => refetch()}
          />
        </SpotlightEditorStyles>
      </div>
      {loading && !onlyDrafts && <Loading/>}
      <SectionTitle title="Upcoming Spotlights">
        <div>Total: {totalUpcomingDuration} days, {upcomingSpotlights.length} spotlights</div>
      </SectionTitle>
      {upcomingSpotlights.map(spotlight => <SpotlightItem key={`spotlightpage${spotlight._id}`} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
      <LoadMore {...loadMoreProps} />
      {!noDrafts && <div>
        <SectionTitle title="Draft Spotlights">
          <div>Total: {totalDraftDuration} days, {uniqueDocumentIds.length} spotlights</div>
        </SectionTitle>
        {draftSpotlights.map(spotlight => <SpotlightItem key={`spotlightpage${spotlight._id}`} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo isDraftProcessing={onlyDrafts}/>)}
        <LoadMore {...loadMoreProps} />
      </div>}
    </SingleColumnSection>
  </ToCColumn>
}

export const SpotlightsPage = registerComponent('SpotlightsPage', SpotlightsPageInner, {styles});

declare global {
  interface ComponentTypes {
    SpotlightsPage: typeof SpotlightsPage
  }
}

