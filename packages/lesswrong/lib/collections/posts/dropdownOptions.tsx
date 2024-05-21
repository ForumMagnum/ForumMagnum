import React from 'react';
import { TupleSet, UnionOf } from "../../utils/typeGuardUtils";
import { isFriendlyUI } from '../../../themes/forumTheme';
import type { ForumIconName } from '../../../components/common/ForumIcon';

export interface SettingsOption {
  label: string | JSX.Element;
  shortLabel?: string | React.ReactNode;
  tooltip?: string;
  icon?: ForumIconName,
}

export const SORT_ORDER_OPTIONS: Record<PostSortingMode,SettingsOption> = {
  magic: {
    label: isFriendlyUI ? 'New & upvoted' : 'Magic (New & Upvoted)',
    tooltip: 'Posts with the highest karma from the past few days',
  },
  top: { label: 'Top' },
  topAdjusted: {
    label: isFriendlyUI ? 'Top (inflation-adjusted)' : 'Top (Inflation Adjusted)',
    tooltip: 'Posts with the highest karma relative to those posted around the same time',
  },
  recentComments: { label: isFriendlyUI ? 'Recent comments' : 'Recent Comments' },
  new: { label: 'New' },
  old: { label: 'Old' },
}

export const postsLayouts = new TupleSet(["card", "list"] as const)
export type PostsLayout = UnionOf<typeof postsLayouts>
export const isPostsLayout = (tab: string): tab is PostsLayout => postsLayouts.has(tab)
export const defaultPostsLayout: PostsLayout = "list"
