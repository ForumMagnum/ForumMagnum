import type { AddOnSubmitCallback, AddOnSuccessCallback } from '@/components/editor/EditorFormComponent';
import { EditorFormComponent } from '@/components/editor/EditorFormComponent';
import { isLWorAF } from '@/lib/instanceSettings';
import classNames from 'classnames';
import SettingsSection from './SettingsSection';
import SettingsTextRow from './SettingsTextRow';
import { TopPostsManager } from './TopPostsManager';
import type { SettingsTabProps } from './settingsTabTypes';

interface ProfileSettingsTabProps extends SettingsTabProps {
  addOnSubmitBiographyCallback: AddOnSubmitCallback<UsersEdit>;
  addOnSuccessBiographyCallback: AddOnSuccessCallback<UsersEdit>;
}

const ProfileSettingsTab = ({
  form,
  fieldWrapperClass,
  addOnSubmitBiographyCallback,
  addOnSuccessBiographyCallback,
}: ProfileSettingsTabProps) => {
  return (
    <div>
      <SettingsSection title="Pinned Posts" description="Choose which posts appear at the top of your profile">
        <form.Field name="pinnedPostIds">
          {(pinnedPostIdsField) => (
            <form.Field name="hideProfileTopPosts">
              {(hideTopPostsField) => (
                <TopPostsManager
                  userId={form.state.values._id}
                  field={pinnedPostIdsField}
                  hideField={hideTopPostsField}
                />
              )}
            </form.Field>
          )}
        </form.Field>
      </SettingsSection>

      {(
                  <SettingsSection title="Biography" description="Tell other users about yourself">
                    <div className={classNames("form-component-EditorFormComponent", fieldWrapperClass)}>
                      <form.Field name="biography">
                        {(field) => (
                          <EditorFormComponent
                            field={field}
                            name="biography"
                            formType="edit"
                            document={form.state.values}
                            addOnSubmitCallback={addOnSubmitBiographyCallback}
                            addOnSuccessCallback={addOnSuccessBiographyCallback}
                            hintText="Tell us about yourself"
                            fieldName="biography"
                            collectionName="Users"
                            label="Bio"
                            commentEditor={true}
                            commentStyles={true}
                            hideControls={false}
                          />
                        )}
                      </form.Field>
                    </div>
                  </SettingsSection>
                )}

      {isLWorAF() && (
        <SettingsSection title="Full Name">
          <form.Field name="fullName">
            {(field) => (
              <SettingsTextRow
                field={field}
                label="Full name"
                description="Your legal name, if different from your display name"
              />
            )}
          </form.Field>
        </SettingsSection>
      )}
    </div>
  );
};

export default ProfileSettingsTab;
