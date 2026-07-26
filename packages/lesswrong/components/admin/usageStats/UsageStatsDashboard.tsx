"use client";

import React, { useEffect, useRef, useState } from "react";
import moment from "moment";
import { useApolloClient } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";
import { useQuery } from "@/lib/crud/useQuery";
import { userIsAdmin } from "../../../lib/vulcan-users/permissions";
import { useCurrentUser } from "../../common/withUser";
import SingleColumnSection from "../../common/SingleColumnSection";
import { defineStyles, useStyles } from "../../hooks/useStyles";
import UsageTimelineScrubber, { UsageHistoryPoint } from "./UsageTimelineScrubber";
import UsageDailyBarChart from "./UsageDailyBarChart";
import UsageTopPostsTable from "./UsageTopPostsTable";
import {
  DAY_MS,
  isoToMs,
  MAX_USAGE_STATS_RANGE_DAYS,
  msToIso,
  rangeDayCount,
  rangeToDates,
  USAGE_STATS_DOMAIN_MONTHS,
  usageStatsRangeKey,
  utcTodayIso,
  type UsageStatsRange,
} from "./usageStatsRange";

/**
 * Admin-only dashboard showing recent site usage stats: a scrubbable timeline
 * for picking the date range, summary cards, daily two-tone bar charts, and a
 * top-posts breakdown. The UI vocabulary follows the ai-2030 /analytics page;
 * the styling follows the LessWrong theme.
 */

const SiteUsageStatsQuery = gql(`
  query SiteUsageStatsQuery($startDate: Date!, $endDate: Date!) {
    SiteUsageStats(startDate: $startDate, endDate: $endDate) {
      days {
        date
        views
        uniqueViews
        postsPublished
        commentsPosted
        votesCast
        newUsers
      }
      totalViews
      totalUniqueViews
      topPosts {
        postId
        title
        slug
        views
        uniqueViews
      }
    }
  }
`);

const SiteUsageHistoryQuery = gql(`
  query SiteUsageHistoryQuery($startDate: Date!, $endDate: Date!) {
    SiteUsageHistory(startDate: $startDate, endDate: $endDate) {
      date
      views
    }
  }
`);

const styles = defineStyles("UsageStatsDashboard", (theme: ThemeType) => ({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: 13,
  },
  pageTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: theme.palette.text.normal,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    [theme.breakpoints.down("xs")]: {
      gridTemplateColumns: "repeat(2, 1fr)",
    },
  },
  card: {
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.default,
    padding: "8px 12px",
  },
  cardLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    color: theme.palette.grey[500],
  },
  cardValueRow: {
    marginTop: 2,
    display: "flex",
    alignItems: "baseline",
    gap: 8,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    color: theme.palette.text.normal,
  },
  cardSub: {
    fontSize: 11,
    fontVariantNumeric: "tabular-nums",
    color: theme.palette.primary.dark,
  },
  "@keyframes usageStatsPulse": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.4 },
    "100%": { opacity: 1 },
  },
  cardValueSkeleton: {
    marginTop: 4,
    height: 20,
    width: 64,
    background: theme.palette.panelBackground.darken05,
    animation: "$usageStatsPulse 1.5s ease-in-out infinite",
  },
  chartSection: {
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.default,
    padding: "10px 12px",
  },
  chartTitle: {
    margin: "0 0 8px 0",
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.text.normal,
  },
  chartSkeleton: {
    height: 176,
    background: theme.palette.panelBackground.darken05,
    animation: "$usageStatsPulse 1.5s ease-in-out infinite",
  },
  tableSkeleton: {
    border: theme.palette.border.normal,
    background: theme.palette.panelBackground.default,
    padding: 16,
  },
  tableSkeletonTitle: {
    margin: "0 0 12px 0",
    fontSize: 13,
    fontWeight: 600,
    color: theme.palette.grey[500],
  },
  tableSkeletonRow: {
    height: 16,
    marginBottom: 6,
    background: theme.palette.panelBackground.darken05,
    animation: "$usageStatsPulse 1.5s ease-in-out infinite",
  },
  errorNotice: {
    border: theme.palette.border.intense,
    background: theme.palette.panelBackground.darken03,
    padding: 12,
    fontSize: 13,
    color: theme.palette.error.main,
  },
}));

const DEFAULT_RANGE: UsageStatsRange = { kind: "days", days: 30 };

/** The scrubber domain's whole span as a newest-first sequence of ranges,
 * each within the server's per-query cap — the chunks of the timeline
 * scrubber's history sweep. Newest first, so recent traffic lands on the
 * scrubber immediately and the graph grows leftward toward the domain start. */
const historyChunkBounds = (domainStartIso: string): { start: string; end: string }[] => {
  const domainStartMs = isoToMs(domainStartIso);
  let endMs = isoToMs(utcTodayIso());
  const chunks: { start: string; end: string }[] = [];
  while (endMs >= domainStartMs) {
    const startMs = Math.max(domainStartMs, endMs - ((MAX_USAGE_STATS_RANGE_DAYS - 1) * DAY_MS));
    chunks.push({ start: msToIso(startMs), end: msToIso(endMs) });
    endMs = startMs - DAY_MS;
  }
  return chunks;
};

const isoDateToUtcDate = (iso: string) => new Date(`${iso}T00:00:00Z`);

const SummaryCard = ({ label, value, sub }: { label: string; value: number; sub?: string }) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.card}>
      <div className={classes.cardLabel}>{label}</div>
      <div className={classes.cardValueRow}>
        <span className={classes.cardValue}>{value.toLocaleString()}</span>
        {sub && <span className={classes.cardSub}>{sub}</span>}
      </div>
    </div>
  );
};

const SummaryCardSkeleton = ({ label }: { label: string }) => {
  const classes = useStyles(styles);
  return (
    <div className={classes.card}>
      <div className={classes.cardLabel}>{label}</div>
      <div className={classes.cardValueSkeleton} aria-hidden="true" />
    </div>
  );
};

/** Card labels, shared between the loading and loaded states so they stay in
 * sync. The traffic row mirrors the ai-2030 dashboard's cards; the activity
 * row is LessWrong-specific. */
const TRAFFIC_CARD_LABELS = [
  "Pageviews",
  "Unique visitors",
  "Pageviews / day",
  "Views / visitor",
] as const;
const ACTIVITY_CARD_LABELS = [
  "Posts published",
  "Comments posted",
  "Votes cast",
  "New users",
] as const;

const PanelSkeleton = ({ title }: { title: string }) => {
  const classes = useStyles(styles);
  return (
    <section className={classes.tableSkeleton}>
      <h2 className={classes.tableSkeletonTitle}>{title}</h2>
      {[90, 70, 55, 40, 30].map((widthPct) => (
        <div
          key={widthPct}
          className={classes.tableSkeletonRow}
          style={{ width: `${widthPct}%` }}
          aria-hidden="true"
        />
      ))}
    </section>
  );
};

const UsageStatsDashboard = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const apolloClient = useApolloClient();

  const [range, setRange] = useState<UsageStatsRange>(DEFAULT_RANGE);

  // Full-domain daily pageviews — the traffic graph behind the timeline
  // scrubber. Range-independent, so it lives outside the range-keyed query
  // and survives range changes; swept once per mount, in chunks, newest
  // first. Keyed by date so overlapping chunk responses merge cleanly.
  const [historyByDate, setHistoryByDate] = useState<Record<string, number> | null>(null);
  const historyStartedRef = useRef(false);

  const isAdmin = userIsAdmin(currentUser);
  const domainStartIso = moment.utc().subtract(USAGE_STATS_DOMAIN_MONTHS, "months").format("YYYY-MM-DD");

  const { start, end } = rangeToDates(range);
  const { data, loading, error } = useQuery(SiteUsageStatsQuery, {
    variables: {
      startDate: isoDateToUtcDate(start),
      endDate: isoDateToUtcDate(end),
    },
    skip: !isAdmin,
  });

  useEffect(() => {
    if (!isAdmin || historyStartedRef.current) return;
    historyStartedRef.current = true;
    let cancelled = false;
    // Sequential on purpose: the sweep is background garnish that shouldn't
    // compete with the user-triggered range queries for analytics-DB
    // capacity. Any failure just ends the sweep — a partial graph is strictly
    // better than none.
    void (async () => {
      for (const chunk of historyChunkBounds(domainStartIso)) {
        try {
          const result = await apolloClient.query({
            query: SiteUsageHistoryQuery,
            variables: {
              startDate: isoDateToUtcDate(chunk.start),
              endDate: isoDateToUtcDate(chunk.end),
            },
          });
          if (cancelled) return;
          const points = result.data?.SiteUsageHistory;
          if (!points) return;
          setHistoryByDate((prev) => {
            const next = { ...prev };
            for (const point of points) {
              next[point.date] = point.views;
            }
            return next;
          });
        } catch {
          return;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, apolloClient, domainStartIso]);

  if (!isAdmin) {
    return (
      <SingleColumnSection>
        <p>Sorry, you do not have permission to do this at this time.</p>
      </SingleColumnSection>
    );
  }

  const stats = data?.SiteUsageStats;
  const days = stats?.days ?? [];
  const dayCount = rangeDayCount(range);

  const history: UsageHistoryPoint[] | null = historyByDate
    ? Object.entries(historyByDate)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([date, views]) => ({ date, views }))
    : null;

  const uniqueShare =
    stats && stats.totalViews > 0
      ? (stats.totalUniqueViews / stats.totalViews) * 100
      : 0;

  const totalPostsPublished = days.reduce((sum, day) => sum + day.postsPublished, 0);
  const totalCommentsPosted = days.reduce((sum, day) => sum + day.commentsPosted, 0);
  const totalVotesCast = days.reduce((sum, day) => sum + day.votesCast, 0);
  const totalNewUsers = days.reduce((sum, day) => sum + day.newUsers, 0);

  const rangeLabel =
    range.kind === "days" ? `last ${range.days} days` : `${range.start} to ${range.end}`;

  return (
    <SingleColumnSection>
      <div className={classes.root}>
        <h1 className={classes.pageTitle}>Site usage</h1>

        {/* The date-range control: the recent life of the site as a
            scrubbable timeline. Dragging edits a local draft inside the
            component; only a released selection reaches setRange (which
            refetches everything below). */}
        <UsageTimelineScrubber
          domainStart={domainStartIso}
          value={range}
          maxDays={MAX_USAGE_STATS_RANGE_DAYS}
          onChange={setRange}
          history={history}
        />

        {error ? (
          <div className={classes.errorNotice}>
            Couldn&apos;t load usage stats: {error.message}
          </div>
        ) : (
          <>
            {stats && !loading ? (
              <>
                <div className={classes.cardsGrid}>
                  <SummaryCard label="Pageviews" value={stats.totalViews} />
                  <SummaryCard
                    label="Unique visitors"
                    value={stats.totalUniqueViews}
                    sub={`${uniqueShare.toFixed(0)}% of views`}
                  />
                  <SummaryCard
                    label="Pageviews / day"
                    value={Math.round(stats.totalViews / dayCount)}
                  />
                  <SummaryCard
                    label="Views / visitor"
                    value={
                      Math.round((stats.totalViews / Math.max(1, stats.totalUniqueViews)) * 10) / 10
                    }
                  />
                </div>
                <div className={classes.cardsGrid}>
                  <SummaryCard label="Posts published" value={totalPostsPublished} />
                  <SummaryCard label="Comments posted" value={totalCommentsPosted} />
                  <SummaryCard label="Votes cast" value={totalVotesCast} />
                  <SummaryCard label="New users" value={totalNewUsers} />
                </div>
              </>
            ) : (
              <>
                <div className={classes.cardsGrid}>
                  {TRAFFIC_CARD_LABELS.map((label) => (
                    <SummaryCardSkeleton key={label} label={label} />
                  ))}
                </div>
                <div className={classes.cardsGrid}>
                  {ACTIVITY_CARD_LABELS.map((label) => (
                    <SummaryCardSkeleton key={label} label={label} />
                  ))}
                </div>
              </>
            )}

            <section className={classes.chartSection}>
              <h2 className={classes.chartTitle}>Daily traffic — {rangeLabel}</h2>
              {stats && !loading ? (
                <UsageDailyBarChart
                  data={days.map((day) => ({
                    date: day.date,
                    primary: day.uniqueViews,
                    secondary: day.views,
                  }))}
                  primaryLabel="unique visitors"
                  secondaryLabel="pageviews"
                  shareLabel="unique"
                />
              ) : (
                <div className={classes.chartSkeleton} aria-hidden="true" />
              )}
            </section>

            <section className={classes.chartSection}>
              <h2 className={classes.chartTitle}>Community activity — {rangeLabel}</h2>
              {stats && !loading ? (
                <UsageDailyBarChart
                  data={days.map((day) => ({
                    date: day.date,
                    primary: day.commentsPosted,
                    secondary: day.votesCast,
                  }))}
                  primaryLabel="comments"
                  secondaryLabel="votes"
                />
              ) : (
                <div className={classes.chartSkeleton} aria-hidden="true" />
              )}
            </section>

            {stats && !loading ? (
              <UsageTopPostsTable posts={stats.topPosts} totalViews={stats.totalViews} />
            ) : (
              <PanelSkeleton title="Top posts" />
            )}
          </>
        )}
      </div>
    </SingleColumnSection>
  );
};

export default UsageStatsDashboard;
