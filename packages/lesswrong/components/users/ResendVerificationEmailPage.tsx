import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType) => ({
  root: {
    textAlign: "center",
  },
});

const ResendVerificationEmailPage = ({classes}: {
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
      <Components.UsersEmailVerification resend />
    </div>;
  }
}

const ResendVerificationEmailPageComponent = registerComponent('ResendVerificationEmailPage', ResendVerificationEmailPage, {styles});

declare global {
  interface ComponentTypes {
    ResendVerificationEmailPage: typeof ResendVerificationEmailPageComponent
  }
}
