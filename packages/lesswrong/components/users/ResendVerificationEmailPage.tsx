"use client";

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import UsersEmailVerification from "./UsersEmailVerification";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('ResendVerificationEmailPage', (theme: ThemeType) => ({
  root: {
    textAlign: "center",
  },
}));

const ResendVerificationEmailPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  if (!currentUser) {
    return <div className={classes.root}>
      Log in to resend an email-address verification email.
    </div>;
  } else if (userEmailAddressIsVerified(currentUser)) {
    return <div className={classes.root}>
      Your email address is already verified.
    </div>;
  } else {
    return <div className={classes.root}>
      <UsersEmailVerification resend />
    </div>;
  }
}

export default ResendVerificationEmailPage


