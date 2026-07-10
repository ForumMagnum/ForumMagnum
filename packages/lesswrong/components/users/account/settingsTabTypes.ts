import type { EditableUser } from '@/lib/collections/users/helpers';
import type { BindUserSetting, UpdateUserSettings } from './useAutoSavedUserSettings';

export const SETTINGS_TAB_IDS = [
  'account', 'profile', 'preferences', 'notifications', 'moderation', 'admin',
] as const;

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number];

export interface SettingsTabProps {
  settings: EditableUser;
  updateSettings: UpdateUserSettings;
  bind: BindUserSetting;
  currentUser: UsersCurrent;
  /** Whether the settings being edited belong to the logged-in user (false when an admin edits someone else) */
  isCurrentUser: boolean;
  fieldWrapperClass: string;
}
