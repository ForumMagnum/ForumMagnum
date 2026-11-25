import React from 'react';
import classNames from 'classnames';
import { TopPostsManager } from './TopPostsManager';
import AutoSavedEditorField from '@/components/editor/AutoSavedEditorField';
import { commitUserEditorField } from './useAutoSavedUserSettings';
import SettingsSection from './SettingsSection';
import SettingsTextRow from './SettingsTextRow';
import { HighlightableField } from './HighlightableField';
import type { SettingsTabProps } from './settingsTabTypes';
import { userCanEditNarrationSettings } from '@/lib/collections/users/helpers';
import NarrationVoiceSetting from '@/components/narration/NarrationVoiceSetting';
import NarrationNamePronunciationSetting from '@/components/narration/NarrationNamePronunciationSetting';

const ProfileSettingsTab = ({
  settings,
  updateSettings,
  currentUser,
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

        <SettingsSection title="Biography" description="Tell other users about yourself">
          <div className={classNames("form-component-EditorFormComponent", fieldWrapperClass)}>
            <AutoSavedEditorField
              document={settings}
              fieldName="biography"
              collectionName="Users"
              hintText="Tell us about yourself"
              label="Bio"
              commentEditor
              commentStyles
              hideControls={false}
              onCommit={commitUserEditorField(updateSettings, "biography")}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Full Name">
          <SettingsTextRow
            value={settings.fullName}
            onCommit={(value) => void updateSettings({ fullName: value })}
            label="Full name"
            description="Your legal name, if different from your display name"
          />
        </SettingsSection>

        {userCanEditNarrationSettings(currentUser, settings) && <SettingsSection title="Narration">
          <HighlightableField name="narrationVoiceId">
            <NarrationVoiceSetting
              value={settings.narrationVoiceId}
              onChange={(value) => void updateSettings({ narrationVoiceId: value })}
            />
          </HighlightableField>
          <NarrationNamePronunciationSetting
            userId={settings._id}
            value={settings.narrationNamePronunciation}
            onSave={(value) => updateSettings({ narrationNamePronunciation: value })}
          />
        </SettingsSection>}
    </div>
  );
};

export default ProfileSettingsTab;
