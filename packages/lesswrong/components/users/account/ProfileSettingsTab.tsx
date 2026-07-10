import React from 'react';
import classNames from 'classnames';
import { isEAForum, isLWorAF } from '@/lib/instanceSettings';
import { TopPostsManager } from './TopPostsManager';
import AutoSavedEditorField from './AutoSavedEditorField';
import SettingsSection from './SettingsSection';
import SettingsTextRow from './SettingsTextRow';
import type { SettingsTabProps } from './settingsTabTypes';

const ProfileSettingsTab = ({
  settings,
  updateSettings,
  fieldWrapperClass,
}: SettingsTabProps) => {
  return (
    <div>
      <SettingsSection title="Pinned Posts" description="Choose which posts appear at the top of your profile">
        <TopPostsManager
          userId={settings._id}
          pinnedPostIds={settings.pinnedPostIds}
          hideTopPosts={settings.hideProfileTopPosts}
          updatePinnedPosts={updateSettings}
        />
      </SettingsSection>

      {!isEAForum() && (
        <SettingsSection title="Biography" description="Tell other users about yourself">
          <div className={classNames("form-component-EditorFormComponent", fieldWrapperClass)}>
            <AutoSavedEditorField
              name="biography"
              settings={settings}
              updateSettings={updateSettings}
              hintText="Tell us about yourself"
              label="Bio"
            />
          </div>
        </SettingsSection>
      )}

      {isLWorAF() && (
        <SettingsSection title="Full Name">
          <SettingsTextRow
            value={settings.fullName}
            onCommit={(value) => void updateSettings({ fullName: value })}
            label="Full name"
            description="Your legal name, if different from your display name"
          />
        </SettingsSection>
      )}
    </div>
  );
};

export default ProfileSettingsTab;
