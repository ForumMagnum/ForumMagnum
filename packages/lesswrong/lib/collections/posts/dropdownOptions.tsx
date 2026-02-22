import React from 'react';
import type { ForumIconName } from '../../../components/common/ForumIcon';
import { TupleSet, UnionOf } from "../../utils/typeGuardUtils";

export interface SettingsOption {
  label: string | React.JSX.Element;
  shortLabel?: string | React.ReactNode;
  tooltip?: string;
  icon?: ForumIconName,
}

export const getSortOrderOptions = () => ({
  magic: {
    label: 'Magic (New & Upvoted)',
    tooltip: 'Posts with the highest karma from the past few days',
  },
  top: { label: 'Top' },
  topAdjusted: {
    label: 'Top (Inflation Adjusted)',
    tooltip: 'Posts with the highest karma relative to those posted around the same time',
  },
  recentComments: { label: 'Recent Comments' },
  new: { label: 'New' },
  old: { label: 'Old' },
} satisfies Record<PostSortingMode, SettingsOption>);

export const postsLayouts = new TupleSet(["card", "list"] as const)
export type PostsLayout = UnionOf<typeof postsLayouts>
export const isPostsLayout = (tab: string): tab is PostsLayout => postsLayouts.has(tab)
export const defaultPostsLayout: PostsLayout = "list"
