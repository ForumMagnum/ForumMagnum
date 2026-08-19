/** Which right-panel section is expanded. Null means every section is collapsed. */
export type SidebarTab = 'userMessages' | 'reject' | 'dm' | 'moderatorActions';
export type SelectedSidebarTab = SidebarTab | null;

export const DEFAULT_SIDEBAR_TAB: SidebarTab = 'userMessages';
