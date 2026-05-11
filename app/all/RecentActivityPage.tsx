"use client";

import React, { useEffect, useMemo, useState } from 'react';
import moment from 'moment';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SingleColumnSection from '@/components/common/SingleColumnSection';
import SectionTitle from '@/components/common/SectionTitle';
import ActivityBucket from './ActivityBucket';

const styles = defineStyles('RecentActivityPage', (theme: ThemeType) => ({
  page: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
}));

const RecentActivityPage = () => {
  const classes = useStyles(styles);
  const [secondaryReady, setSecondaryReady] = useState(false);

  useEffect(() => {
    setSecondaryReady(true);
  }, []);

  const ranges = useMemo(() => {
    const now = moment();
    const oneDayAgo = now.clone().subtract(1, 'day');
    const oneWeekAgo = now.clone().subtract(7, 'days');
    const oneMonthAgo = now.clone().subtract(30, 'days');
    const startOfToday = now.clone().startOf('day');
    const startOfYesterday = startOfToday.clone().subtract(1, 'day');
    return {
      day: { after: oneDayAgo.toISOString(), before: now.toISOString() },
      yesterday: { after: startOfYesterday.toISOString(), before: startOfToday.toISOString() },
      week: { after: oneWeekAgo.toISOString(), before: oneDayAgo.toISOString() },
      month: { after: oneMonthAgo.toISOString(), before: oneWeekAgo.toISOString() },
    };
  }, []);

  const buckets = [
    { label: 'Last Day', range: '0 - 24h', after: ranges.day.after, before: ranges.day.before },
    { label: 'Yesterday', range: 'local calendar day', after: ranges.yesterday.after, before: ranges.yesterday.before },
    { label: 'Last Week', range: '1 - 7 days', after: ranges.week.after, before: ranges.week.before },
    { label: 'Last Month', range: '7 - 30 days', after: ranges.month.after, before: ranges.month.before },
  ];

  return (
    <SingleColumnSection>
      <div className={classes.page}>
        <SectionTitle title="Recent Activity" />
        {buckets.map(bucket => (
          <ActivityBucket
            key={bucket.label}
            label={bucket.label}
            range={bucket.range}
            after={bucket.after}
            before={bucket.before}
            secondaryReady={secondaryReady}
          />
        ))}
      </div>
    </SingleColumnSection>
  );
};

export default RecentActivityPage;
