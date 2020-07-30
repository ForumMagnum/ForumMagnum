import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import Users from '../../lib/collections/users/collection';
import withUser from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    textAlign: "center",
  },
});

const ResendVerificationEmailPage = ({currentUser, classes}) => {
  if (!currentUser) {
    return <div className={classes.root}>
      Log in to resend an email-address verification email.
    </div>;
  } else if (Users.emailAddressIsVerified(currentUser)) {
    return <div className={classes.root}>
      Your email address is already verified.
    </div>;
  } else {
    return <div className={classes.root}>
      <Components.UsersEmailVerification resend />
    </div>;
  }
}

const ResendVerificationEmailPageComponent = registerComponent('ResendVerificationEmailPage', ResendVerificationEmailPage, {
  styles,
  hocs: [withUser]
});

declare global {
  interface ComponentTypes {
    ResendVerificationEmailPage: typeof ResendVerificationEmailPageComponent
  }
}
