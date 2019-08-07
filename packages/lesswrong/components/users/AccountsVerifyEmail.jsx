import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { useEffect, useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { withApollo } from 'react-apollo';
import Users from 'meteor/vulcan:users';
import withUser from '../common/withUser';
import { useLocation } from '../../lib/routeUtil'

const styles = theme => ({
  root: {
    textAlign: "center",
  }
});

const AccountsVerifyEmail = ({currentUser, classes, client}) => {
  const { params } = useLocation()
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    Accounts.verifyEmail(params.token, (verifyEmailResult) => {
      if(verifyEmailResult && verifyEmailResult.error) {
        setError(verifyEmailResult.reason)
      } else {
        setError(null)
        setSuccess(true)
        // Reset the Apollo cache. Unfortunately there isn't
        // really a more granular way to do this (see
        // https://github.com/apollographql/apollo-feature-requests/issues/4 ).
        // For LW2, this ensures that, if you navigate from
        // the "Your email address has been verified" page
        // to the "Edit Account" page, you won't see a
        // widget telling you your address is still
        // unverified.
        client.resetStore();
      }
    });
  })

  if (success) {
    return <div className={classes.root}>
      Your email address has been verified.
    </div>
  }

  
  if(error) {
    if (Users.emailAddressIsVerified(currentUser)) {
      return (
        <div className={classes.root}>
          Your email address is already verified.
        </div>
      );
    } else {
      return (
        <div className={classes.root}>
          {error}
        </div>
      );
    }
  } 
  return (
    <div className={classes.root}>
      <Components.Loading />
    </div>
  );
}

// Shadows AccountsVerifyEmail in meteor/vulcan:accounts
registerComponent('AccountsVerifyEmail', AccountsVerifyEmail,
  withApollo, withUser,
  withStyles(styles, { name: "AccountsVerifyEmail" }));

