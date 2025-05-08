import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { UsersEmailVerification } from "./UsersEmailVerification";

const styles = (theme: ThemeType) => ({
  root: {
    textAlign: "center",
  },
});

const ResendVerificationEmailPageInner = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
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

export const ResendVerificationEmailPage = registerComponent('ResendVerificationEmailPage', ResendVerificationEmailPageInner, {styles});

declare global {
  interface ComponentTypes {
    ResendVerificationEmailPage: typeof ResendVerificationEmailPage
  }
}
