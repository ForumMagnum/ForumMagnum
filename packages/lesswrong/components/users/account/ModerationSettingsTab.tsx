import React from 'react';
import classNames from 'classnames';
import { hasAuthorModeration } from '@/lib/betas';
import { MODERATION_GUIDELINES_OPTIONS } from '@/lib/collections/posts/constants';
import { getDefaultEditorPlaceholder } from '@/lib/editor/defaultEditorPlaceholder';
import { userIsAdminOrMod, userIsMemberOf } from '@/lib/vulcan-users/permissions';
import { EditorFormComponent } from '@/components/editor/EditorFormComponent';
import { FormUserMultiselect } from '@/components/form-components/UserMultiselect';
import type { AddOnSubmitCallback, AddOnSuccessCallback } from '@/components/editor/EditorFormComponent';
import SettingsSection from './SettingsSection';
import SettingsToggleRow from './SettingsToggleRow';
import SettingsSelectRow from './SettingsSelectRow';
import type { SettingsTabProps } from './settingsTabTypes';

interface ModerationSettingsTabProps extends SettingsTabProps {
  addOnSubmitModerationGuidelinesCallback: AddOnSubmitCallback<UsersEdit>;
  addOnSuccessModerationGuidelinesCallback: AddOnSuccessCallback<UsersEdit>;
}

const ModerationSettingsTab = ({
  form,
  currentUser,
  fieldWrapperClass,
  addOnSubmitModerationGuidelinesCallback,
  addOnSuccessModerationGuidelinesCallback,
}: ModerationSettingsTabProps) => {
  return (
    <div>
      {hasAuthorModeration() && (
        <SettingsSection title="Moderation Guidelines" description="Set the norms for discussions on your posts">
          <div className={classNames("form-component-EditorFormComponent", fieldWrapperClass)}>
            <form.Field name="moderationGuidelines">
              {(field) => (
                <EditorFormComponent
                  field={field}
                  name="moderationGuidelines"
                  formType="edit"
                  document={form.state.values}
                  addOnSubmitCallback={addOnSubmitModerationGuidelinesCallback}
                  addOnSuccessCallback={addOnSuccessModerationGuidelinesCallback}
                  hintText={getDefaultEditorPlaceholder()}
                  fieldName="moderationGuidelines"
                  collectionName="Users"
                  commentEditor={true}
                  commentStyles={true}
                  hideControls={false}
                />
              )}
            </form.Field>
          </div>

          <form.Field name="moderationStyle">
            {(field) => (
              <SettingsSelectRow
                field={field}
                options={MODERATION_GUIDELINES_OPTIONS}
                label="Moderation style"
                description="Tells commenters what kind of discussion you prefer"
              />
            )}
          </form.Field>

          <form.Field name="moderatorAssistance">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Moderator assistance"
                description="Allow site moderators to help enforce your moderation policy"
              />
            )}
          </form.Field>

          <form.Field name="collapseModerationGuidelines">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Collapse guidelines by default"
                description="On your posts, collapse your moderation guidelines by default"
              />
            )}
          </form.Field>
        </SettingsSection>
      )}

      <SettingsSection title="Banned Users" description="Users banned from commenting on your posts">
        {(userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'trustLevel1')) && <div className={fieldWrapperClass}>
          <form.Field name="bannedUserIds">
            {(field) => (
              <FormUserMultiselect
                field={field}
                label="Banned Users (All)"
              />
            )}
          </form.Field>
        </div>}

        {(userIsAdminOrMod(currentUser) || userIsMemberOf(currentUser, 'canModeratePersonal')) && <div className={fieldWrapperClass}>
          <form.Field name="bannedPersonalUserIds">
            {(field) => (
              <FormUserMultiselect
                field={field}
                label="Banned Users (Personal blog posts only)"
              />
            )}
          </form.Field>
        </div>}
      </SettingsSection>
    </div>
  );
};

export default ModerationSettingsTab;
