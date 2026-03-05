import React from 'react';
import { isEAForum } from '@/lib/instanceSettings';
import { isFriendlyUI } from '@/themes/forumTheme';
import { hasAccountDeletionFlow } from '@/lib/betas';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import SettingsSection from './SettingsSection';
import SettingsTextRow from './SettingsTextRow';
import SettingsToggleRow from './SettingsToggleRow';
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
}));

interface AccountSettingsTabProps extends SettingsTabProps {
  isCurrentUser: boolean;
  requestPasswordReset: () => void;
  accountManagement: React.ReactNode | null;
}

const AccountSettingsTab = ({
  form,
  currentUser,
  isCurrentUser,
  requestPasswordReset,
  accountManagement,
}: AccountSettingsTabProps) => {
  const classes = useStyles(styles);

  return (
    <div>
      <SettingsSection title="Basic Info">
        {!isFriendlyUI() && (
          <form.Field name="displayName">
            {(field) => (
              <SettingsTextRow
                field={field}
                label="Display name"
                description="The name shown on your posts and comments"
              />
            )}
          </form.Field>
        )}

        <form.Field name="email">
          {(field) => (
            <SettingsTextRow
              field={field}
              disabled={isEAForum() && !form.state.values.hasAuth0Id}
              label="Email"
              type="email"
              description="Used for notifications and account recovery"
            />
          )}
        </form.Field>
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
        <SettingsSection title={"Deactivate Account"}>
          <form.Field name="deleted">
            {(field) => (
              <SettingsToggleRow
                field={field}
                label="Deactivate account"
                description="Your posts and comments will be listed as '[Anonymous]', and your user profile won't be accessible"
              />
            )}
          </form.Field>
        </SettingsSection>
      )}

      {accountManagement}
    </div>
  );
};

export default AccountSettingsTab;
