export interface SettingsOption {
  label: string;
  tooltip?: string;
}

export const SORT_ORDER_OPTIONS: { [key: string]: SettingsOption; } = {
  magic: { label: 'Magic (New & Upvoted)', tooltip: 'Posts with the highest karma from the past few days' },
  topAdjusted: { label: 'Top (Inflation Adjusted)', tooltip: 'Posts with the highest karma relative to those posted around the same time' },
  recentComments: { label: 'Recent Comments' },
  new: { label: 'New' },
  old: { label: 'Old' },
  top: { label: 'Top' },
}
