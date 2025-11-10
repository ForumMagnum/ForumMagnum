"use client";

import React, { useMemo } from 'react';
import sortBy from 'lodash/sortBy';
import sumBy from 'lodash/sumBy';
import uniq from 'lodash/uniq';
import maxBy from 'lodash/maxBy';
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

const SpotlightDisplayMultiQuery = gql(`
  query multiSpotlightSpotlightsSchedulePageQuery($selector: SpotlightSelector, $limit: Int, $enableTotal: Boolean) {
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

const MS_IN_DAY = 1000 * 60 * 60 * 24;

type PromotionScheduleEntry = {
  spotlight: SpotlightDisplay;
  activationDate: Date;
  endDate: Date;
};

const getDateValue = (value: Date | string) => {
  const timestamp = new Date(value).valueOf();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getCurrentSpotlight = (spotlights: SpotlightDisplay[]) => {
  return maxBy(spotlights, spotlight => getDateValue(spotlight.lastPromotedAt));
};

const getPromotionOrderedSpotlights = (spotlights: SpotlightDisplay[]) => {
  if (!spotlights.length) {
    return [];
  }
  const currentSpotlight = getCurrentSpotlight(spotlights);
  const spotlightsByPosition = sortBy(spotlights, spotlight => spotlight.position);
  if (!currentSpotlight) {
    return spotlightsByPosition;
  }
  const currentIndex = spotlightsByPosition.findIndex(spotlight => spotlight._id === currentSpotlight._id);
  if (currentIndex === -1) {
    return spotlightsByPosition;
  }
  return [
    ...spotlightsByPosition.slice(currentIndex),
    ...spotlightsByPosition.slice(0, currentIndex),
  ];
};

const buildPromotionSchedule = (orderedSpotlights: SpotlightDisplay[]): PromotionScheduleEntry[] => {
  if (!orderedSpotlights.length) {
    return [];
  }
  let activationTimestamp = getDateValue(orderedSpotlights[0].lastPromotedAt);
  return orderedSpotlights.map((spotlight, index) => {
    if (index === 0) {
      activationTimestamp = getDateValue(spotlight.lastPromotedAt);
    } else {
      const previousSpotlight = orderedSpotlights[index - 1];
      activationTimestamp += (previousSpotlight.duration ?? 0) * MS_IN_DAY;
    }
    const activationDate = new Date(activationTimestamp);
    const endDate = new Date(activationDate.valueOf() + ((spotlight.duration ?? 0) * MS_IN_DAY));
    return {
      spotlight,
      activationDate,
      endDate,
    };
  });
};

const buildSectionData = (promotionSchedule: PromotionScheduleEntry[], draftSpotlights: SpotlightDisplay[], includeDrafts: boolean) => {
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

const SpotlightsSchedulePage = ({classes}: {
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
      limit: 500,
      enableTotal: true,
    },
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  });
  const spotlights = useMemo(() => data?.spotlights?.results ?? [], [data?.spotlights?.results]);
  const spotlightsInPromotionOrder = useMemo(() => {
    const activeSpotlights = spotlights.filter(spotlight => !spotlight.draft);
    if (!activeSpotlights.length) {
      return [];
    }
    return getPromotionOrderedSpotlights(activeSpotlights);
  }, [spotlights]);
  const promotionSchedule = useMemo(() => buildPromotionSchedule(spotlightsInPromotionOrder), [spotlightsInPromotionOrder]);
  const draftSpotlights = useMemo(() => spotlights.filter(spotlight => spotlight.draft), [spotlights]);
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
        <div>Total: {totalUpcomingDuration} days, {spotlightsInPromotionOrder.length} spotlights</div>
      </SectionTitle>
      {promotionSchedule.map(entry => <SpotlightItem key={`spotlightschedule${entry.spotlight._id}`} spotlight={entry.spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
      <LoadMore {...loadMoreProps} />
      {!noDrafts && <div>
        <SectionTitle title="Draft Spotlights">
          <div>Total: {totalDraftDuration} days, {uniqueDocumentIds.length} spotlights</div>
        </SectionTitle>
        {draftSpotlights.map(spotlight => <SpotlightItem key={`spotlightschedule${spotlight._id}`} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo isDraftProcessing={onlyDrafts}/>)}
        <LoadMore {...loadMoreProps} />
      </div>}
    </SingleColumnSection>
  </ToCColumn>;
};

export default registerComponent('SpotlightsSchedulePage', SpotlightsSchedulePage, {styles});

