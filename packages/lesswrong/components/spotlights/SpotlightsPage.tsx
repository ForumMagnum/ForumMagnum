import React, { useMemo, useState } from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, getFragment, registerComponent } from '../../lib/vulcan-lib';
import { userCanDo } from '../../lib/vulcan-users';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import sortBy from 'lodash/sortBy';
import { post } from 'request';

const styles = (theme: ThemeType): JssStyles => ({
  form: {
    padding: 16,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.featuredResourcesCard,
    marginBottom: 16
  },
  spotlightList: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16
  }
});

export const SpotlightsPage = ({classes}: {
  classes: ClassesType,
}) => {
  const { Loading, SectionTitle, SingleColumnSection, SpotlightItem, WrappedSmartForm, ErrorAccessDenied, SpotlightEditorStyles, MultiToCLayout, TableOfContents, ContentItemBody } = Components;

  const currentUser = useCurrentUser();

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

  const [post, setPost] = useState<PostsWithNavigation|null>(null);

  const upcomingSpotlights = spotlightsInDisplayOrder.filter(spotlight => !spotlight.draft)
  const draftSpotlights = sortBy(
    spotlightsInDisplayOrder.filter(spotlight => spotlight.draft),
    'documentId'
  );

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

  const spotlightList = <div className={classes.spotlightList}>
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
        {draftSpotlights.map(spotlight => <SpotlightItem key={`spotlightpage${spotlight._id}`} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo duplicate={!!upcomingSpotlights.find(s => s.documentId === spotlight.documentId)} setPost={setPost}/>)}
      </SingleColumnSection>
      {post && <SingleColumnSection>
        <SectionTitle title={post.title}/>
        <ContentItemBody
          dangerouslySetInnerHTML={{__html: post.contents?.html ?? ""}}
        />
      </SingleColumnSection>}
  </div>

  return <MultiToCLayout
    segments={[
      {
        toc: <TableOfContents sectionData={sectionData} title={"Spotlights"} fixedPositionToc={true} />,
        centralColumn: spotlightList,
      },
    ]}
    tocRowMap={[0]}
  />
}

const SpotlightsPageComponent = registerComponent('SpotlightsPage', SpotlightsPage, {styles});

declare global {
  interface ComponentTypes {
    SpotlightsPage: typeof SpotlightsPageComponent
  }
}

