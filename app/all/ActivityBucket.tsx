"use client";

import React, { useState } from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import LoadMore from '@/components/common/LoadMore';
import BucketHeader from './BucketHeader';
import BucketBody from './BucketBody';
import BucketControls from './BucketControls';
import { useActivityBucketItems } from './useActivityBucketItems';
import { useGradualReveal } from './useGradualReveal';
import { useCompactBuckets } from './useCompactBuckets';
import type { ActivitySortBy } from './types';

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
  const [sortBy, setSortBy] = useState<ActivitySortBy>('top');
  const { compact, toggleCompact } = useCompactBuckets();
  const { items, isInitialLoading } = useActivityBucketItems({ after, before, secondaryReady, sortBy });
  const { visibleItems, visibleCount, totalCount, hasMore, showAll } = useGradualReveal(items, INITIAL_VISIBLE);
  return (
    <div className={classes.bucket}>
      <BucketHeader label={label}>
        <BucketControls sortBy={sortBy} onSortChange={setSortBy} compact={compact} onToggleCompact={toggleCompact} />
      </BucketHeader>
      <BucketBody items={visibleItems} isInitialLoading={isInitialLoading} compact={compact} />
      {hasMore && (
        <div className={classes.loadMore}>
          <LoadMore loadMore={showAll} count={visibleCount} totalCount={totalCount} />
        </div>
      )}
    </div>
  );
};

export default ActivityBucket;
