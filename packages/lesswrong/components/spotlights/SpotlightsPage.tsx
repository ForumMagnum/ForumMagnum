"use client";

import React, { useMemo } from 'react';
import sumBy from 'lodash/sumBy';
import uniq from 'lodash/uniq';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { SpotlightItem, getSpotlightDisplayTitle } from './SpotlightItem';
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
import { useQueryWithLoadMore } from "@/components/hooks/useQueryWithLoadMore";
import { gql } from "@/lib/generated/gql-codegen";
import { SpotlightDisplay } from "@/lib/generated/gql-codegen/graphql";
import { buildPromotionSchedule, getPromotionOrderedSpotlights, PromotionScheduleEntry } from "@/lib/collections/spotlights/spotlightScheduling";

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

const buildSectionData = (promotionSchedule: PromotionScheduleEntry<SpotlightDisplay>[], draftSpotlights: SpotlightDisplay[], includeDrafts: boolean) => {
  return {
    html: "",
    sections: [
      {
        title: "Upcoming Spotlights",
        anchor: "upcoming-spotlights",
        level: 1
      },
      ...promotionSchedule.map(entry => ({
        title: getSpotlightDisplayTitle(entry.spotlight),
        anchor: entry.spotlight._id,
        level: 2
      })),
      ...(includeDrafts ? [
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
      ] : []),
    ],
  };
};

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
  const { data, loading, refetch, loadMoreProps } = useQueryWithLoadMore(SpotlightDisplayMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit,
      enableTotal: true,
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });

  const spotlights = useMemo<SpotlightDisplay[]>(() => data?.spotlights?.results ?? [], [data?.spotlights?.results]);

  const spotlightsInPromotionOrder = useMemo(() => {
    const activeSpotlights = spotlights.filter(spotlight => !spotlight.draft);
    if (!activeSpotlights.length) {
      return [];
    }
    return getPromotionOrderedSpotlights(activeSpotlights);
  }, [spotlights]);
  const promotionSchedule = useMemo<PromotionScheduleEntry<SpotlightDisplay>[]>(() => buildPromotionSchedule(spotlightsInPromotionOrder), [spotlightsInPromotionOrder]);

  const draftSpotlights = useMemo<SpotlightDisplay[]>(() => spotlights.filter(spotlight => spotlight.draft), [spotlights]);
  
  const uniqueDocumentIds = useMemo(() => uniq(draftSpotlights.map(spotlight => spotlight.documentId)), [draftSpotlights]);
  
  const sectionData = useMemo(() => buildSectionData(promotionSchedule, draftSpotlights, !noDrafts), [promotionSchedule, draftSpotlights, noDrafts]);
  
  if (!userCanDo(currentUser, 'spotlights.edit.all')) {
    return <SingleColumnSection>
      <ErrorAccessDenied/>
    </SingleColumnSection>;
  }
  const totalUpcomingDuration = sumBy(spotlightsInPromotionOrder, spotlight => spotlight.duration ?? 0);
  const totalDraftDuration = sumBy(draftSpotlights, spotlight => spotlight.duration ?? 0);

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
        Total: {totalUpcomingDuration} days, {spotlightsInPromotionOrder.length} spotlights
      </SectionTitle>

      {promotionSchedule.map(entry => <SpotlightItem key={`spotlightpage${entry.spotlight._id}`} spotlight={entry.spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
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



