import moment from 'moment';
import React, { useMemo } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';

const styles = (theme: ThemeType): JssStyles => ({
  form: {
    padding: 16,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.featuredResourcesCard,
    marginBottom: 16
  }
});

const MS_IN_DAY = 1000 * 60 * 60 * 24;

export const SpotlightsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { Loading, SectionTitle, SingleColumnSection, SpotlightItem, WrappedSmartForm, ErrorAccessDenied, SpotlightEditorStyles, ToCColumn, TableOfContents, FormatDate } = Components;

  const currentUser = useCurrentUser();
  const now = useCurrentTime();

  const { query } = useLocation();
  const onlyDrafts = query.drafts === 'true';

  const { results: spotlights = [], loading, refetch } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: onlyDrafts ? "spotlightsPageDraft" : "spotlightsPage",
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

  const [currentSpotlight, ...upcomingSpotlights] = spotlightsInDisplayOrder.filter(spotlight => !spotlight.draft)
  const draftSpotlights = spotlightsInDisplayOrder.filter(spotlight => spotlight.draft)

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
  }
  
  const currentSpotlightAgeMs = currentSpotlight
    ? (now.valueOf() - new Date(currentSpotlight.lastPromotedAt).valueOf())
    : 0;
  const currentSpotlightDurationMs = currentSpotlight?.duration * MS_IN_DAY;
  const currentSpotlightTimeLeftMs = Math.max(0, currentSpotlightDurationMs - currentSpotlightAgeMs);
  const nextSpotlightRotationDate = new Date(now.valueOf() + currentSpotlightTimeLeftMs);

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

      {currentSpotlight && <SectionTitle title="Current Spotlight">
        <div>Until: <FormatDate date={nextSpotlightRotationDate}/></div>
      </SectionTitle>}
      {currentSpotlight && <SpotlightItem key={`spotlightpage${currentSpotlight._id}`} spotlight={currentSpotlight} refetchAllSpotlights={refetch} showAdminInfo/>}

      <SectionTitle title="Upcoming Spotlights">
        <div>Total: {totalUpcomingDuration} days</div>
      </SectionTitle>
      {upcomingSpotlights.map(spotlight => <SpotlightItem key={`spotlightpage${spotlight._id}`} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
      {!loading && !upcomingSpotlights.length && <div>
        No spotlight items are scheduled.
      </div>}

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

