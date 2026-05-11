"use client";

import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import Loading from '@/components/vulcan-core/Loading';
import ActivityPostItem from './ActivityPostItem';
import ActivityCommentItem from './ActivityCommentItem';
import type { ActivityItem } from './types';

const styles = defineStyles('BucketBody', (theme: ThemeType) => ({
  empty: {
    fontSize: 13,
    color: theme.palette.greyAlpha(0.45),
    fontStyle: 'italic',
    padding: '6px 0',
  },
}));

// Renders a single feed entry by routing on its discriminator.
function renderItem(item: ActivityItem) {
  if (item.kind === 'post') {
    return <ActivityPostItem key={item.post._id} post={item.post} postedAt={item.postedAt} baseScore={item.baseScore} />;
  }
  return <ActivityCommentItem key={item.comment._id} comment={item.comment} postedAt={item.postedAt} baseScore={item.baseScore} />;
}

interface BucketBodyProps {
  items: ActivityItem[];
  isInitialLoading: boolean;
}

const BucketBody = ({items, isInitialLoading}: BucketBodyProps) => {
  const classes = useStyles(styles);
  if (isInitialLoading) return <Loading />;
  if (items.length === 0) return <div className={classes.empty}>Nothing in this window</div>;
  return <>{items.map(renderItem)}</>;
};

export default BucketBody;
