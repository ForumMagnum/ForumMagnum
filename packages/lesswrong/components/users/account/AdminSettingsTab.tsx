import React from 'react';
import { isEAForum, isLWorAF } from '@/lib/instanceSettings';
import { getAllUserGroups, userIsAdmin, userIsAdminOrMod, userIsMemberOf } from '@/lib/vulcan-users/permissions';
import { SOCIAL_MEDIA_PROFILE_FIELDS } from '@/lib/collections/users/helpers';
import { FormComponentDatePicker } from '@/components/form-components/FormComponentDateTime';
import { FormComponentCheckboxGroup } from '@/components/form-components/FormComponentCheckboxGroup';
import PrefixedInput from '@/components/form-components/PrefixedInput';
import SettingsSection from './SettingsSection';
import SettingsTextRow from './SettingsTextRow';
import SettingsToggleRow from './SettingsToggleRow';
import SoftDeleteUserSection from './SoftDeleteUserSection';
import type { SettingsTabProps } from './settingsTabTypes';

const GROUP_OPTIONS = Object.keys(getAllUserGroups())
  .filter(group => group !== "guests" && group !== "members" && group !== "admins")
  .map((group) => ({ value: group, label: group }));

const AdminSettingsTab = ({
  form,
  currentUser,
  fieldWrapperClass,
}: SettingsTabProps) => {
  return (
    <div>
      <SettingsSection title="User Info">
        {userIsAdminOrMod(currentUser) && (
          <form.Field name="previousDisplayName">
            {(field) => (
              <SettingsTextRow
                field={field}
                label="Previous display name"
              />
            )}
          </form.Field>
        )}

        {userIsAdmin(currentUser) && (
          <form.Field name="slug">
            {(field) => (
              <SettingsTextRow
                field={field}
                label="Slug"
                description="URL-safe identifier for this user's profile"
              />
            )}
          </form.Field>
        )}

        {isEAForum() && (
          <div className={fieldWrapperClass}>
            <form.Field name="twitterProfileURLAdmin">
              {(field) => (
                <PrefixedInput
                  field={field}
                  inputPrefix={SOCIAL_MEDIA_PROFILE_FIELDS.twitterProfileURL}
                  heading="Social media (private, for admin use)"
                  smallBottomMargin={false}
                />
              )}
            </form.Field>
          </div>
        )}

        <form.Field name="shortformFeedId">
          {(field) => (
            <SettingsTextRow
              field={field}
              label="Quick takes feed ID"
            />
          )}
        </form.Field>

        {userIsAdmin(currentUser) && (
          <form.Field name="abTestKey">
            {(field) => (
              <SettingsTextRow
                field={field}
                label="A/B test key"
              />
            )}
          </form.Field>
        )}
      </SettingsSection>

      <SettingsSection title="Sunshine Review">
        <form.Field name="sunshineFlagged">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Sunshine flagged"
            />
          )}
        </form.Field>

        <form.Field name="needsReview">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Needs review"
            />
          )}
        </form.Field>

        <form.Field name="sunshineSnoozed">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Sunshine snoozed"
            />
          )}
        </form.Field>

        <form.Field name="snoozedUntilContentCount">
          {(field) => (
            <SettingsTextRow
              field={field}
              type="number"
              label="Snoozed until content count"
            />
          )}
        </form.Field>

        <form.Field name="reviewedByUserId">
          {(field) => (
            <SettingsTextRow
              field={field}
              label="Reviewed by user ID"
            />
          )}
        </form.Field>

        <div className={fieldWrapperClass}>
          <form.Field name="reviewedAt">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Reviewed at"
              />
            )}
          </form.Field>
        </div>

        <form.Field name="signUpReCaptchaRating">
          {(field) => (
            <SettingsTextRow
              field={field}
              type="number"
              label="Sign up reCAPTCHA rating"
              description="Edit to '1' if you're confident they're not a spammer"
            />
          )}
        </form.Field>
      </SettingsSection>

      <SettingsSection title="Display Overrides">
        <form.Field name="noindex">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="No index"
              description="Hide this user's profile from search engines"
            />
          )}
        </form.Field>

        {userIsAdmin(currentUser) && (
          <form.Field name="defaultToCKEditor">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Activate CKEditor by default"
              />
            )}
          </form.Field>
        )}

        {isLWorAF() && userIsAdmin(currentUser) && (
          <form.Field name="hideSunshineSidebar">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Hide Sunshine Sidebar"
              />
            )}
          </form.Field>
        )}

        <form.Field name="viewUnreviewedComments">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="View unreviewed comments"
            />
          )}
        </form.Field>
      </SettingsSection>

      <SettingsSection title="Disabled Privileges">
        <form.Field name="postingDisabled">
          {(field) => (
            <SettingsToggleRow field={field} label="Posting disabled" />
          )}
        </form.Field>
        <form.Field name="allCommentingDisabled">
          {(field) => (
            <SettingsToggleRow field={field} label="All commenting disabled" />
          )}
        </form.Field>
        <form.Field name="commentingOnOtherUsersDisabled">
          {(field) => (
            <SettingsToggleRow field={field} label="Commenting on other users disabled" />
          )}
        </form.Field>
        <form.Field name="conversationsDisabled">
          {(field) => (
            <SettingsToggleRow field={field} label="Conversations disabled" />
          )}
        </form.Field>
      </SettingsSection>

      <SettingsSection title="Ban & Purge">
        <form.Field name="nullifyVotes">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Nullify all past votes"
            />
          )}
        </form.Field>

        <form.Field name="deleteContent">
          {(field) => (
            <SettingsToggleRow
              field={field}
              label="Delete all user content"
            />
          )}
        </form.Field>

        <div className={fieldWrapperClass}>
          <form.Field name="banned">
            {(field) => (
              <FormComponentDatePicker
                field={field}
                label="Ban user until"
              />
            )}
          </form.Field>
        </div>

        {userIsAdmin(currentUser) && (
          <SoftDeleteUserSection userId={form.state.values._id} />
        )}
      </SettingsSection>

      {isLWorAF() && userIsAdmin(currentUser) && (
        <SettingsSection title="Prize / Payment Info">
          <form.Field name="paymentEmail">
            {(field) => (
              <SettingsTextRow
                field={field}
                label="Payment contact email"
                description="An email they'll definitely check where they can receive payment info"
                type="email"
              />
            )}
          </form.Field>

          <form.Field name="paymentInfo">
            {(field) => (
              <SettingsTextRow
                field={field}
                label="PayPal info"
                description="Their PayPal account info for sending small payments"
              />
            )}
          </form.Field>
        </SettingsSection>
      )}

      <SettingsSection title="Groups & Access">
        {(userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'realAdmins')) && (
          <form.Field name="isAdmin">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Admin"
              />
            )}
          </form.Field>
        )}

        <form.Field name="groups">
          {(field) => (
            <FormComponentCheckboxGroup
              field={field}
              options={GROUP_OPTIONS}
              label="Groups"
            />
          )}
        </form.Field>
      </SettingsSection>
    </div>
  );
};

export default AdminSettingsTab;
