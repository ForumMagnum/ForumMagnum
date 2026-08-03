/**
 * Which composer is showing in the moderation sidebar: a DM to the user, or a
 * rejection of their currently-selected content. Null until the moderator picks
 * one — neither form is open by default, so the keyboard shortcuts keep working.
 */
export type SidebarTab = 'dm' | 'reject';
export type SelectedSidebarTab = SidebarTab | null;
