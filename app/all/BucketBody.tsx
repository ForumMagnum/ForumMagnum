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
function renderItem(item: ActivityItem, compact: boolean, expandedItemId: string | null, onToggleExpandedItem: (id: string) => void) {
  if (item.kind === 'post') {
    const id = item.post._id;
    return <ActivityPostItem key={id} post={item.post} postedAt={item.postedAt} baseScore={item.baseScore} compact={compact} expanded={expandedItemId === id} onToggle={() => onToggleExpandedItem(id)} />;
  }
  const id = item.comment._id;
  return <ActivityCommentItem key={id} comment={item.comment} postedAt={item.postedAt} baseScore={item.baseScore} compact={compact} expanded={expandedItemId === id} onToggle={() => onToggleExpandedItem(id)} />;
}

interface BucketBodyProps {
  items: ActivityItem[];
  isInitialLoading: boolean;
  compact: boolean;
  expandedItemId: string | null;
  onToggleExpandedItem: (id: string) => void;
}

const BucketBody = ({items, isInitialLoading, compact, expandedItemId, onToggleExpandedItem}: BucketBodyProps) => {
  const classes = useStyles(styles);
  if (isInitialLoading) return <Loading />;
  if (items.length === 0) return <div className={classes.empty}>Nothing in this window</div>;
  return <>{items.map(item => renderItem(item, compact, expandedItemId, onToggleExpandedItem))}</>;
};

export default BucketBody;
