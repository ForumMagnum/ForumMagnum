import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';

const styles = theme => ({
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

registerComponent('ResendVerificationEmailPage', ResendVerificationEmailPage,
  withUser, withStyles(styles, {name: "ResendVerificationEmailPage"}));
