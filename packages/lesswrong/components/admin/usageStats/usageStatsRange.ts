import moment from "moment";

/**
 * The dashboard's selected date range: either the trailing N days (ending
 * today, so it stays "recent" across page loads) or a fixed custom window.
 * Mirrors the range model of the ai-2030 analytics dashboard this UI is
 * based on.
 */
export type UsageStatsRange =
  | { kind: "days"; days: number }
  | { kind: "custom"; start: string; end: string };

/** Longest selectable window, and the chunk cap for the history sweep. Must
 * not exceed MAX_SITE_USAGE_RANGE_DAYS on the server. */
export const MAX_USAGE_STATS_RANGE_DAYS = 180;

/** How far back the timeline scrubber's domain reaches. Widening this makes
 * the background history sweep issue proportionally more queries. */
export const USAGE_STATS_DOMAIN_MONTHS = 24;

export const DAY_MS = 86_400_000;

export const isoToMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const msToIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Today as a UTC calendar date, matching the server's UTC day buckets. */
export const utcTodayIso = () => moment.utc().format("YYYY-MM-DD");

export const usageStatsRangeKey = (range: UsageStatsRange): string =>
  range.kind === "days" ? `days:${range.days}` : `custom:${range.start}:${range.end}`;

export const rangeDayCount = (range: UsageStatsRange): number =>
  range.kind === "days"
    ? range.days
    : Math.round((isoToMs(range.end) - isoToMs(range.start)) / DAY_MS) + 1;

/** Resolve a range to inclusive ISO date bounds. */
export const rangeToDates = (range: UsageStatsRange): { start: string; end: string } => {
  if (range.kind === "custom") {
    return { start: range.start, end: range.end };
  }
  const todayIso = utcTodayIso();
  return {
    start: msToIso(isoToMs(todayIso) - ((range.days - 1) * DAY_MS)),
    end: todayIso,
  };
};
