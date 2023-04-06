import React from 'react';
import { isEAForum } from "../../instanceSettings";
import { TupleSet, UnionOf } from "../../utils/typeGuardUtils";
import { Components } from '../../../lib/vulcan-lib';

export interface SettingsOption {
  label: string | JSX.Element;
  shortLabel?: string | React.ReactNode;
  tooltip?: string;
}

export const SORT_ORDER_OPTIONS: Record<PostSortingMode,SettingsOption> = {
  magic: {
    label: isEAForum ? 'New & upvoted' : 'Magic (New & Upvoted)',
    tooltip: 'Posts with the highest karma from the past few days',
  },
  top: { label: 'Top' },
  topAdjusted: {
    label: isEAForum ? 'Top (inflation-adjusted)' : 'Top (Inflation Adjusted)',
    tooltip: 'Posts with the highest karma relative to those posted around the same time',
  },
  recentComments: { label: isEAForum ? 'Recent comments' : 'Recent Comments' },
  new: { label: 'New' },
  old: { label: 'Old' },
}

export const postsLayouts = new TupleSet(["card", "list"] as const)
export type PostsLayout = UnionOf<typeof postsLayouts>
export const isPostsLayout = (tab: string): tab is PostsLayout => postsLayouts.has(tab)
export const defaultPostsLayout: PostsLayout = "list"
