import { useMemo } from 'react';
import moment from 'moment';

export interface ActivityBucketConfig {
  label: string;
  range: string;
  after: string;
  before: string;
}

// Configures the four time-window buckets shown on the /all page.
function computeActivityBuckets(): ActivityBucketConfig[] {
  const now = moment();
  const oneDayAgo = now.clone().subtract(1, 'day');
  const oneWeekAgo = now.clone().subtract(7, 'days');
  const oneMonthAgo = now.clone().subtract(30, 'days');
  const startOfToday = now.clone().startOf('day');
  const startOfYesterday = startOfToday.clone().subtract(1, 'day');
  return [
    { label: 'Today', range: '0 - 24h', after: oneDayAgo.toISOString(), before: now.toISOString() },
    { label: 'Yesterday', range: 'local calendar day', after: startOfYesterday.toISOString(), before: startOfToday.toISOString() },
    { label: 'Last Week', range: '1 - 7 days', after: oneWeekAgo.toISOString(), before: oneDayAgo.toISOString() },
    { label: 'Last Month', range: '7 - 30 days', after: oneMonthAgo.toISOString(), before: oneWeekAgo.toISOString() },
  ];
}

// Memoizes bucket time windows so they're computed once per page mount.
export function useActivityRanges() {
  return useMemo(computeActivityBuckets, []);
}
