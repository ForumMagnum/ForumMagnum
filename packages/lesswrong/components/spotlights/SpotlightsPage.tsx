import React, { useMemo } from 'react';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import SpotlightItem, { getSpotlightDisplayTitle } from './SpotlightItem';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { SpotlightForm } from './SpotlightForm';
import Loading from "../vulcan-core/Loading";
import SectionTitle from "../common/SectionTitle";
import SingleColumnSection from "../common/SingleColumnSection";
import ErrorAccessDenied from "../common/ErrorAccessDenied";
import SpotlightEditorStyles from "./SpotlightEditorStyles";
import ToCColumn from "../posts/TableOfContents/ToCColumn";
import TableOfContents from "../posts/TableOfContents/TableOfContents";
import LoadMore from "../common/LoadMore";
import { useQuery } from "@apollo/client";
import { useLoadMore } from "@/components/hooks/useLoadMore";
import { gql } from "@/lib/generated/gql-codegen/gql";

const SpotlightDisplayMultiQuery = gql(`
  query multiSpotlightSpotlightsPageQuery($selector: SpotlightSelector, $limit: Int, $enableTotal: Boolean) {
    spotlights(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...SpotlightDisplay
      }
      totalCount
    }
  }
`);

const styles = (theme: ThemeType) => ({
  form: {
    padding: 16,
    background: theme.palette.background.pageActiveAreaBackground,
    boxShadow: theme.palette.boxShadow.featuredResourcesCard,
    marginBottom: 16
  }
});

export const SpotlightsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();

  const { query } = useLocation();
  const onlyDrafts = query.drafts === 'true';
  const noDrafts = query.drafts === 'false';

  const { view, limit, ...selectorTerms } = {
    view: onlyDrafts ? "spotlightsPageDraft" : "spotlightsPage",
    limit: 500
  };
  const { data, loading, refetch, fetchMore } = useQuery(SpotlightDisplayMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 500,
      enableTotal: true,
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  const spotlights = useMemo(() => data?.spotlights?.results ?? [], [data?.spotlights?.results]);

  const loadMoreProps = useLoadMore({
    data: data?.spotlights,
    loading,
    fetchMore,
    initialLimit: 500,
    itemsPerPage: 10,
    enableTotal: true,
    resetTrigger: {
        view: onlyDrafts ? "spotlightsPageDraft" : "spotlightsPage",
        limit: 500
      }
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

export default registerComponent('SpotlightsPage', SpotlightsPage, {styles});



