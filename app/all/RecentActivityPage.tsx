"use client";

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import SingleColumnSection from '@/components/common/SingleColumnSection';
import SectionTitle from '@/components/common/SectionTitle';
import ActivityBucket from './ActivityBucket';
import { useActivityRanges } from './useActivityRanges';
import { useSecondaryReady } from './useSecondaryReady';

const styles = defineStyles('RecentActivityPage', (theme: ThemeType) => ({
  page: {
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
}));

const RecentActivityPage = () => {
  const classes = useStyles(styles);
  const secondaryReady = useSecondaryReady();
  const buckets = useActivityRanges();
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
