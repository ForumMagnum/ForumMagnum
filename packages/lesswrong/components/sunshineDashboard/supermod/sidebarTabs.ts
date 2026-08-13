/**
 * Which composer is open in the moderation sidebar. Null until the moderator
 * picks one, so no editor holds focus and the keyboard shortcuts keep working.
 * The three reject tabs are the same composer; they differ in what submitting
 * the composed rejection does beyond rejecting the content.
 */
export type RejectSidebarTab = 'reject' | 'rejectAndRemove' | 'rejectRestrictAndNotify';
export type SidebarTab = 'dm' | RejectSidebarTab;
export type SelectedSidebarTab = SidebarTab | null;

const REJECT_SIDEBAR_TABS: ReadonlySet<SidebarTab> = new Set<SidebarTab>(['reject', 'rejectAndRemove', 'rejectRestrictAndNotify']);

export function isRejectTab(tab: SelectedSidebarTab): tab is RejectSidebarTab {
  return !!tab && REJECT_SIDEBAR_TABS.has(tab);
}
