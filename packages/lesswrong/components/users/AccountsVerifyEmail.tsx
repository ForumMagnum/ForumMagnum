import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useState } from 'react';
import { withApollo } from '@apollo/client/react/hoc';
import { userEmailAddressIsVerified } from '../../lib/collections/users/helpers';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil'
import { Accounts } from '../../platform/current/lib/meteorAccounts';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    textAlign: "center",
  }
});

const AccountsVerifyEmail = ({classes, client}: {
  classes: ClassesType,
  client?: any,
}) => {
  const currentUser = useCurrentUser();
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
    if (userEmailAddressIsVerified(currentUser)) {
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
const AccountsVerifyEmailComponent = registerComponent('AccountsVerifyEmail', AccountsVerifyEmail, {
  styles,
  hocs: [withApollo],
});

declare global {
  interface ComponentTypes {
    AccountsVerifyEmail: typeof AccountsVerifyEmailComponent,
  }
}


