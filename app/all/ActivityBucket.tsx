"use client";

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LoadMore from '@/components/common/LoadMore';
import BucketHeader from './BucketHeader';
import BucketBody from './BucketBody';
import { useActivityBucketItems } from './useActivityBucketItems';
import { useGradualReveal } from './useGradualReveal';

const INITIAL_VISIBLE = 7;

const styles = defineStyles('ActivityBucket', (theme: ThemeType) => ({
  bucket: {
    marginBottom: 28,
  },
  loadMore: {
    marginTop: 6,
    marginLeft: 42,
    fontSize: 12,
  },
}));

interface ActivityBucketProps {
  label: string;
  range: string;
  after: string;
  before: string;
  secondaryReady: boolean;
}

const ActivityBucket = ({ label, range, after, before, secondaryReady }: ActivityBucketProps) => {
  const classes = useStyles(styles);
  const { items, isInitialLoading } = useActivityBucketItems({ after, before, secondaryReady });
  const { visibleItems, visibleCount, totalCount, hasMore, showAll } = useGradualReveal(items, INITIAL_VISIBLE);
  return (
    <div className={classes.bucket}>
      <BucketHeader label={label} />
      <BucketBody items={visibleItems} isInitialLoading={isInitialLoading} />
      {hasMore && (
        <div className={classes.loadMore}>
          <LoadMore loadMore={showAll} count={visibleCount} totalCount={totalCount} />
        </div>
      )}
    </div>
  );
};

export default ActivityBucket;
