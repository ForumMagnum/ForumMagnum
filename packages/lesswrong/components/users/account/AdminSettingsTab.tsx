import React from 'react';
import { isLWorAF } from '@/lib/instanceSettings';
import { getAllUserGroups, userIsAdmin, userIsAdminOrMod, userIsMemberOf } from '@/lib/vulcan-users/permissions';
import { FormComponentCheckboxGroup } from '@/components/form-components/FormComponentCheckboxGroup';
import ExplicitSaveDateSetting from './ExplicitSaveDateSetting';
import SettingsSection from './SettingsSection';
import SettingsTextRow from './SettingsTextRow';
import SettingsToggleRow from './SettingsToggleRow';
import SoftDeleteUserSection from './SoftDeleteUserSection';
import type { SettingsTabProps } from './settingsTabTypes';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const GROUP_OPTIONS = Object.keys(getAllUserGroups())
  .filter(group => group !== "guests" && group !== "members" && group !== "admins")
  .map((group) => ({ value: group, label: group }));

const styles = defineStyles('AdminSettingsTab', (theme: ThemeType) => ({
  dangerAction: {
    padding: '12px 0',
    borderBottom: `1px solid ${theme.palette.greyAlpha(0.06)}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  dangerButton: {
    border: `1px solid ${theme.palette.error.main}`,
    borderRadius: 6,
    padding: '7px 16px',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    color: theme.palette.error.main,
    textTransform: 'none',
    background: 'none',
    cursor: 'pointer',
    '&:hover': {
      background: theme.palette.error.main,
      color: theme.palette.text.alwaysWhite,
    },
  },
  dangerDone: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[600],
  },
}));

const AdminSettingsTab = ({
  settings,
  updateSettings,
  bind,
  currentUser,
  fieldWrapperClass,
}: SettingsTabProps) => {
  const classes = useStyles(styles);

  const groupsBinding = {
    state: { value: settings.groups },
    handleChange: (newGroups: string[] | null | undefined) => {
      const oldGroups = settings.groups ?? [];
      const added = (newGroups ?? []).filter(g => !oldGroups.includes(g));
      const removed = oldGroups.filter(g => !(newGroups ?? []).includes(g));
      const changes = [
        ...added.map(g => `add "${g}"`),
        ...removed.map(g => `remove "${g}"`),
      ].join(', ');
      if (!window.confirm(`Change this user's groups: ${changes}?`)) return;
      void updateSettings({ groups: newGroups });
    },
  };

  const onNullifyVotes = () => {
    if (!window.confirm("Nullify all of this user's past votes? This cannot be undone from here.")) return;
    void updateSettings({ nullifyVotes: true });
  };

  const onDeleteContent = () => {
    if (!window.confirm("Delete all of this user's content? This cannot be undone from here.")) return;
    void updateSettings({ deleteContent: true });
  };

  const onToggleAdmin = (value: boolean) => {
    const message = value
      ? 'Grant this user admin privileges?'
      : "Remove this user's admin privileges?";
    if (!window.confirm(message)) return;
    void updateSettings({ isAdmin: value });
  };

  return (
    <div>
      <SettingsSection title="User Info">
        {userIsAdminOrMod(currentUser) && (
          <SettingsTextRow
            value={settings.previousDisplayName}
            onCommit={(value) => void updateSettings({ previousDisplayName: value })}
            label="Previous display name"
          />
        )}

        {userIsAdmin(currentUser) && (
          <SettingsTextRow
            value={settings.slug}
            onCommit={(value) => void updateSettings({ slug: value })}
            label="Slug"
            description="URL-safe identifier for this user's profile"
          />
        )}

        <SettingsTextRow
          value={settings.shortformFeedId}
          onCommit={(value) => void updateSettings({ shortformFeedId: value })}
          label="Quick takes feed ID"
        />

        {userIsAdmin(currentUser) && (
          <SettingsTextRow
            value={settings.abTestKey}
            onCommit={(value) => void updateSettings({ abTestKey: value })}
            label="A/B test key"
          />
        )}
      </SettingsSection>

      <SettingsSection title="Sunshine Review">
        <SettingsToggleRow
          value={settings.sunshineFlagged}
          onChange={(value) => void updateSettings({ sunshineFlagged: value })}
          label="Sunshine flagged"
        />

        <SettingsToggleRow
          value={settings.needsReview}
          onChange={(value) => void updateSettings({ needsReview: value })}
          label="Needs review"
        />

        <SettingsToggleRow
          value={settings.sunshineSnoozed}
          onChange={(value) => void updateSettings({ sunshineSnoozed: value })}
          label="Sunshine snoozed"
        />

        <SettingsTextRow
          type="number"
          value={settings.snoozedUntilContentCount}
          onCommit={(value) => void updateSettings({ snoozedUntilContentCount: value })}
          label="Snoozed until content count"
        />

        <SettingsTextRow
          value={settings.reviewedByUserId}
          onCommit={(value) => void updateSettings({ reviewedByUserId: value })}
          label="Reviewed by user ID"
        />

        <ExplicitSaveDateSetting
          label="Reviewed at"
          value={settings.reviewedAt}
          onSave={(value) => updateSettings({ reviewedAt: value })}
        />

        <SettingsTextRow
          type="number"
          value={settings.signUpReCaptchaRating}
          onCommit={(value) => void updateSettings({ signUpReCaptchaRating: value })}
          label="Sign up reCAPTCHA rating"
          description="Edit to '1' if you're confident they're not a spammer"
        />
      </SettingsSection>

      <SettingsSection title="Display Overrides">
        <SettingsToggleRow
          value={settings.noindex}
          onChange={(value) => void updateSettings({ noindex: value })}
          label="No index"
          description="Hide this user's profile from search engines"
        />

        {userIsAdmin(currentUser) && (
          <SettingsToggleRow
            value={settings.defaultToCKEditor}
            onChange={(value) => void updateSettings({ defaultToCKEditor: value })}
            label="Activate CKEditor by default"
          />
        )}

        {isLWorAF() && userIsAdmin(currentUser) && (
          <SettingsToggleRow
            value={settings.hideSunshineSidebar}
            onChange={(value) => void updateSettings({ hideSunshineSidebar: value })}
            label="Hide Sunshine Sidebar"
          />
        )}

        <SettingsToggleRow
          value={settings.viewUnreviewedComments}
          onChange={(value) => void updateSettings({ viewUnreviewedComments: value })}
          label="View unreviewed comments"
        />
      </SettingsSection>

      <SettingsSection title="Disabled Privileges">
        <SettingsToggleRow
          value={settings.postingDisabled}
          onChange={(value) => void updateSettings({ postingDisabled: value })}
          label="Posting disabled"
        />
        <SettingsToggleRow
          value={settings.allCommentingDisabled}
          onChange={(value) => void updateSettings({ allCommentingDisabled: value })}
          label="All commenting disabled"
        />
        <SettingsToggleRow
          value={settings.commentingOnOtherUsersDisabled}
          onChange={(value) => void updateSettings({ commentingOnOtherUsersDisabled: value })}
          label="Commenting on other users disabled"
        />
        <SettingsToggleRow
          value={settings.conversationsDisabled}
          onChange={(value) => void updateSettings({ conversationsDisabled: value })}
          label="Conversations disabled"
        />
      </SettingsSection>

      <SettingsSection title="Ban & Purge">
        <div className={classes.dangerAction}>
          {settings.nullifyVotes
            ? <span className={classes.dangerDone}>This user's past votes have been nullified.</span>
            : <button type="button" className={classes.dangerButton} onClick={onNullifyVotes}>
                Nullify all past votes
              </button>
          }
        </div>

        <div className={classes.dangerAction}>
          {settings.deleteContent
            ? <span className={classes.dangerDone}>This user's content has been deleted.</span>
            : <button type="button" className={classes.dangerButton} onClick={onDeleteContent}>
                Delete all user content
              </button>
          }
        </div>

        <ExplicitSaveDateSetting
          label="Ban user until"
          value={settings.banned}
          confirmMessage={(newValue) => newValue
            ? `Ban this user until ${newValue.toDateString()}?`
            : "Clear this user's ban?"}
          onSave={(value) => updateSettings({ banned: value })}
        />

        {userIsAdmin(currentUser) && (
          <SoftDeleteUserSection userId={settings._id} />
        )}
      </SettingsSection>

      {isLWorAF() && userIsAdmin(currentUser) && (
        <SettingsSection title="Prize / Payment Info">
          <SettingsTextRow
            type="email"
            value={settings.paymentEmail}
            onCommit={(value) => void updateSettings({ paymentEmail: value })}
            label="Payment contact email"
            description="An email they'll definitely check where they can receive payment info"
          />

          <SettingsTextRow
            value={settings.paymentInfo}
            onCommit={(value) => void updateSettings({ paymentInfo: value })}
            label="PayPal info"
            description="Their PayPal account info for sending small payments"
          />
        </SettingsSection>
      )}

      <SettingsSection title="Groups & Access">
        {(userIsAdmin(currentUser) || userIsMemberOf(currentUser, 'realAdmins')) && (
          <SettingsToggleRow
            value={settings.isAdmin}
            onChange={onToggleAdmin}
            label="Admin"
          />
        )}

        <FormComponentCheckboxGroup
          field={groupsBinding}
          options={GROUP_OPTIONS}
          label="Groups"
        />
      </SettingsSection>
    </div>
  );
};

export default AdminSettingsTab;
