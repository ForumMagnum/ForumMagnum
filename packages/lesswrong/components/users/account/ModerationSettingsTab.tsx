import React from 'react';
import classNames from 'classnames';
import { MODERATION_GUIDELINES_OPTIONS } from '@/lib/collections/posts/constants';
import { getDefaultEditorPlaceholder } from '@/lib/editor/defaultEditorPlaceholder';
import { userIsAdminOrMod, userIsMemberOf } from '@/lib/vulcan-users/permissions';
import { FormUserMultiselect } from '@/components/form-components/UserMultiselect';
import AutoSavedEditorField from './AutoSavedEditorField';
import SettingsSection from './SettingsSection';
import SettingsToggleRow from './SettingsToggleRow';
import SettingsSelectRow from './SettingsSelectRow';
import type { SettingsTabProps } from './settingsTabTypes';

const ModerationSettingsTab = ({
  settings,
  updateSettings,
  bind,
  currentUser,
  fieldWrapperClass,
}: SettingsTabProps) => {
  return (
    <div>
      <SettingsSection title="Moderation Guidelines" description="Set the norms for discussions on your posts">
          <div className={classNames("form-component-EditorFormComponent", fieldWrapperClass)}>
            <AutoSavedEditorField
              name="moderationGuidelines"
              settings={settings}
              updateSettings={updateSettings}
              hintText={getDefaultEditorPlaceholder()}
            />
          </div>

          <SettingsSelectRow
            value={settings.moderationStyle}
            onChange={(value) => void updateSettings({ moderationStyle: value })}
            options={MODERATION_GUIDELINES_OPTIONS}
            label="Moderation style"
            description="Tells commenters what kind of discussion you prefer"
          />

          <SettingsToggleRow
            value={settings.moderatorAssistance}
            onChange={(value) => void updateSettings({ moderatorAssistance: value })}
            label="Moderator assistance"
            description="Allow site moderators to help enforce your moderation policy"
          />

          <SettingsToggleRow
            value={settings.collapseModerationGuidelines}
            onChange={(value) => void updateSettings({ collapseModerationGuidelines: value })}
            label="Collapse guidelines by default"
            description="On your posts, collapse your moderation guidelines by default"
          />
      </SettingsSection>

      <SettingsSection title="Banned Users" description="Users banned from commenting on your posts">
        {(userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'trustLevel1')) && <div className={fieldWrapperClass}>
          <FormUserMultiselect
            field={bind('bannedUserIds')}
            label="Banned Users (All)"
          />
        </div>}

        {(userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'canModeratePersonal')) && <div className={fieldWrapperClass}>
          <FormUserMultiselect
            field={bind('bannedPersonalUserIds')}
            label="Banned Users (Personal blog posts only)"
          />
        </div>}
      </SettingsSection>
    </div>
  );
};

export default ModerationSettingsTab;
