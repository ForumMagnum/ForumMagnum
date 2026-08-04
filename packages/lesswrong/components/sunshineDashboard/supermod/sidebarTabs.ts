/**
 * Which composer is open in the moderation sidebar. Null until the moderator
 * picks one, so no editor holds focus and the keyboard shortcuts keep working.
 */
export type SidebarTab = 'dm' | 'reject';
export type SelectedSidebarTab = SidebarTab | null;
