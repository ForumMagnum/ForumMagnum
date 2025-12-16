"use client";

import React, { useMemo, useState } from 'react';
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
  },
  sortByToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    userSelect: 'none',
    cursor: 'pointer',
    marginLeft: '16px',
    [theme.breakpoints.down('sm')]: {
      marginLeft: '8px',
    },
  },
  sortByLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: theme.palette.grey[700],
  },
  sortBySelect: {
    padding: '4px 8px',
    fontSize: '14px',
    border: `1px solid ${theme.palette.grey[300]}`,
    borderRadius: '4px',
    backgroundColor: theme.palette.background.paper,
    cursor: 'pointer',
    color: theme.palette.grey[700],
    '&:hover': {
      borderColor: theme.palette.grey[400],
    },
  }
});

function sortSpotlightsInDisplayOrder(spotlights: SpotlightDisplay[], sortBy: 'lastPromotedAt' | 'position' = 'position'): SpotlightDisplay[] {
  if (!spotlights.length) return spotlights;
  
  const [currentSpotlight] = [...spotlights].filter(spotlight => spotlight.draft === false).sort((a, b) => {
    const aTime = new Date(a.lastPromotedAt).getTime();
    const bTime = new Date(b.lastPromotedAt).getTime();
    if (aTime && bTime) {
      return bTime - aTime; // Sort descending to get most recent first
    }
    return 0;
  });

  const sortedSpotlights = [...spotlights].sort((a, b) => {
    if (sortBy === 'position') {
      return a.position - b.position; // Ascending position
    } else {
      const aTime = new Date(a.lastPromotedAt).getTime();
      const bTime = new Date(b.lastPromotedAt).getTime();
      return bTime - aTime; // Ascending lastPromotedAt
    }
  });
  
  return [currentSpotlight, ...sortedSpotlights];
}

export const SpotlightsPage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const [sortBy, setSortBy] = useState<'upcoming' | 'past'>('upcoming');

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

  const spotlightsInDisplayOrder = useMemo(() => sortSpotlightsInDisplayOrder(spotlights), [spotlights]);

  const allNonDraftSpotlights = spotlightsInDisplayOrder.filter(spotlight => !spotlight.draft);
  
  // Find the current spotlight (most recently promoted)
  const currentSpotlight = useMemo(() => {
    return [...allNonDraftSpotlights].sort((a, b) => {
      const aTime = new Date(a.lastPromotedAt).getTime();
      const bTime = new Date(b.lastPromotedAt).getTime();
      return bTime - aTime;
    })[0];
  }, [allNonDraftSpotlights]);

  // Split into upcoming (position > current) and past (position < current)
  const upcomingSpotlights = useMemo(() => {
    if (!currentSpotlight) return allNonDraftSpotlights;
    return [currentSpotlight, ...allNonDraftSpotlights.filter(s => s.position > currentSpotlight.position)];
  }, [allNonDraftSpotlights, currentSpotlight]);

  const pastSpotlights = useMemo(() => {
    if (!currentSpotlight) return [];
    return allNonDraftSpotlights.filter(s => s.position < currentSpotlight.position);
  }, [allNonDraftSpotlights, currentSpotlight]);

  const displayedSpotlights = sortBy === 'upcoming' ? upcomingSpotlights : pastSpotlights;
  
  const draftSpotlights = spotlights.filter(spotlight => spotlight.draft)
  const uniqueDocumentIds = [...new Set(draftSpotlights.map(spotlight => spotlight.documentId))];

  if (!userCanDo(currentUser, 'spotlights.edit.all')) {
    return <SingleColumnSection>
      <ErrorAccessDenied/>
    </SingleColumnSection>;
  }

  const totalDisplayedDuration = Math.round(displayedSpotlights.reduce((total, spotlight) => total + spotlight.duration, 0));

  const totalDraftDuration = draftSpotlights.reduce((total, spotlight) => total + spotlight.duration, 0);

  const sectionTitle = sortBy === 'upcoming' ? 'Upcoming Spotlights' : 'Past Spotlights';

  const sectionData = {
    html: "",
    sections: [
      {
        title: sectionTitle,
        anchor: "spotlights",
        level: 1
      },
      ...displayedSpotlights.map(spotlight => ({
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
      <SectionTitle title={sectionTitle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>Total: {totalDisplayedDuration} days, {displayedSpotlights.length} spotlights</div>
          <div className={classes.sortByToggle}>
            <span className={classes.sortByLabel}>Sort by:</span>
            <select 
              className={classes.sortBySelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'upcoming' | 'past')}
            >
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
          </div>
        </div>
      </SectionTitle>
      {displayedSpotlights.map(spotlight => <SpotlightItem key={`spotlightpage${spotlight._id}`} spotlight={spotlight} refetchAllSpotlights={refetch} showAdminInfo/>)}
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



