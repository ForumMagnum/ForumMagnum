import React from 'react';
import { isEAForum } from '@/lib/instanceSettings';
import { isFriendlyUI } from '@/themes/forumTheme';
import { hasAccountDeletionFlow } from '@/lib/betas';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import SettingsSection from './SettingsSection';
import ExplicitSaveTextSetting from './ExplicitSaveTextSetting';
import type { SettingsTabProps } from './settingsTabTypes';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('AccountSettingsTab', (theme: ThemeType) => ({
  resetButtonWrapper: {
    padding: '12px 0',
  },
  resetButton: {
    border: `1px solid ${theme.palette.greyAlpha(0.2)}`,
    borderRadius: 6,
    padding: '7px 16px',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    color: theme.palette.grey[700],
    textTransform: 'none',
    background: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, color 0.15s ease',
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.4),
      color: theme.palette.grey[900],
      background: theme.palette.greyAlpha(0.03),
    },
  },
  deactivateWrapper: {
    padding: '12px 0',
  },
  deactivateDescription: {
    fontSize: 12.5,
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.grey[500],
    lineHeight: 1.45,
    marginBottom: 8,
  },
  deactivateButton: {
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
}));

interface AccountSettingsTabProps extends SettingsTabProps {
  requestPasswordReset: () => void;
  accountManagement: React.ReactNode | null;
}

const AccountSettingsTab = ({
  settings,
  updateSettings,
  isCurrentUser,
  requestPasswordReset,
  accountManagement,
}: AccountSettingsTabProps) => {
  const classes = useStyles(styles);

  const deactivated = !!settings.deleted;

  const onToggleDeactivated = () => {
    const message = deactivated
      ? 'Reactivate this account?'
      : 'Deactivate this account? Your posts and comments will be listed as "[Anonymous]", and your user profile won\'t be accessible.';
    if (!window.confirm(message)) return;
    void updateSettings({ deleted: !deactivated });
  };

  return (
    <div>
      <SettingsSection title="Basic Info">
        {!isFriendlyUI() && (
          <ExplicitSaveTextSetting
            label="Display name"
            description="The name shown on your posts and comments. Can only be changed a limited number of times."
            value={settings.displayName}
            onSave={(value) => updateSettings({ displayName: value })}
          />
        )}

        <ExplicitSaveTextSetting
          label="Email"
          type="email"
          description="Used for notifications and account recovery"
          value={settings.email}
          confirmMessage={(newValue) => `Change your account email to "${newValue}"?`}
          savedNote="Email updated."
          onSave={(value) => updateSettings({ email: value })}
        />
      </SettingsSection>

      {isCurrentUser && !isEAForum() && (
        <SettingsSection title="Security">
          <div className={classes.resetButtonWrapper}>
            <Button
              className={classes.resetButton}
              onClick={requestPasswordReset}
              disableRipple
            >
              Reset Password
            </Button>
          </div>
        </SettingsSection>
      )}

      {!hasAccountDeletionFlow() && (
        <SettingsSection title="Deactivate Account">
          <div className={classes.deactivateWrapper}>
            <div className={classes.deactivateDescription}>
              {deactivated
                ? 'This account is deactivated. Its posts and comments are listed as "[Anonymous]", and the user profile isn\'t accessible.'
                : 'Your posts and comments will be listed as "[Anonymous]", and your user profile won\'t be accessible.'}
            </div>
            <button
              type="button"
              className={classes.deactivateButton}
              onClick={onToggleDeactivated}
            >
              {deactivated ? 'Reactivate account' : 'Deactivate account'}
            </button>
          </div>
        </SettingsSection>
      )}

      {accountManagement}
    </div>
  );
};

export default AccountSettingsTab;
