/**
 * Which composer the moderator has picked in the moderation sidebar. Null until
 * they pick one, so no editor holds focus and the keyboard shortcuts keep
 * working; the reject panel still shows while it's null, just without focus.
 */
export type SidebarTab = 'dm' | 'reject';
export type SelectedSidebarTab = SidebarTab | null;
