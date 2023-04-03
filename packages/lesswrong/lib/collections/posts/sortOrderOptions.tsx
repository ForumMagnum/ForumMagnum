import { isEAForum } from "../../instanceSettings";

export interface SettingsOption {
  label: string;
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
