import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('UsersEmailVerification', (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    marginLeft: theme.spacing.unit
  },
  verifyEmailButton: {
    marginTop: theme.spacing.unit
  }
}));

const UsersEmailVerification = ({ resend = false }: { resend?: boolean }) => {
  const classes = useStyles(styles);
  const [emailSent, setEmailSent] = useState(false);

  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();

  const sendConfirmationEmail = () => {
    if (!currentUser) return;
    void updateCurrentUser({
      whenConfirmationEmailSent: new Date()
    });
    setEmailSent(true);
  }
  
  if (userEmailAddressIsVerified(currentUser)) {
    return (
      <div className={classes.root}>
        Your email address is verified.
      </div>
    );
  } else if (emailSent) {
    return (
      <div className={classes.root}>
        Check your email for a confirmation link.
      </div>
    );
  } else {
    return (
      <div className={classes.root}>
        <div>You need to verify your email address to enable email notifications.</div>
        <Button color="secondary" variant="outlined"
          className={classes.verifyEmailButton}
          onClick={() => sendConfirmationEmail()}
        >
          {resend ? "Resend Confirmation Email"
                  : "Send Confirmation Email"}
        </Button>
      </div>
    );
  }
}


const UsersEmailVerificationComponent = registerComponent('UsersEmailVerification', UsersEmailVerification, {
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    UsersEmailVerification: typeof UsersEmailVerificationComponent
  }
}
